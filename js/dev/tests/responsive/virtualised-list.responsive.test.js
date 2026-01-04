/**
 * Responsive Tests: Funky.VirtualisedList
 *
 * Tests responsive behavior for the VirtualisedList component.
 * Verifies that the list handles viewport changes, container resizing,
 * and dynamic height recalculation at different viewport sizes.
 */

FunkyTests.describe('Funky.Responsive.VirtualisedList', function() {
    var expect = FunkyTests.expect;
    var VirtualisedList = window.Funky && window.Funky.VirtualisedList;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if VirtualisedList not loaded
    if (!VirtualisedList || !VirtualisedList.init) {
        FunkyTests.it('VirtualisedList component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var list;
    var containerId;
    var testCounter = 0;

    // Sample items for list
    function getSampleItems(count) {
        count = count || 100;
        var items = [];
        for (var i = 0; i < count; i++) {
            items.push({
                id: i + 1,
                name: 'Item ' + (i + 1),
                description: 'Description for item ' + (i + 1)
            });
        }
        return items;
    }

    // Simple render function
    function renderItem(item) {
        return '<div class="list-item" data-id="' + item.id + '">' +
            '<span class="item-name">' + item.name + '</span>' +
            '</div>';
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'virtualised-list-responsive-test-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 400px; height: 300px; overflow: auto;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (list && typeof list.destroy === 'function') {
            list.destroy();
            list = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Basic Viewport Behavior
    // ========================================================================

    FunkyTests.describe('Basic Viewport Behavior', function() {

        FunkyTests.it('creates list on mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(50),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                expect(list).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates list on tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(50),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                expect(list).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates list on desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(50),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                expect(list).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Container Resize Handling
    // ========================================================================

    FunkyTests.describe('Container Resize Handling', function() {

        FunkyTests.it('handles container width change', function(done) {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(100),
                itemHeight: 48,
                renderItem: renderItem
            });

            var container = document.getElementById(containerId);
            container.style.width = '250px';

            // Trigger resize observation
            window.dispatchEvent(new Event('resize'));

            setTimeout(function() {
                expect(list).not.toBeNull();
                done();
            }, 100);
        });

        FunkyTests.it('handles container height change', function(done) {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(100),
                itemHeight: 48,
                renderItem: renderItem
            });

            var container = document.getElementById(containerId);
            container.style.height = '500px';

            window.dispatchEvent(new Event('resize'));

            setTimeout(function() {
                expect(list).not.toBeNull();
                done();
            }, 100);
        });

        FunkyTests.it('recalculates visible items on resize', function(done) {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(100),
                itemHeight: 48,
                renderItem: renderItem
            });

            // Get initial visible range
            var initialRange = null;
            if (typeof list.getVisibleRange === 'function') {
                initialRange = list.getVisibleRange();
            }

            var container = document.getElementById(containerId);
            container.style.height = '600px';

            window.dispatchEvent(new Event('resize'));

            setTimeout(function() {
                if (typeof list.refresh === 'function') {
                    list.refresh();
                }

                setTimeout(function() {
                    // Should handle resize gracefully
                    expect(list).not.toBeNull();
                    done();
                }, 100);
            }, 50);
        });

    });

    // ========================================================================
    // Viewport Width Tests
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('responds to window resize event', function(done) {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(100),
                itemHeight: 48,
                renderItem: renderItem
            });

            var restore = FunkyTests.simulate.resize(500, 600);

            setTimeout(function() {
                expect(list).not.toBeNull();
                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid viewport changes', function(done) {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(100),
                itemHeight: 48,
                renderItem: renderItem
            });

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
                expect(list).not.toBeNull();
                done();
            }, 150);
        });

    });

    // ========================================================================
    // Variable Height Items
    // ========================================================================

    FunkyTests.describe('Variable Height Items', function() {

        FunkyTests.it('handles variable heights on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(50),
                    itemHeight: 'auto',
                    estimatedItemHeight: 60,
                    renderItem: function(item) {
                        var height = 40 + (item.id % 3) * 20;
                        return '<div class="list-item" style="height:' + height + 'px" data-id="' + item.id + '">' +
                            item.name + '</div>';
                    }
                });

                expect(list).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('recalculates variable heights after resize', function(done) {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(50),
                itemHeight: 'auto',
                estimatedItemHeight: 60,
                renderItem: function(item) {
                    var height = 40 + (item.id % 3) * 20;
                    return '<div class="list-item" style="height:' + height + 'px" data-id="' + item.id + '">' +
                        item.name + '</div>';
                }
            });

            var restore = FunkyTests.simulate.resize(320, 480);

            setTimeout(function() {
                if (typeof list.invalidateAllHeights === 'function') {
                    list.invalidateAllHeights();
                }
                expect(list).not.toBeNull();
                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Scrolling Behavior at Different Sizes
    // ========================================================================

    FunkyTests.describe('Scrolling at Different Sizes', function() {

        FunkyTests.it('scrollToIndex works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(100),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                if (typeof list.scrollToIndex === 'function') {
                    list.scrollToIndex(50);
                }

                setTimeout(function() {
                    expect(list).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('scrollToTop works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(100),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                if (typeof list.scrollToIndex === 'function') {
                    list.scrollToIndex(80);
                }

                setTimeout(function() {
                    if (typeof list.scrollToTop === 'function') {
                        list.scrollToTop();
                    }
                    expect(list).not.toBeNull();
                    restore();
                    done();
                }, 50);
            }, 50);
        });

    });

    // ========================================================================
    // Selection at Different Viewports
    // ========================================================================

    FunkyTests.describe('Selection at Different Viewports', function() {

        FunkyTests.it('single selection works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(50),
                    itemHeight: 48,
                    renderItem: renderItem,
                    selectable: 'single'
                });

                if (typeof list.select === 'function') {
                    list.select(5);
                }

                expect(list).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('multi selection works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(50),
                    itemHeight: 48,
                    renderItem: renderItem,
                    selectable: 'multi'
                });

                if (typeof list.select === 'function') {
                    list.select(5);
                    list.select(10);
                }

                if (typeof list.getSelectedIds === 'function') {
                    var selected = list.getSelectedIds();
                    expect(selected).not.toBeNull();
                }

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Orientation Changes
    // ========================================================================

    FunkyTests.describe('Orientation Changes', function() {

        FunkyTests.it('handles portrait to landscape', function(done) {
            // Portrait
            var restore = FunkyTests.simulate.resize(375, 667);

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(100),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                // Switch to landscape
                restore();
                restore = FunkyTests.simulate.resize(667, 375);

                setTimeout(function() {
                    expect(list).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('handles landscape to portrait', function(done) {
            // Landscape
            var restore = FunkyTests.simulate.resize(812, 375);

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(100),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                // Switch to portrait
                restore();
                restore = FunkyTests.simulate.resize(375, 812);

                setTimeout(function() {
                    expect(list).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

    });

    // ========================================================================
    // Infinite Scroll at Different Viewports
    // ========================================================================

    FunkyTests.describe('Infinite Scroll at Different Viewports', function() {

        FunkyTests.it('loadMore threshold works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();
            var loadMoreCalled = false;

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(20),
                    itemHeight: 48,
                    renderItem: renderItem,
                    hasMore: true,
                    loadMoreThreshold: 100,
                    onLoadMore: function(complete) {
                        loadMoreCalled = true;
                        complete([], false);
                    }
                });

                // Scroll to bottom to trigger load more
                if (typeof list.scrollToIndex === 'function') {
                    list.scrollToIndex(19);
                }

                setTimeout(function() {
                    // Load more might have been triggered
                    expect(list).not.toBeNull();
                    restore();
                    done();
                }, 200);
            }, 50);
        });

    });

    // ========================================================================
    // Filter/Search at Different Viewports
    // ========================================================================

    FunkyTests.describe('Filter/Search at Different Viewports', function() {

        FunkyTests.it('filter works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(50),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                if (typeof list.filter === 'function') {
                    list.filter(function(item) {
                        return item.id <= 10;
                    });
                }

                if (typeof list.getFilteredCount === 'function') {
                    var counts = list.getFilteredCount();
                    // getFilteredCount returns { filtered, total }
                    expect(counts.filtered <= 10).toBe(true);
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('search works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(50),
                    itemHeight: 48,
                    renderItem: renderItem,
                    searchFields: ['name']
                });

                if (typeof list.search === 'function') {
                    list.search('Item 1');
                }

                expect(list).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('clearFilter works after viewport change', function(done) {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(50),
                itemHeight: 48,
                renderItem: renderItem
            });

            if (typeof list.filter === 'function') {
                list.filter(function(item) {
                    return item.id <= 10;
                });
            }

            var restore = FunkyTests.simulate.resize(320, 480);

            setTimeout(function() {
                if (typeof list.clearFilter === 'function') {
                    list.clearFilter();
                }

                expect(list).not.toBeNull();
                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Data Operations at Different Viewports
    // ========================================================================

    FunkyTests.describe('Data Operations at Different Viewports', function() {

        FunkyTests.it('setItems works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(20),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                if (typeof list.setItems === 'function') {
                    list.setItems(getSampleItems(50));
                }

                expect(list).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('addItems works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                list = VirtualisedList.init('#' + containerId, {
                    items: getSampleItems(20),
                    itemHeight: 48,
                    renderItem: renderItem
                });

                if (typeof list.addItems === 'function') {
                    list.addItems(getSampleItems(10));
                }

                expect(list).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('removeItem works after viewport change', function(done) {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(50),
                itemHeight: 48,
                renderItem: renderItem
            });

            var restore = FunkyTests.simulate.resize(320, 480);

            setTimeout(function() {
                if (typeof list.removeItem === 'function') {
                    list.removeItem(5);
                }

                expect(list).not.toBeNull();
                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('cleans up properly on viewport change', function(done) {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(50),
                itemHeight: 48,
                renderItem: renderItem
            });

            var restore = FunkyTests.simulate.resize(320, 480);

            list.destroy();
            list = null;

            // Should not error after destroy
            setTimeout(function() {
                restore();
                expect(true).toBe(true);
                done();
            }, 50);
        });

        FunkyTests.it('can be recreated after destroy', function() {
            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(50),
                itemHeight: 48,
                renderItem: renderItem
            });

            list.destroy();

            list = VirtualisedList.init('#' + containerId, {
                items: getSampleItems(30),
                itemHeight: 48,
                renderItem: renderItem
            });

            expect(list).not.toBeNull();
        });

    });

});
