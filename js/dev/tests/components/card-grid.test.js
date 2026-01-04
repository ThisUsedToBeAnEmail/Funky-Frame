/**
 * Funky.CardGrid Tests
 *
 * Tests for the responsive grid of data cards with customizable templates,
 * sorting, filtering, selection, and optional virtualization for large datasets.
 */

describe('Funky.Component.CardGrid', function() {

    var CardGrid = Funky.CardGrid;
    var D = Funky.Dom;
    var fixture;
    var grid;

    // Sample data - reset in beforeEach to avoid mutation
    var sampleItems;

    beforeEach(function() {
        // Reset sampleItems for each test to avoid mutation
        sampleItems = [
            { id: 1, name: 'Item 1', description: 'First item', price: 10 },
            { id: 2, name: 'Item 2', description: 'Second item', price: 20 },
            { id: 3, name: 'Item 3', description: 'Third item', price: 15 },
            { id: 4, name: 'Item 4', description: 'Fourth item', price: 25 },
            { id: 5, name: 'Item 5', description: 'Fifth item', price: 5 }
        ];

        fixture = FunkyTests.fixture(
            '<div id="test-card-grid" style="width: 800px;"></div>'
        );
    });

    afterEach(function() {
        if (grid && typeof grid.destroy === 'function') {
            grid.destroy();
            grid = null;
        }
        CardGrid.destroyAll();
        fixture.destroy();
    });

    // =========================================================================
    // Module Availability
    // =========================================================================

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('CardGrid')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof CardGrid.create).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof CardGrid.getInstance).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof CardGrid.destroyAll).toBe('function');
        });

        it('has instances Map', function() {
            expect(CardGrid.instances).toBeDefined();
            expect(CardGrid.instances instanceof Map).toBe(true);
        });

    });

    // =========================================================================
    // Core Functionality
    // =========================================================================

    describe('Core', function() {

        it('should create instance with items', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            expect(grid).toBeTruthy();
            expect(grid.id).toMatch(/^card-grid-/);
            expect(grid.items.length).toBe(5);
        });

        it('should render cards for each item', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');
            expect(cards.length).toBe(5);
        });

        it('should use custom renderCard function', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                renderCard: function(item) {
                    return D.div().classAdd('custom-card').text(item.name);
                }
            });

            var container = document.getElementById('test-card-grid');
            var customCards = container.querySelectorAll('.custom-card');
            expect(customCards.length).toBe(5);
            expect(customCards[0].textContent).toBe('Item 1');
        });

        it('should get instance by ID', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var retrieved = CardGrid.getInstance(grid.id);
            expect(retrieved).toBe(grid);
        });

        it('should destroy instance and cleanup', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var id = grid.id;
            grid.destroy();

            expect(CardGrid.getInstance(id)).toBeFalsy();
            
            var container = document.getElementById('test-card-grid');
            expect(container.innerHTML).toBe('');

            grid = null;
        });

        it('should render empty state when no items', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: []
            });

            var container = document.getElementById('test-card-grid');
            var emptyState = container.querySelector('.funky-card-grid__empty');
            expect(emptyState).toBeTruthy();
        });

    });

    // =========================================================================
    // Data Management
    // =========================================================================

    describe('Data Management', function() {

        it('should setItems and re-render', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems.slice(0, 2)
            });

            expect(grid.items.length).toBe(2);

            grid.setItems(sampleItems);
            expect(grid.items.length).toBe(5);

            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');
            expect(cards.length).toBe(5);
        });

        it('should addItems', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems.slice(0, 2)
            });

            grid.addItems(sampleItems.slice(2));
            expect(grid.items.length).toBe(5);
        });

        it('should removeItem by ID', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            grid.removeItem(3);
            expect(grid.items.length).toBe(4);

            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');
            expect(cards.length).toBe(4);
        });

        it('should updateItem by ID', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            grid.updateItem(1, { name: 'Updated Item 1' });

            var item = grid.getItem(1);
            expect(item.name).toBe('Updated Item 1');
        });

        it('should getItem by ID', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var item = grid.getItem(3);
            expect(item).toBeTruthy();
            expect(item.name).toBe('Item 3');
        });

        it('should getItems return all items', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var items = grid.getItems();
            expect(items.length).toBe(5);
        });

    });

    // =========================================================================
    // Layout
    // =========================================================================

    describe('Layout', function() {

        it('should render in grid view by default', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var container = document.getElementById('test-card-grid');
            var gridEl = container.querySelector('.funky-card-grid__grid');
            expect(gridEl.classList.contains('funky-card-grid__grid--grid')).toBe(true);
        });

        it('should switch to list view', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            grid.setView('list');

            var container = document.getElementById('test-card-grid');
            var gridEl = container.querySelector('.funky-card-grid__grid');
            expect(gridEl.classList.contains('funky-card-grid__grid--list')).toBe(true);
            expect(grid.getView()).toBe('list');
        });

        it('should start in list view when layout option is list', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                layout: 'list'
            });

            expect(grid.getView()).toBe('list');
        });

        it('should set gap size', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                gap: 'lg'
            });

            var container = document.getElementById('test-card-grid');
            var wrapper = container.querySelector('.funky-card-grid');
            // Check inline style - component sets actual rem value, not CSS variable reference
            var gapValue = wrapper.style.getPropertyValue('--card-grid-gap');
            // 'lg' maps to '1.5rem' in the component's _getGapCSSValue method
            expect(gapValue).toBe('1.5rem');
        });

        it('should set columns', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                columns: 3
            });

            grid.setColumns(4);
            // Verify column count updated (CSS variable) - check inline style
            var container = document.getElementById('test-card-grid');
            var gridEl = container.querySelector('.funky-card-grid__grid');
            var colsValue = gridEl.style.getPropertyValue('--card-grid-columns');
            expect(colsValue.trim()).toBe('4');
        });

    });

    // =========================================================================
    // Search & Filter
    // =========================================================================

    describe('Search & Filter', function() {

        it('should filter items by search query', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                searchable: true
            });

            grid.search('Item 1');

            expect(grid.filteredItems.length).toBe(1);
            expect(grid.filteredItems[0].name).toBe('Item 1');
        });

        it('should search multiple fields', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                searchable: true,
                searchFields: ['name', 'description']
            });

            grid.search('First');

            expect(grid.filteredItems.length).toBe(1);
            expect(grid.filteredItems[0].description).toBe('First item');
        });

        it('should clear search', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                searchable: true
            });

            grid.search('Item 1');
            expect(grid.filteredItems.length).toBe(1);

            grid.clearFilters();
            expect(grid.filteredItems.length).toBe(0);
            expect(grid.currentSearch).toBe('');
        });

        it('should apply custom filter function', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            grid.filter(function(item) {
                return item.price > 15;
            });

            expect(grid.filteredItems.length).toBe(2);
        });

        it('should show all items when search query is empty', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                searchable: true
            });

            grid.search('Item 1');
            expect(grid.filteredItems.length).toBe(1);

            grid.search('');
            
            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');
            expect(cards.length).toBe(5);
        });

    });

    // =========================================================================
    // Sorting
    // =========================================================================

    describe('Sorting', function() {

        it('should sort items ascending', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                sortable: true,
                sortFields: [{ field: 'price', label: 'Price' }]
            });

            grid.sort('price', 'asc');

            expect(grid.items[0].price).toBe(5);
            expect(grid.items[4].price).toBe(25);
        });

        it('should sort items descending', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                sortable: true,
                sortFields: [{ field: 'price', label: 'Price' }]
            });

            grid.sort('price', 'desc');

            expect(grid.items[0].price).toBe(25);
            expect(grid.items[4].price).toBe(5);
        });

        it('should sort strings case-insensitive', function() {
            var mixedItems = [
                { id: 1, name: 'Banana' },
                { id: 2, name: 'apple' },
                { id: 3, name: 'Cherry' }
            ];

            grid = CardGrid.create('#test-card-grid', {
                items: mixedItems,
                sortable: true
            });

            grid.sort('name', 'asc');

            expect(grid.items[0].name).toBe('apple');
            expect(grid.items[1].name).toBe('Banana');
            expect(grid.items[2].name).toBe('Cherry');
        });

        it('should apply default sort on initialization', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                sortable: true,
                defaultSort: 'price',
                defaultSortDirection: 'desc'
            });

            expect(grid.items[0].price).toBe(25);
        });

    });

    // =========================================================================
    // Selection
    // =========================================================================

    describe('Selection', function() {

        it('should support single selection', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'single'
            });

            grid.select(1);
            expect(grid.selectedIds.size).toBe(1);

            grid.select(2);
            expect(grid.selectedIds.size).toBe(1);
            expect(grid.selectedIds.has('2')).toBe(true);
        });

        it('should support multi selection', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'multi'
            });

            grid.select(1);
            grid.select(2);
            grid.select(3);

            expect(grid.selectedIds.size).toBe(3);
        });

        it('should selectAll items', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'multi'
            });

            grid.selectAll();

            expect(grid.selectedIds.size).toBe(5);
        });

        it('should clearSelection', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'multi'
            });

            grid.selectAll();
            grid.clearSelection();

            expect(grid.selectedIds.size).toBe(0);
        });

        it('should getSelected items', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'multi'
            });

            grid.select(1);
            grid.select(3);

            var selected = grid.getSelected();
            expect(selected.length).toBe(2);
            expect(selected[0].id).toBe(1);
            expect(selected[1].id).toBe(3);
        });

        it('should deselect item', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'multi'
            });

            grid.select(1);
            grid.select(2);
            grid.deselect(1);

            expect(grid.selectedIds.size).toBe(1);
            expect(grid.selectedIds.has('1')).toBe(false);
        });

        it('should add selected class to selected cards', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'single'
            });

            grid.select(1);

            var container = document.getElementById('test-card-grid');
            var selectedCard = container.querySelector('[data-item-id="1"]');
            expect(selectedCard.classList.contains('funky-card-grid__card--selected')).toBe(true);
        });

    });

    // =========================================================================
    // Events
    // =========================================================================

    describe('Events', function() {

        it('should emit select event', function(done) {
            var eventData = null;

            var handler = function(data) {
                eventData = data;
            };
            Funky.PubSub.on('funky:card-grid:select', handler);

            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'single'
            });

            grid.select(1);

            setTimeout(function() {
                expect(eventData).toBeTruthy();
                expect(eventData.items.length).toBe(1);
                Funky.PubSub.off('funky:card-grid:select', handler);
                done();
            }, 50);
        });

        it('should call onSelect callback', function() {
            var callbackCalled = false;
            var callbackItems = null;

            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'single',
                onSelect: function(items) {
                    callbackCalled = true;
                    callbackItems = items;
                }
            });

            grid.select(1);

            expect(callbackCalled).toBe(true);
            expect(callbackItems.length).toBe(1);
        });

        it('should emit view change event', function(done) {
            var eventFired = false;

            var handler = function() {
                eventFired = true;
            };
            Funky.PubSub.on('funky:card-grid:view:change', handler);

            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            grid.setView('list');

            setTimeout(function() {
                expect(eventFired).toBe(true);
                Funky.PubSub.off('funky:card-grid:view:change', handler);
                done();
            }, 50);
        });

        it('should emit search event', function(done) {
            var eventData = null;

            var handler = function(data) {
                eventData = data;
            };
            Funky.PubSub.on('funky:card-grid:search', handler);

            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                searchable: true
            });

            grid.search('Item 1');

            setTimeout(function() {
                expect(eventData).toBeTruthy();
                expect(eventData.query).toBe('Item 1');
                Funky.PubSub.off('funky:card-grid:search', handler);
                done();
            }, 50);
        });

    });

    // =========================================================================
    // Accessibility
    // =========================================================================

    describe('Accessibility', function() {

        it('should have role="grid" on wrapper', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var container = document.getElementById('test-card-grid');
            var wrapper = container.querySelector('.funky-card-grid');
            expect(wrapper.getAttribute('role')).toBe('grid');
        });

        it('should have role="gridcell" on cards', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');
            cards.forEach(function(card) {
                expect(card.getAttribute('role')).toBe('gridcell');
            });
        });

        it('should have tabindex on cards', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');
            cards.forEach(function(card) {
                expect(card.getAttribute('tabindex')).toBe('0');
            });
        });

        it('should update aria-selected on selection', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'single'
            });

            grid.select(1);

            var container = document.getElementById('test-card-grid');
            var selectedCard = container.querySelector('[data-item-id="1"]');
            expect(selectedCard.getAttribute('aria-selected')).toBe('true');
        });

        it('should have aria-label on grid', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var container = document.getElementById('test-card-grid');
            var wrapper = container.querySelector('.funky-card-grid');
            expect(wrapper.getAttribute('aria-label')).toBeTruthy();
        });

    });

    // =========================================================================
    // Keyboard Navigation
    // =========================================================================

    describe('Keyboard Navigation', function() {

        // Helper to simulate keydown on grid element
        function simulateGridKeydown(gridEl, key) {
            var event = new KeyboardEvent('keydown', {
                key: key,
                code: key,
                bubbles: true,
                cancelable: true
            });
            gridEl.dispatchEvent(event);
        }

        it('should focus first card on tab', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var container = document.getElementById('test-card-grid');
            var firstCard = container.querySelector('.funky-card-grid__card');
            firstCard.focus();

            expect(document.activeElement).toBe(firstCard);
        });

        it('should navigate with arrow right key', function(done) {
            // Note: keyboard navigation requires selectable mode to be enabled
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'single'
            });

            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');

            // Focus first card
            cards[0].focus();
            expect(document.activeElement).toBe(cards[0]);

            // Dispatch keydown on the grid element (where the handler is bound)
            var gridEl = container.querySelector('.funky-card-grid__grid');
            var event = new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                code: 'ArrowRight',
                bubbles: true,
                cancelable: true
            });
            gridEl.dispatchEvent(event);

            // Give a frame for focus to update
            requestAnimationFrame(function() {
                // Re-query cards after event
                var updatedCards = container.querySelectorAll('.funky-card-grid__card');
                // Should move to next card (index 1)
                // Compare by data-item-id attribute since element references may change
                var expectedItemId = updatedCards[1].getAttribute('data-item-id');
                var actualItemId = document.activeElement.getAttribute('data-item-id');
                expect(actualItemId).toBe(expectedItemId);
                done();
            });
        });

        it('should navigate with arrow left key', function(done) {
            // Note: keyboard navigation requires selectable mode to be enabled
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'single'
            });

            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');

            // Focus second card
            cards[1].focus();
            expect(document.activeElement).toBe(cards[1]);

            // Dispatch keydown on the grid element (where the handler is bound)
            var gridEl = container.querySelector('.funky-card-grid__grid');
            var event = new KeyboardEvent('keydown', {
                key: 'ArrowLeft',
                code: 'ArrowLeft',
                bubbles: true,
                cancelable: true
            });
            gridEl.dispatchEvent(event);

            // Give a frame for focus to update
            requestAnimationFrame(function() {
                // Re-query cards after event
                var updatedCards = container.querySelectorAll('.funky-card-grid__card');
                // Compare by data-item-id attribute since element references may change
                var expectedItemId = updatedCards[0].getAttribute('data-item-id');
                var actualItemId = document.activeElement.getAttribute('data-item-id');
                expect(actualItemId).toBe(expectedItemId);
                done();
            });
        });

        it('should select with Enter key', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'single'
            });

            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');
            var gridEl = container.querySelector('.funky-card-grid__grid');

            cards[0].focus();

            // Dispatch on grid element
            simulateGridKeydown(gridEl, 'Enter');

            expect(grid.selectedIds.has('1')).toBe(true);
        });

        it('should select with Space key', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                selectable: 'single'
            });

            var container = document.getElementById('test-card-grid');
            var cards = container.querySelectorAll('.funky-card-grid__card');
            var gridEl = container.querySelector('.funky-card-grid__grid');

            cards[0].focus();

            // Dispatch on grid element
            simulateGridKeydown(gridEl, ' ');

            expect(grid.selectedIds.has('1')).toBe(true);
        });

    });

    // =========================================================================
    // Virtualization
    // =========================================================================

    describe('Virtualization', function() {

        it('should not virtualize small datasets by default', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            expect(grid.isVirtualized).toBe(false);
        });

        it('should virtualize when virtualize option is true', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                virtualize: true,
                containerHeight: '300px'
            });

            expect(grid.isVirtualized).toBe(true);

            var container = document.getElementById('test-card-grid');
            var wrapper = container.querySelector('.funky-card-grid');
            expect(wrapper.classList.contains('funky-card-grid--virtualized')).toBe(true);
        });

        it('should auto-virtualize when items exceed threshold', function() {
            var manyItems = [];
            for (var i = 0; i < 150; i++) {
                manyItems.push({ id: i, name: 'Item ' + i });
            }

            grid = CardGrid.create('#test-card-grid', {
                items: manyItems,
                virtualize: 'auto',
                virtualizeThreshold: 100,
                containerHeight: '300px'
            });

            expect(grid.isVirtualized).toBe(true);
        });

        it('should have virtual container when virtualized', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                virtualize: true,
                containerHeight: '300px'
            });

            var container = document.getElementById('test-card-grid');
            var virtualContainer = container.querySelector('.funky-card-grid__virtual-container');
            expect(virtualContainer).toBeTruthy();
        });

        it('should scrollToItem work with virtualization', function() {
            var manyItems = [];
            for (var i = 0; i < 100; i++) {
                manyItems.push({ id: i + 1, name: 'Item ' + (i + 1) });
            }

            grid = CardGrid.create('#test-card-grid', {
                items: manyItems,
                virtualize: true,
                containerHeight: '300px'
            });

            // Should not throw
            grid.scrollToItem(50);
        });

    });

    // =========================================================================
    // Toolbar (with external ActionBar elements)
    // =========================================================================

    describe('Toolbar', function() {

        it('should not render toolbar by default', function() {
            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems
            });

            var container = document.getElementById('test-card-grid');
            var toolbar = container.querySelector('.funky-card-grid__toolbar');
            expect(toolbar).toBeFalsy();
        });

        it('should bind external ActionBar with search input', function() {
            // Add external ActionBar with search input
            var actionBar = document.createElement('div');
            actionBar.setAttribute('data-card-grid-id', 'test-card-grid');
            actionBar.innerHTML = '<input type="text" data-action="search" placeholder="Search...">';
            document.body.appendChild(actionBar);

            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                searchable: true
            });

            // Verify the search input is bound
            expect(grid.els.searchInput).toBeDefined();

            // Clean up
            document.body.removeChild(actionBar);
        });

        it('should bind external ActionBar with view toggle buttons', function() {
            // Add external ActionBar with view toggle buttons
            var actionBar = document.createElement('div');
            actionBar.setAttribute('data-card-grid-id', 'test-card-grid');
            actionBar.innerHTML =
                '<button data-action="view" data-view="grid">Grid</button>' +
                '<button data-action="view" data-view="list">List</button>';
            document.body.appendChild(actionBar);

            grid = CardGrid.create('#test-card-grid', {
                items: sampleItems,
                viewToggle: true
            });

            // Verify the view buttons are bound
            expect(grid.els.viewBtns).toBeDefined();
            expect(grid.els.viewBtns.length).toBe(2);

            // Clean up
            document.body.removeChild(actionBar);
        });

    });

});
