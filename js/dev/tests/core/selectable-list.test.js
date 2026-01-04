/**
 * Funky.SelectableList Tests
 *
 * Tests for SelectableList core module - keyboard navigation, selection, and accessibility.
 */

describe('Funky.Core.SelectableList', function() {

    var D = Funky.Dom;
    var SelectableList = Funky.SelectableList;
    var fixture;
    var container;
    var list;

    // =========================================================================
    // TEST DATA
    // =========================================================================

    var sampleItems = [
        { id: 'a', label: 'Apple' },
        { id: 'b', label: 'Banana' },
        { id: 'c', label: 'Cherry' },
        { id: 'd', label: 'Date' },
        { id: 'e', label: 'Elderberry' }
    ];

    var itemsWithDisabled = [
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2', disabled: true },
        { id: '3', label: 'Item 3' },
        { id: '4', label: 'Item 4', disabled: true },
        { id: '5', label: 'Item 5' }
    ];

    var groupedItems = [
        { id: 'ny', label: 'New York', type: 'City' },
        { id: 'la', label: 'Los Angeles', type: 'City' },
        { id: 'ca', label: 'California', type: 'State' },
        { id: 'tx', label: 'Texas', type: 'State' }
    ];

    // =========================================================================
    // HELPERS
    // =========================================================================

    function simulateKeydown(element, key, options) {
        options = options || {};
        var event = new KeyboardEvent('keydown', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true,
            ctrlKey: options.ctrlKey || false,
            shiftKey: options.shiftKey || false,
            metaKey: options.metaKey || false
        });
        element.dispatchEvent(event);
        return event;
    }

    function simulateClick(element, options) {
        options = options || {};
        var event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            ctrlKey: options.ctrlKey || false,
            shiftKey: options.shiftKey || false,
            metaKey: options.metaKey || false
        });
        element.dispatchEvent(event);
    }

    function getWrapper() {
        return container.querySelector('.selectable-list');
    }

    function getItems() {
        return container.querySelectorAll('[role="option"]');
    }

    // =========================================================================
    // SETUP / TEARDOWN
    // =========================================================================

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="selectable-list-container"></div>'
        );
        container = document.getElementById('selectable-list-container');
    });

    afterEach(function() {
        if (list && list.destroy) {
            list.destroy();
            list = null;
        }
        fixture.destroy();
    });

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    describe('Initialization', function() {

        it('creates instance with default options', function() {
            list = SelectableList.init(container, { items: sampleItems });
            expect(list).toBeDefined();
            expect(list.id).toBeDefined();
        });

        it('renders items correctly', function() {
            list = SelectableList.init(container, { items: sampleItems });
            var items = getItems();
            expect(items.length).toBe(5);
        });

        it('sets ARIA attributes on container', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                ariaLabel: 'Test List'
            });
            var listbox = container.querySelector('[role="listbox"]');
            expect(listbox).toBeDefined();
            expect(listbox.getAttribute('aria-label')).toBe('Test List');
        });

        it('renders empty state when no items', function() {
            list = SelectableList.init(container, {
                items: [],
                emptyMessage: 'Nothing here'
            });
            var empty = container.querySelector('.selectable-list__empty');
            expect(empty).toBeDefined();
            expect(empty.textContent).toContain('Nothing here');
        });

        it('accepts selector string for container', function() {
            list = SelectableList.init('#selectable-list-container', { items: sampleItems });
            expect(list).toBeDefined();
        });

    });

    // =========================================================================
    // SELECTION
    // =========================================================================

    describe('Selection', function() {

        it('selects item by ID (single mode)', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'single'
            });

            list.select('b');

            expect(list.isSelected('b')).toBe(true);
            expect(list.getSelectedIds().length).toBe(1);
        });

        it('replaces selection in single mode', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'single'
            });

            list.select('a');
            list.select('b');

            expect(list.isSelected('a')).toBe(false);
            expect(list.isSelected('b')).toBe(true);
        });

        it('allows multiple selection in multi mode', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi'
            });

            list.setSelection(['a', 'c', 'e']);

            expect(list.getSelectedIds().length).toBe(3);
            expect(list.isSelected('a')).toBe(true);
            expect(list.isSelected('c')).toBe(true);
            expect(list.isSelected('e')).toBe(true);
        });

        it('selectAll in multi mode', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi'
            });

            list.selectAll();

            expect(list.getSelectedIds().length).toBe(5);
        });

        it('clearSelection works', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi',
                selectedIds: ['a', 'b']
            });

            list.clearSelection();

            expect(list.getSelectedIds().length).toBe(0);
        });

        it('toggleSelection works', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi'
            });

            list.toggleSelection('a');
            expect(list.isSelected('a')).toBe(true);

            list.toggleSelection('a');
            expect(list.isSelected('a')).toBe(false);
        });

        it('selectRange works', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi'
            });

            list.selectRange(1, 3);

            expect(list.getSelectedIds().length).toBe(3);
            expect(list.isSelected('b')).toBe(true);
            expect(list.isSelected('c')).toBe(true);
            expect(list.isSelected('d')).toBe(true);
        });

        it('calls onSelect callback', function() {
            var callCount = 0;
            var lastSelectedIds = [];

            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'single',
                onSelect: function(items, ids) {
                    callCount++;
                    lastSelectedIds = ids;
                }
            });

            list.select('c');

            expect(callCount).toBe(1);
            expect(lastSelectedIds).toEqual(['c']);
        });

        it('respects onBeforeSelect returning false', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'single',
                onBeforeSelect: function(item, action) {
                    return item.id !== 'b'; // Block selecting 'b'
                }
            });

            list.select('b');

            expect(list.isSelected('b')).toBe(false);
        });

    });

    // =========================================================================
    // KEYBOARD NAVIGATION
    // =========================================================================

    describe('Keyboard Navigation', function() {

        it('navigates down with ArrowDown', function() {
            list = SelectableList.init(container, { items: sampleItems });
            var wrapper = getWrapper();

            list.setFocusedIndex(0);
            simulateKeydown(wrapper, 'ArrowDown');

            expect(list.getFocusedIndex()).toBe(1);
        });

        it('navigates up with ArrowUp', function() {
            list = SelectableList.init(container, { items: sampleItems });
            var wrapper = getWrapper();

            list.setFocusedIndex(2);
            simulateKeydown(wrapper, 'ArrowUp');

            expect(list.getFocusedIndex()).toBe(1);
        });

        it('wraps around at end when wrapAround=true', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                wrapAround: true
            });
            var wrapper = getWrapper();

            list.setFocusedIndex(4);
            simulateKeydown(wrapper, 'ArrowDown');

            expect(list.getFocusedIndex()).toBe(0);
        });

        it('does not wrap when wrapAround=false', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                wrapAround: false
            });
            var wrapper = getWrapper();

            list.setFocusedIndex(4);
            simulateKeydown(wrapper, 'ArrowDown');

            expect(list.getFocusedIndex()).toBe(4);
        });

        it('jumps to first with Home', function() {
            list = SelectableList.init(container, { items: sampleItems });
            var wrapper = getWrapper();

            list.setFocusedIndex(3);
            simulateKeydown(wrapper, 'Home');

            expect(list.getFocusedIndex()).toBe(0);
        });

        it('jumps to last with End', function() {
            list = SelectableList.init(container, { items: sampleItems });
            var wrapper = getWrapper();

            list.setFocusedIndex(1);
            simulateKeydown(wrapper, 'End');

            expect(list.getFocusedIndex()).toBe(4);
        });

        it('skips disabled items', function() {
            list = SelectableList.init(container, {
                items: itemsWithDisabled,
                isItemDisabled: function(item) { return item.disabled; }
            });
            var wrapper = getWrapper();

            list.setFocusedIndex(0);
            simulateKeydown(wrapper, 'ArrowDown');

            // Should skip index 1 (disabled) and go to 2
            expect(list.getFocusedIndex()).toBe(2);
        });

        it('selects on Enter', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'single'
            });
            var wrapper = getWrapper();

            list.setFocusedIndex(2);
            simulateKeydown(wrapper, 'Enter');

            expect(list.isSelected('c')).toBe(true);
        });

        it('toggles on Space', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi'
            });
            var wrapper = getWrapper();

            list.setFocusedIndex(1);
            simulateKeydown(wrapper, ' ');
            expect(list.isSelected('b')).toBe(true);

            simulateKeydown(wrapper, ' ');
            expect(list.isSelected('b')).toBe(false);
        });

    });

    // =========================================================================
    // CLICK HANDLING
    // =========================================================================

    describe('Click Handling', function() {

        it('selects item on click', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'single'
            });

            var item = getItems()[2];
            simulateClick(item);

            expect(list.isSelected('c')).toBe(true);
        });

        it('toggles on click in multi mode', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi'
            });

            var item = getItems()[1];
            simulateClick(item);
            expect(list.isSelected('b')).toBe(true);

            simulateClick(item);
            expect(list.isSelected('b')).toBe(false);
        });

        it('range selects with Shift+Click', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi'
            });

            var items = getItems();
            simulateClick(items[1]); // Select b
            simulateClick(items[3], { shiftKey: true }); // Shift+Click d

            expect(list.getSelectedIds().length).toBe(3);
            expect(list.isSelected('b')).toBe(true);
            expect(list.isSelected('c')).toBe(true);
            expect(list.isSelected('d')).toBe(true);
        });

        it('does not select disabled items', function() {
            list = SelectableList.init(container, {
                items: itemsWithDisabled,
                selectable: 'single',
                isItemDisabled: function(item) { return item.disabled; }
            });

            var disabledItem = getItems()[1];
            simulateClick(disabledItem);

            expect(list.isSelected('2')).toBe(false);
        });

        it('calls onActivate callback', function() {
            var activated = null;

            list = SelectableList.init(container, {
                items: sampleItems,
                onActivate: function(item, index) {
                    activated = item;
                }
            });

            var item = getItems()[3];
            simulateClick(item);

            expect(activated.id).toBe('d');
        });

    });

    // =========================================================================
    // ACCESSIBILITY
    // =========================================================================

    describe('Accessibility', function() {

        it('has role=listbox on container', function() {
            list = SelectableList.init(container, { items: sampleItems });
            var listbox = container.querySelector('[role="listbox"]');
            expect(listbox).toBeDefined();
        });

        it('has role=option on items', function() {
            list = SelectableList.init(container, { items: sampleItems });
            var options = getItems();
            expect(options.length).toBe(5);
            options.forEach(function(opt) {
                expect(opt.getAttribute('role')).toBe('option');
            });
        });

        it('sets aria-selected correctly', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'single'
            });

            list.select('b');

            var options = getItems();
            expect(options[0].getAttribute('aria-selected')).toBe('false');
            expect(options[1].getAttribute('aria-selected')).toBe('true');
        });

        it('updates aria-activedescendant on focus', function() {
            list = SelectableList.init(container, { items: sampleItems });

            list.setFocusedIndex(2);

            var listbox = container.querySelector('[role="listbox"]');
            var activeId = listbox.getAttribute('aria-activedescendant');
            expect(activeId).toBeDefined();
        });

        it('sets aria-disabled on disabled items', function() {
            list = SelectableList.init(container, {
                items: itemsWithDisabled,
                isItemDisabled: function(item) { return item.disabled; }
            });

            var options = getItems();
            expect(options[1].getAttribute('aria-disabled')).toBe('true');
            expect(options[0].hasAttribute('aria-disabled')).toBe(false);
        });

        it('has live region for announcements', function() {
            list = SelectableList.init(container, { items: sampleItems });
            var liveRegion = container.querySelector('[aria-live]');
            expect(liveRegion).toBeDefined();
        });

        it('sets aria-multiselectable for multi mode', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi'
            });

            var listbox = container.querySelector('[role="listbox"]');
            expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
        });

    });

    // =========================================================================
    // API METHODS
    // =========================================================================

    describe('API Methods', function() {

        it('get/set items', function() {
            list = SelectableList.init(container, { items: sampleItems });

            var newItems = [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }];
            list.setItems(newItems);

            expect(list.getItems().length).toBe(2);
            expect(getItems().length).toBe(2);
        });

        it('getSelected returns selected items', function() {
            list = SelectableList.init(container, {
                items: sampleItems,
                selectable: 'multi'
            });

            list.setSelection(['a', 'c']);
            var selected = list.getSelected();

            expect(selected.length).toBe(2);
            expect(selected[0].label).toBe('Apple');
        });

        it('getFocused returns focused item', function() {
            list = SelectableList.init(container, { items: sampleItems });

            list.setFocusedIndex(3);
            var focused = list.getFocused();

            expect(focused.id).toBe('d');
        });

        it('refresh updates rendering', function() {
            list = SelectableList.init(container, { items: sampleItems });

            list.items[0].label = 'Modified Apple';
            list.refresh();

            var firstItem = getItems()[0];
            expect(firstItem.textContent).toContain('Modified');
        });

        it('destroy cleans up', function() {
            list = SelectableList.init(container, { items: sampleItems });
            var id = list.id;

            list.destroy();

            expect(container.innerHTML).toBe('');
            expect(SelectableList.getInstance(id)).toBeFalsy();
            list = null; // Prevent afterEach from calling destroy again
        });

        it('focus focuses the wrapper', function() {
            list = SelectableList.init(container, { items: sampleItems });

            list.focus();

            var wrapper = getWrapper();
            expect(document.activeElement).toBe(wrapper);
        });

    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    describe('Edge Cases', function() {

        it('handles empty items array', function() {
            list = SelectableList.init(container, { items: [] });

            expect(list.getFocusedIndex()).toBe(-1);
            expect(list.getItems()).toEqual([]);
        });

        it('handles single item with wrapAround', function() {
            list = SelectableList.init(container, {
                items: [{ id: 'only', label: 'Only One' }],
                wrapAround: true
            });
            var wrapper = getWrapper();

            list.setFocusedIndex(0);
            simulateKeydown(wrapper, 'ArrowDown');

            expect(list.getFocusedIndex()).toBe(0);
        });

        it('handles all disabled items', function() {
            var allDisabled = sampleItems.map(function(item) {
                return { id: item.id, label: item.label, disabled: true };
            });

            list = SelectableList.init(container, {
                items: allDisabled,
                isItemDisabled: function(item) { return item.disabled; }
            });

            var items = getItems();
            expect(items.length).toBe(5);
        });

        it('handles numeric IDs', function() {
            var numericItems = [
                { id: 1, label: 'One' },
                { id: 2, label: 'Two' },
                { id: 3, label: 'Three' }
            ];

            list = SelectableList.init(container, {
                items: numericItems,
                selectable: 'single'
            });

            list.select(2);
            expect(list.isSelected(2)).toBe(true);
            expect(list.isSelected('2')).toBe(true);
        });

    });

    // =========================================================================
    // GROUPING
    // =========================================================================

    describe('Grouping', function() {

        it('renders groups', function() {
            list = SelectableList.init(container, {
                items: groupedItems,
                groupBy: function(item) { return item.type; }
            });

            var groups = container.querySelectorAll('.selectable-list__group');
            expect(groups.length).toBe(2);
        });

        it('renders group headers', function() {
            list = SelectableList.init(container, {
                items: groupedItems,
                groupBy: function(item) { return item.type; },
                renderGroupHeader: function(key, items) {
                    return key + ' (' + items.length + ')';
                }
            });

            var headers = container.querySelectorAll('.selectable-list__group-header');
            expect(headers.length).toBe(2);
        });

        it('navigates through grouped items', function() {
            list = SelectableList.init(container, {
                items: groupedItems,
                groupBy: function(item) { return item.type; }
            });
            var wrapper = getWrapper();

            list.setFocusedIndex(0);
            simulateKeydown(wrapper, 'ArrowDown');
            simulateKeydown(wrapper, 'ArrowDown');

            expect(list.getFocusedIndex()).toBe(2);
        });

    });

});
