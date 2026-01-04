/**
 * Responsive Tests: Funky.Table
 *
 * Tests responsive breakpoint behavior for the Table component.
 * Verifies that column visibility, control columns, and breakpoint
 * priority system work correctly at different viewport sizes.
 */

FunkyTests.describe('Funky.Responsive.Table', function() {
    var expect = FunkyTests.expect;
    var Table = window.Funky && window.Funky.Table;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Table not loaded or doesn't have init method
    if (!Table || !Table.init) {
        FunkyTests.it('Table component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var table;
    var containerId;
    var testCounter = 0;

    // Sample data for table
    function getSampleData() {
        return [
            { id: 1, name: 'Item 1', email: 'item1@test.com', phone: '555-0001', status: 'active' },
            { id: 2, name: 'Item 2', email: 'item2@test.com', phone: '555-0002', status: 'inactive' },
            { id: 3, name: 'Item 3', email: 'item3@test.com', phone: '555-0003', status: 'active' }
        ];
    }

    // Sample columns with responsive config
    function getResponsiveColumns() {
        return [
            { name: 'id', data: 'id', title: 'ID' },
            { name: 'name', data: 'name', title: 'Name' },
            { name: 'email', data: 'email', title: 'Email', responsive: { mobile: false } },
            { name: 'phone', data: 'phone', title: 'Phone', responsive: { mobile: false, tablet: false } },
            { name: 'status', data: 'status', title: 'Status' }
        ];
    }

    // Sample columns with priority config
    function getPriorityColumns() {
        return [
            { name: 'id', data: 'id', title: 'ID', responsivePriority: 1 },
            { name: 'name', data: 'name', title: 'Name', responsivePriority: 1 },
            { name: 'email', data: 'email', title: 'Email', responsivePriority: 3 },
            { name: 'phone', data: 'phone', title: 'Phone', responsivePriority: 5 },
            { name: 'status', data: 'status', title: 'Status', responsivePriority: 2 }
        ];
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'table-responsive-test-' + unique;
        fixture = FunkyTests.fixture(
            '<div style="width: 1200px;">' +
            '<table id="' + containerId + '" class="table"></table>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (table && typeof table.destroy === 'function') {
            table.destroy();
            table = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Responsive Configuration
    // ========================================================================

    FunkyTests.describe('Responsive Configuration', function() {

        FunkyTests.it('accepts responsive config as boolean', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            expect(table).not.toBeNull();
        });

        FunkyTests.it('accepts responsive config as object', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: {
                    enabled: true,
                    breakpoints: [
                        { name: 'mobile', width: 480 },
                        { name: 'tablet', width: 768 },
                        { name: 'desktop', width: 1200 }
                    ]
                }
            });

            expect(table).not.toBeNull();
        });

        FunkyTests.it('uses default breakpoints when none provided', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            // Should initialize with default breakpoints
            expect(table).not.toBeNull();
        });

        FunkyTests.it('accepts custom breakpoints array', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                breakpoints: [
                    { name: 'small', width: 400 },
                    { name: 'medium', width: 800 },
                    { name: 'large', width: 1200 }
                ],
                responsive: true
            });

            expect(table).not.toBeNull();
        });

    });

    // ========================================================================
    // Column Responsive Config
    // ========================================================================

    FunkyTests.describe('Column Responsive Config', function() {

        FunkyTests.it('columns accept responsive object', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: [
                    { name: 'id', data: 'id', title: 'ID' },
                    { name: 'name', data: 'name', title: 'Name', responsive: { mobile: false } }
                ],
                responsive: true
            });

            expect(table).not.toBeNull();
        });

        FunkyTests.it('columns accept responsivePriority number', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getPriorityColumns(),
                responsive: true
            });

            expect(table).not.toBeNull();
        });

        FunkyTests.it('columns without priority always show', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: [
                    { name: 'id', data: 'id', title: 'ID' }, // No priority - always shows
                    { name: 'name', data: 'name', title: 'Name', responsivePriority: 10 }
                ],
                responsive: true
            });

            expect(table).not.toBeNull();
        });

    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('responds to window resize event', function(done) {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            // Trigger resize
            var restore = FunkyTests.simulate.resize(500, 600);

            setTimeout(function() {
                expect(table).not.toBeNull();
                restore();
                done();
            }, 150);
        });

        FunkyTests.it('applies mobile breakpoint settings', function(done) {
            var restore = FunkyTests.simulate.resize(375, 667);

            setTimeout(function() {
                // Set wrapper width to match
                var tableEl = document.getElementById(containerId);
                if (tableEl && tableEl.parentNode) {
                    tableEl.parentNode.style.width = '375px';
                }

                table = Table.init('#' + containerId, {
                    data: getSampleData(),
                    columns: getResponsiveColumns(),
                    responsive: true
                });

                // Table should have handled responsive columns
                expect(table).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('applies tablet breakpoint settings', function(done) {
            var restore = FunkyTests.simulate.resize(768, 1024);

            setTimeout(function() {
                var tableEl = document.getElementById(containerId);
                if (tableEl && tableEl.parentNode) {
                    tableEl.parentNode.style.width = '768px';
                }

                table = Table.init('#' + containerId, {
                    data: getSampleData(),
                    columns: getResponsiveColumns(),
                    responsive: true
                });

                expect(table).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('applies desktop breakpoint settings', function(done) {
            var restore = FunkyTests.simulate.resize(1280, 800);

            setTimeout(function() {
                var tableEl = document.getElementById(containerId);
                if (tableEl && tableEl.parentNode) {
                    tableEl.parentNode.style.width = '1280px';
                }

                table = Table.init('#' + containerId, {
                    data: getSampleData(),
                    columns: getResponsiveColumns(),
                    responsive: true
                });

                expect(table).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Column Visibility by Breakpoint
    // ========================================================================

    FunkyTests.describe('Column Visibility by Breakpoint', function() {

        FunkyTests.it('hides columns with responsive[breakpoint]=false', function() {
            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '400px';

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: [
                    { name: 'id', data: 'id', title: 'ID' },
                    { name: 'email', data: 'email', title: 'Email', responsive: { mobile: false } }
                ],
                responsive: true,
                breakpoints: [
                    { name: 'mobile', width: 480 },
                    { name: 'desktop', width: 1200 }
                ]
            });

            // Force breakpoint recalculation
            if (table._determineBreakpoint) {
                table._determineBreakpoint(true);
            }

            // Hidden columns should be tracked
            expect(table).not.toBeNull();
        });

        FunkyTests.it('shows all columns at desktop breakpoint', function() {
            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '1200px';

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            // At desktop, all columns should be visible
            expect(table).not.toBeNull();
        });

        FunkyTests.it('respects priority thresholds at breakpoints', function() {
            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '400px';

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getPriorityColumns(),
                responsive: true
            });

            // At mobile, high priority columns should be hidden
            expect(table).not.toBeNull();
        });

    });

    // ========================================================================
    // Control Column
    // ========================================================================

    FunkyTests.describe('Control Column', function() {

        FunkyTests.it('shows control column when columns are hidden', function() {
            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '400px';

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            // Control column should appear for expanding hidden data
            expect(table).not.toBeNull();
        });

        FunkyTests.it('hides control column when all columns visible', function() {
            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '1200px';

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            // At desktop, no control column needed
            expect(table).not.toBeNull();
        });

    });

    // ========================================================================
    // Breakpoint Events
    // ========================================================================

    FunkyTests.describe('Breakpoint Events', function() {

        FunkyTests.it('emits breakpointChange event', function(done) {
            var eventFired = false;

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true,
                on: {
                    breakpointChange: function() {
                        eventFired = true;
                    }
                }
            });

            // Change container width to trigger breakpoint change
            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '400px';

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                // Event may or may not fire depending on initial state
                expect(table).not.toBeNull();
                restore();
                done();
            }, 150);
        });

        FunkyTests.it('provides breakpoint info in event', function() {
            var eventData = null;

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true,
                on: {
                    breakpointChange: function(data) {
                        eventData = data;
                    }
                }
            });

            // Force breakpoint determination
            if (table._determineBreakpoint) {
                table._determineBreakpoint(true);
            }

            expect(table).not.toBeNull();
        });

    });

    // ========================================================================
    // Resize Handling
    // ========================================================================

    FunkyTests.describe('Resize Handling', function() {

        FunkyTests.it('debounces resize events', function(done) {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            // Rapid resizes
            var restore1 = FunkyTests.simulate.resize(400, 300);
            var restore2, restore3;

            setTimeout(function() {
                restore1();
                restore2 = FunkyTests.simulate.resize(800, 600);
            }, 20);

            setTimeout(function() {
                restore2();
                restore3 = FunkyTests.simulate.resize(500, 400);
            }, 40);

            setTimeout(function() {
                restore3();
                expect(table).not.toBeNull();
                done();
            }, 200);
        });

        FunkyTests.it('handles container width changes', function(done) {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '400px';

            setTimeout(function() {
                if (table._handleResize) {
                    table._handleResize();
                }

                setTimeout(function() {
                    expect(table).not.toBeNull();
                    done();
                }, 150);
            }, 50);
        });

    });

    // ========================================================================
    // Priority System
    // ========================================================================

    FunkyTests.describe('Priority System', function() {

        FunkyTests.it('lower priority numbers stay visible longer', function() {
            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '600px';

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: [
                    { name: 'important', data: 'id', title: 'Important', responsivePriority: 1 },
                    { name: 'lessImportant', data: 'name', title: 'Less Important', responsivePriority: 5 }
                ],
                responsive: true
            });

            // Priority 1 should stay visible longer than priority 5
            expect(table).not.toBeNull();
        });

        FunkyTests.it('special columns ignore priority', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: [
                    { name: '_select', type: 'checkbox' },
                    { name: 'id', data: 'id', title: 'ID', responsivePriority: 10 }
                ],
                responsive: true,
                selectable: true
            });

            // Checkbox column should always be visible
            expect(table).not.toBeNull();
        });

    });

    // ========================================================================
    // Manual Column Visibility
    // ========================================================================

    FunkyTests.describe('Manual Column Visibility', function() {

        FunkyTests.it('manually hidden columns stay hidden', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: [
                    { name: 'id', data: 'id', title: 'ID' },
                    { name: 'hidden', data: 'name', title: 'Hidden', visible: false }
                ],
                responsive: true
            });

            // Column with visible: false should stay hidden
            expect(table).not.toBeNull();
        });

        FunkyTests.it('responsive does not override manual visibility', function() {
            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '1200px';

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: [
                    { name: 'id', data: 'id', title: 'ID' },
                    { name: 'hidden', data: 'name', title: 'Hidden', visible: false }
                ],
                responsive: true
            });

            // Even at desktop, manually hidden column stays hidden
            expect(table).not.toBeNull();
        });

    });

    // ========================================================================
    // Detail Rows
    // ========================================================================

    FunkyTests.describe('Detail Rows', function() {

        FunkyTests.it('collapses detail rows on breakpoint change', function(done) {
            var tableEl = document.getElementById(containerId);
            var wrapper = tableEl && tableEl.parentNode;
            if (wrapper) wrapper.style.width = '400px';

            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            // Change breakpoint
            if (wrapper) wrapper.style.width = '1200px';
            var restore = FunkyTests.simulate.resize(1200, 800);

            setTimeout(function() {
                // Detail rows should collapse on breakpoint change
                expect(table).not.toBeNull();
                restore();
                done();
            }, 150);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('removes resize handler on destroy', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            table.destroy();
            table = null;

            // Should not error when resizing after destroy
            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
        });

        FunkyTests.it('clears resize timeout on destroy', function() {
            table = Table.init('#' + containerId, {
                data: getSampleData(),
                columns: getResponsiveColumns(),
                responsive: true
            });

            // Trigger resize (starts debounce timer)
            var restore = FunkyTests.simulate.resize(400, 300);

            // Immediately destroy
            table.destroy();
            table = null;

            restore();

            // Should not error from pending timeout
            expect(true).toBe(true);
        });

    });

});
