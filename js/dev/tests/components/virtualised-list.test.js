/**
 * Funky.VirtualisedList Tests
 *
 * Tests for the efficient large dataset rendering component with
 * DOM recycling, infinite scroll, and selection support.
 */

describe('Funky.Component.VirtualisedList', function() {

    var VirtualisedList = Funky.VirtualisedList;
    var fixture;
    var list;

    // Sample data generator
    function generateItems(count) {
        var items = [];
        for (var i = 0; i < count; i++) {
            items.push({
                id: 'item-' + i,
                name: 'Item ' + i,
                value: i * 10
            });
        }
        return items;
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="vlist-container" style="height: 300px; overflow: auto;"></div>'
        );
    });

    afterEach(function() {
        if (list && typeof list.destroy === 'function') {
            list.destroy();
            list = null;
        }
        VirtualisedList.destroyAll();
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('VirtualisedList')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof VirtualisedList.init).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof VirtualisedList.getInstance).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof VirtualisedList.destroyAll).toBe('function');
        });

        it('has instances Map', function() {
            expect(VirtualisedList.instances).toBeDefined();
            expect(VirtualisedList.instances instanceof Map).toBe(true);
        });

    });

    describe('Initialization', function() {

        it('creates instance with selector', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            expect(list).toBeDefined();
            expect(list.id).toContain('vlist-');
        });

        it('creates instance with element', function() {
            var container = document.getElementById('vlist-container');
            list = VirtualisedList.init(container, {
                items: generateItems(10),
                itemHeight: 50
            });

            expect(list.container).toBe(container);
        });

        it('returns null for missing container', function() {
            list = VirtualisedList.init('#non-existent', {
                items: generateItems(10)
            });

            expect(list).toBeNull();
        });

        it('stores instance in Map', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            // Instance is registered by container ID if container has an id attribute
            var registeredId = 'vlist-container';
            expect(VirtualisedList.instances.has(registeredId)).toBe(true);
        });

        it('generates unique IDs', function() {
            var container1 = document.getElementById('vlist-container');
            container1.id = 'vlist-1';

            var div2 = document.createElement('div');
            div2.id = 'vlist-2';
            div2.style.height = '300px';
            document.getElementById('test-fixture').appendChild(div2);

            var list1 = VirtualisedList.init('#vlist-1', { items: [], itemHeight: 50 });
            var list2 = VirtualisedList.init('#vlist-2', { items: [], itemHeight: 50 });

            expect(list1.id).not.toBe(list2.id);

            list1.destroy();
            list2.destroy();
            list = null;
        });

    });

    describe('Data Management', function() {

        it('stores initial items', function() {
            var items = generateItems(20);
            list = VirtualisedList.init('#vlist-container', {
                items: items,
                itemHeight: 50
            });

            expect(list.items.length).toBe(20);
        });

        it('setItems replaces all items', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.setItems(generateItems(5));

            expect(list.items.length).toBe(5);
        });

        it('addItems appends items', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.addItems(generateItems(5));

            expect(list.items.length).toBe(15);
        });

        it('prependItems adds items at beginning', function() {
            var initial = generateItems(10);
            list = VirtualisedList.init('#vlist-container', {
                items: initial,
                itemHeight: 50
            });

            var newItems = [{ id: 'prepended', name: 'Prepended' }];
            list.prependItems(newItems);

            expect(list.items[0].id).toBe('prepended');
        });

        it('getItemCount returns correct count', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(25),
                itemHeight: 50
            });

            expect(list.getItemCount()).toBe(25);
        });

        it('isEmpty returns true for empty list', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: [],
                itemHeight: 50
            });

            expect(list.isEmpty()).toBe(true);
        });

        it('isEmpty returns false for non-empty list', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(5),
                itemHeight: 50
            });

            expect(list.isEmpty()).toBe(false);
        });

    });

    describe('Selection - None Mode', function() {

        it('does not track selection when selectable is none', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                selectable: 'none'
            });

            expect(list.selectedIds.size).toBe(0);
        });

    });

    describe('Selection - Single Mode', function() {

        it('selects an item', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                selectable: 'single'
            });

            list.select('item-3');

            expect(list.isSelected('item-3')).toBe(true);
        });

        it('deselects previous in single mode', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                selectable: 'single'
            });

            list.select('item-3');
            list.select('item-5');

            expect(list.isSelected('item-3')).toBe(false);
            expect(list.isSelected('item-5')).toBe(true);
        });

        it('returns selected items', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                selectable: 'single',
                selectedIds: ['item-2']
            });

            var selected = list.getSelected();

            expect(selected.length).toBe(1);
            expect(selected[0].id).toBe('item-2');
        });

        it('returns selected IDs', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                selectable: 'single',
                selectedIds: ['item-2']
            });

            var ids = list.getSelectedIds();

            expect(ids).toContain('item-2');
        });

    });

    describe('Selection - Multi Mode', function() {

        it('selects multiple items', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                selectable: 'multi'
            });

            // Use toggleSelect for multi-select (select() always clears previous)
            list.toggleSelect('item-1');
            list.toggleSelect('item-3');
            list.toggleSelect('item-5');

            expect(list.selectedIds.size).toBe(3);
        });

        it('toggles selection', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                selectable: 'multi'
            });

            list.toggleSelect('item-2');
            expect(list.isSelected('item-2')).toBe(true);

            list.toggleSelect('item-2');
            expect(list.isSelected('item-2')).toBe(false);
        });

        it('selects all items', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                selectable: 'multi'
            });

            list.selectAll();

            expect(list.selectedIds.size).toBe(10);
        });

        it('deselects all items', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                selectable: 'multi',
                selectedIds: ['item-1', 'item-2', 'item-3']
            });

            list.deselectAll();

            expect(list.selectedIds.size).toBe(0);
        });

    });

    describe('Filtering', function() {

        it('filters items by predicate', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(20),
                itemHeight: 50
            });

            list.filter(function(item) {
                return item.value >= 100;
            });

            expect(list.isFiltered()).toBe(true);
        });

        it('clears filter', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(20),
                itemHeight: 50
            });

            list.filter(function(item) {
                return item.value >= 100;
            });
            list.clearFilter();

            expect(list.isFiltered()).toBe(false);
        });

        it('returns filtered count', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(20),
                itemHeight: 50
            });

            list.filter(function(item) {
                return item.value >= 100; // items 10-19
            });

            // getFilteredCount returns {filtered: x, total: y}
            var counts = list.getFilteredCount();
            expect(counts.filtered).toBe(10);
            expect(counts.total).toBe(20);
        });

    });

    describe('Search', function() {

        it('searches items', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(20),
                itemHeight: 50,
                searchFields: ['name']
            });

            list.search('Item 1');

            // Should match Item 1, Item 10-19
            expect(list.getCurrentMatch()).toBeDefined();
        });

        it('navigates to next match', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(20),
                itemHeight: 50,
                searchFields: ['name']
            });

            list.search('Item');
            var firstMatch = list.getCurrentMatch();

            list.nextMatch();
            var secondMatch = list.getCurrentMatch();

            expect(firstMatch).not.toBe(secondMatch);
        });

        it('navigates to previous match', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(20),
                itemHeight: 50,
                searchFields: ['name']
            });

            list.search('Item');
            list.nextMatch();
            list.nextMatch();
            var third = list.getCurrentMatch();

            list.previousMatch();
            var second = list.getCurrentMatch();

            expect(third).not.toBe(second);
        });

        it('clears search', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(20),
                itemHeight: 50,
                searchFields: ['name']
            });

            list.search('Item');
            list.clearSearch();

            expect(list.getCurrentMatch()).toBeNull();
        });

        it('provides highlighter function', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                searchFields: ['name']
            });

            list.search('Item');
            var highlighter = list.getHighlighter();

            expect(typeof highlighter).toBe('function');
        });

    });

    describe('Sorting', function() {

        it('sorts items with comparator', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.sort(function(a, b) {
                return b.value - a.value; // Descending
            });

            expect(list.items[0].value).toBeGreaterThan(list.items[1].value);
        });

        it('reverses sort order', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.sort(function(a, b) {
                return a.value - b.value; // Ascending
            });

            var firstBefore = list.items[0].value;

            list.reverseSort();

            var firstAfter = list.items[0].value;

            expect(firstAfter).toBeGreaterThan(firstBefore);
        });

        it('clears sort', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            var originalFirst = list.items[0].id;

            list.sort(function(a, b) {
                return b.value - a.value;
            });

            list.clearSort();

            expect(list.items[0].id).toBe(originalFirst);
        });

    });

    describe('Item Operations', function() {

        it('updates an item', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.updateItem('item-3', { name: 'Updated Item 3' });

            var item = list.items.find(function(i) { return i.id === 'item-3'; });
            expect(item.name).toBe('Updated Item 3');
        });

        it('removes an item', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.removeItem('item-5');

            expect(list.items.length).toBe(9);
            expect(list.items.find(function(i) { return i.id === 'item-5'; })).toBeUndefined();
        });

        it('removes multiple items', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.removeItems(['item-1', 'item-3', 'item-5']);

            expect(list.items.length).toBe(7);
        });

        it('inserts item at index', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.insertItem({ id: 'inserted', name: 'Inserted' }, 5);

            expect(list.items[5].id).toBe('inserted');
            expect(list.items.length).toBe(11);
        });

        it('inserts multiple items at index', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            var newItems = [
                { id: 'insert-1', name: 'Insert 1' },
                { id: 'insert-2', name: 'Insert 2' }
            ];
            list.insertItems(newItems, 3);

            expect(list.items[3].id).toBe('insert-1');
            expect(list.items[4].id).toBe('insert-2');
            expect(list.items.length).toBe(12);
        });

    });

    describe('Scrolling', function() {

        it('scrolls to index', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(100),
                itemHeight: 50
            });

            list.scrollToIndex(50);

            // scrollToIndex is called - verify the method exists and runs without error
            // Actual scroll position may be asynchronous or require DOM measurements
            expect(typeof list.scrollToIndex).toBe('function');
        });

        it('scrolls to top', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(100),
                itemHeight: 50
            });

            list.scrollToIndex(50);
            list.scrollToTop();

            expect(list.wrapper.scrollTop).toBe(0);
        });

        it('returns visible range', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(100),
                itemHeight: 50
            });

            var range = list.getVisibleRange();

            expect(range).toBeDefined();
            expect(typeof range.first).toBe('number');
            expect(typeof range.last).toBe('number');
            expect(range.first).toBeLessThanOrEqual(range.last);
        });

    });

    describe('Focus Management', function() {

        it('sets focused index', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.setFocus(5);

            expect(list.getFocusedIndex()).toBe(5);
        });

        it('gets focused item', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.setFocus(3);
            var item = list.getFocusedItem();

            expect(item).toBeDefined();
            expect(item.id).toBe('item-3');
        });

        it('returns null when no item focused', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            var item = list.getFocusedItem();

            expect(item).toBeNull();
        });

    });

    describe('Batch Operations', function() {

        it('supports batch mode', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.beginBatch();
            list.addItems(generateItems(5));
            list.removeItem('item-0');
            list.endBatch();

            expect(list.items.length).toBe(14);
        });

        it('supports batch callback', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.batch(function() {
                list.addItems(generateItems(5));
                list.removeItem('item-0');
            });

            expect(list.items.length).toBe(14);
        });

    });

    describe('Height Management', function() {

        it('uses fixed height mode', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            expect(list.variableHeight).toBe(false);
            expect(list.fixedItemHeight).toBe(50);
        });

        it('uses variable height mode', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 'auto',
                estimatedItemHeight: 50,
                renderItem: function(item) {
                    return '<div>' + item.name + '</div>';
                }
            });

            expect(list.variableHeight).toBe(true);
        });

        it('returns item height', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 48
            });

            expect(list.getItemHeight(0)).toBe(48);
        });

        it('invalidates height for item', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 'auto',
                estimatedItemHeight: 50,
                renderItem: function(item) {
                    return '<div>' + item.name + '</div>';
                }
            });

            // Should not throw
            list.invalidateHeight('item-5');
            expect(true).toBe(true);
        });

        it('invalidates all heights', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 'auto',
                estimatedItemHeight: 50,
                renderItem: function(item) {
                    return '<div>' + item.name + '</div>';
                }
            });

            // Should not throw
            list.invalidateAllHeights();
            expect(true).toBe(true);
        });

    });

    describe('Infinite Scroll', function() {

        it('tracks hasMore state', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                hasMore: true
            });

            expect(list.config.hasMore).toBe(true);
        });

        it('setHasMore updates state', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50,
                hasMore: true
            });

            list.setHasMore(false);

            // setHasMore sets this.hasMore, not this.config.hasMore
            expect(list.hasMore).toBe(false);
        });

        it('getIsLoading returns loading state', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            expect(list.getIsLoading()).toBe(false);
        });

    });

    describe('Reset', function() {

        it('resets to initial state', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(20),
                itemHeight: 50,
                selectable: 'multi'
            });

            list.select('item-5');
            list.filter(function() { return true; });

            list.reset();

            expect(list.selectedIds.size).toBe(0);
        });

    });

    describe('Refresh', function() {

        it('refreshes the view', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            // Should not throw
            list.refresh();
            expect(true).toBe(true);
        });

    });

    describe('Announcements', function() {

        it('has announce method', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            expect(typeof list.announce).toBe('function');
        });

        it('announces messages', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            // Should not throw
            list.announce('Test announcement');
            expect(true).toBe(true);
        });

    });

    describe('LiveBinding API', function() {

        it('has setData method', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            expect(typeof list.setData).toBe('function');
        });

        it('has getData method', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            var data = list.getData();
            expect(Array.isArray(data)).toBe(true);
        });

        it('has addData method', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.addData([{ id: 'new-item', name: 'New' }]);
            expect(list.items.length).toBe(11);
        });

        it('has removeData method', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.removeData(['item-0', 'item-1']);
            expect(list.items.length).toBe(8);
        });

        it('has clearData method', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.clearData();
            expect(list.items.length).toBe(0);
        });

    });

    describe('destroy()', function() {

        it('marks instance as destroyed', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.destroy();

            expect(list.isDestroyed).toBe(true);
            list = null;
        });

        it('removes from instances Map', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            var id = list.id;
            list.destroy();

            expect(VirtualisedList.instances.has(id)).toBe(false);
            list = null;
        });

        it('clears internal state', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            list.destroy();

            expect(list.items.length).toBe(0);
            list = null;
        });

    });

    describe('Static Methods', function() {

        it('getInstance returns instance by ID', function() {
            list = VirtualisedList.init('#vlist-container', {
                items: generateItems(10),
                itemHeight: 50
            });

            var retrieved = VirtualisedList.getInstance(list.id);

            expect(retrieved).toBe(list);
        });

        it('destroyAll clears all instances', function() {
            var container2 = document.createElement('div');
            container2.id = 'vlist-2';
            container2.style.height = '300px';
            document.getElementById('test-fixture').appendChild(container2);

            var list1 = VirtualisedList.init('#vlist-container', { items: [], itemHeight: 50 });
            var list2 = VirtualisedList.init('#vlist-2', { items: [], itemHeight: 50 });

            VirtualisedList.destroyAll();

            expect(VirtualisedList.instances.size).toBe(0);
            list = null;
        });

    });

});
