/**
 * Funky.ActionBar Tests
 *
 * Tests for the declarative action toolbar component with
 * keyboard navigation and LiveBinding integration.
 */

describe('Funky.Component.ActionBar', function() {

    var ActionBar = Funky.ActionBar;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        if (ActionBar && ActionBar.destroyAll) {
            ActionBar.destroyAll();
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('ActionBar')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof ActionBar.init).toBe('function');
        });

        it('has create method', function() {
            expect(typeof ActionBar.create).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof ActionBar.getInstance).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof ActionBar.destroyAll).toBe('function');
        });

    });

    describe('init()', function() {

        it('initializes toolbar with action-bar class and toolbar role', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" aria-label="Test actions">' +
                    '<button data-action="create">Add</button>' +
                '</div>'
            );

            // Use initAll for auto-initialization from data attributes
            ActionBar.initAll();

            var toolbar = fixture.query('.action-bar');
            expect(toolbar._actionBar).toBeDefined();
        });

        it('does not re-initialize same element', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" aria-label="Test">' +
                    '<button data-action="test">Test</button>' +
                '</div>'
            );

            // Use initAll for auto-initialization from data attributes
            ActionBar.initAll();
            var firstInstance = fixture.query('.action-bar')._actionBar;

            ActionBar.initAll();
            var secondInstance = fixture.query('.action-bar')._actionBar;

            expect(firstInstance).toBe(secondInstance);
        });

        it('captures entity attribute', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" data-entity="clients">' +
                    '<button data-action="create">Add</button>' +
                '</div>'
            );

            // Use initAll for auto-initialization from data attributes
            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            expect(instance.entity).toBe('clients');
        });

        it('captures api attribute', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" data-api="/api/clients">' +
                    '<button data-action="create">Add</button>' +
                '</div>'
            );

            // Use initAll for auto-initialization from data attributes
            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            expect(instance.api).toBe('/api/clients');
        });

        it('captures tableId attribute', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" data-table-id="clients-table">' +
                    '<button data-action="create">Add</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            expect(instance.tableId).toBe('clients-table');
        });

    });

    describe('create()', function() {

        it('creates toolbar in container', function() {
            fixture.html('<div id="toolbar-container"></div>');

            ActionBar.create({
                container: '#toolbar-container',
                buttons: [{ action: 'create' }]
            });

            var toolbar = fixture.query('.action-bar');
            expect(toolbar).not.toBeNull();
            expect(toolbar.getAttribute('role')).toBe('toolbar');
        });

        it('creates buttons from config', function() {
            fixture.html('<div id="toolbar-container"></div>');

            ActionBar.create({
                container: '#toolbar-container',
                buttons: [
                    { action: 'create' },
                    { action: 'export' },
                    { action: 'filter' }
                ]
            });

            var buttons = fixture.queryAll('[data-action]');
            expect(buttons.length).toBe(3);
        });

        it('sets entity attribute', function() {
            fixture.html('<div id="toolbar-container"></div>');

            ActionBar.create({
                container: '#toolbar-container',
                entity: 'products',
                buttons: [{ action: 'create' }]
            });

            var toolbar = fixture.query('.action-bar');
            expect(toolbar.getAttribute('data-entity')).toBe('products');
        });

        it('sets api attribute', function() {
            fixture.html('<div id="toolbar-container"></div>');

            ActionBar.create({
                container: '#toolbar-container',
                api: '/api/products',
                buttons: [{ action: 'create' }]
            });

            var toolbar = fixture.query('.action-bar');
            expect(toolbar.getAttribute('data-api')).toBe('/api/products');
        });

        it('sets aria-label', function() {
            fixture.html('<div id="toolbar-container"></div>');

            ActionBar.create({
                container: '#toolbar-container',
                ariaLabel: 'Product actions',
                buttons: [{ action: 'create' }]
            });

            var toolbar = fixture.query('.action-bar');
            expect(toolbar.getAttribute('aria-label')).toBe('Product actions');
        });

        it('returns null for missing container', function() {
            var result = ActionBar.create({
                container: '#non-existent',
                buttons: [{ action: 'create' }]
            });

            expect(result).toBeNull();
        });

        it('accepts DOM element as container', function() {
            fixture.html('<div id="toolbar-container"></div>');
            var container = document.getElementById('toolbar-container');

            ActionBar.create({
                container: container,
                buttons: [{ action: 'create' }]
            });

            var toolbar = fixture.query('.action-bar');
            expect(toolbar).not.toBeNull();
        });

        it('prepends to container when position is prepend', function() {
            fixture.html(
                '<div id="toolbar-container">' +
                    '<div class="existing">Existing</div>' +
                '</div>'
            );

            ActionBar.create({
                container: '#toolbar-container',
                position: 'prepend',
                buttons: [{ action: 'create' }]
            });

            var container = document.getElementById('toolbar-container');
            expect(container.firstElementChild.classList.contains('action-bar')).toBe(true);
        });

    });

    describe('Button creation', function() {

        it('creates button with custom label', function() {
            fixture.html('<div id="container"></div>');

            ActionBar.create({
                container: '#container',
                buttons: [{ action: 'create', label: 'Add New Item' }]
            });

            var btn = fixture.query('[data-action="create"]');
            expect(btn.textContent).toContain('Add New Item');
        });

        it('creates button with icon', function() {
            fixture.html('<div id="container"></div>');

            ActionBar.create({
                container: '#container',
                buttons: [{ action: 'create', icon: 'fa-plus' }]
            });

            var icon = fixture.query('[data-action="create"] i.fa-plus');
            expect(icon).not.toBeNull();
        });

        it('creates button with variant', function() {
            fixture.html('<div id="container"></div>');

            ActionBar.create({
                container: '#container',
                buttons: [{ action: 'custom', variant: 'success' }]
            });

            var btn = fixture.query('[data-action="custom"]');
            expect(btn.classList.contains('btn-success')).toBe(true);
        });

        it('creates icon-only button with title', function() {
            fixture.html('<div id="container"></div>');

            ActionBar.create({
                container: '#container',
                buttons: [{ action: 'create', label: 'Add', iconOnly: true }]
            });

            var btn = fixture.query('[data-action="create"]');
            expect(btn.getAttribute('title')).toBe('Add');
            expect(btn.getAttribute('aria-label')).toBe('Add');
        });

        it('applies custom attributes', function() {
            fixture.html('<div id="container"></div>');

            ActionBar.create({
                container: '#container',
                buttons: [{
                    action: 'filter',
                    attrs: { 'data-filter-target': '#filterPanel' }
                }]
            });

            var btn = fixture.query('[data-action="filter"]');
            expect(btn.getAttribute('data-filter-target')).toBe('#filterPanel');
        });

    });

    describe('getInstance()', function() {

        it('returns instance by selector', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="test">Test</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            expect(instance).not.toBeNull();
            expect(instance.el).toBe(fixture.query('.action-bar'));
        });

        it('returns null for non-existent element', function() {
            var result = ActionBar.getInstance('#non-existent');
            expect(result).toBeNull();
        });

    });

    describe('Instance methods', function() {

        it('getButton() returns button by action', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                    '<button data-action="export">Export</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');
            var btn = instance.getButton('create');

            expect(btn).not.toBeNull();
            expect(btn.getAttribute('data-action')).toBe('create');
        });

        it('getButton() returns null for non-existent action', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');
            var btn = instance.getButton('non-existent');

            expect(btn).toBeNull();
        });

        it('setEnabled() disables button', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            instance.setEnabled('create', false);
            var btn = instance.getButton('create');

            expect(btn.disabled).toBe(true);
        });

        it('setEnabled() enables button', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create" disabled>Add</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            instance.setEnabled('create', true);
            var btn = instance.getButton('create');

            expect(btn.disabled).toBe(false);
        });

        it('setLoading() adds loading state', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            instance.setLoading('create', true);
            var btn = instance.getButton('create');

            expect(btn.disabled).toBe(true);
            expect(btn.classList.contains('is-loading')).toBe(true);
        });

        it('setLoading() removes loading state', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create" class="is-loading" disabled>Add</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            instance.setLoading('create', false);
            var btn = instance.getButton('create');

            expect(btn.disabled).toBe(false);
            expect(btn.classList.contains('is-loading')).toBe(false);
        });

        it('setFilterCount() adds badge', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="filter">Filter</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            instance.setFilterCount(5);
            var badge = fixture.query('[data-action="filter"] .badge');

            expect(badge).not.toBeNull();
            expect(badge.textContent).toBe('5');
        });

        it('setFilterCount() removes badge when count is 0', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="filter">' +
                        'Filter<span class="badge">3</span>' +
                    '</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            instance.setFilterCount(0);
            var badge = fixture.query('[data-action="filter"] .badge');

            expect(badge).toBeNull();
        });

        it('setBulkSelection() shows bulk button', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="bulk" class="d-none">Bulk</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            instance.setBulkSelection(5);
            var btn = instance.getButton('bulk');

            expect(btn.classList.contains('d-none')).toBe(false);
        });

        it('setBulkSelection() hides bulk button when count is 0', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="bulk">Bulk</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            instance.setBulkSelection(0);
            var btn = instance.getButton('bulk');

            expect(btn.classList.contains('d-none')).toBe(true);
        });

    });

    describe('Keyboard navigation', function() {

        it('first button has tabindex 0', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                    '<button data-action="export">Export</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var buttons = fixture.queryAll('[data-action]');

            expect(buttons[0].getAttribute('tabindex')).toBe('0');
            expect(buttons[1].getAttribute('tabindex')).toBe('-1');
        });

        it('ArrowRight moves focus to next button', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                    '<button data-action="export">Export</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var buttons = fixture.queryAll('[data-action]');

            buttons[0].focus();

            var event = new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true
            });
            toolbar.dispatchEvent(event);

            expect(document.activeElement).toBe(buttons[1]);
        });

        it('ArrowLeft moves focus to previous button', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                    '<button data-action="export">Export</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var buttons = fixture.queryAll('[data-action]');

            buttons[1].focus();

            var event = new KeyboardEvent('keydown', {
                key: 'ArrowLeft',
                bubbles: true
            });
            toolbar.dispatchEvent(event);

            expect(document.activeElement).toBe(buttons[0]);
        });

        it('Home moves focus to first button', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                    '<button data-action="export">Export</button>' +
                    '<button data-action="filter">Filter</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var buttons = fixture.queryAll('[data-action]');

            buttons[2].focus();

            var event = new KeyboardEvent('keydown', {
                key: 'Home',
                bubbles: true
            });
            toolbar.dispatchEvent(event);

            expect(document.activeElement).toBe(buttons[0]);
        });

        it('End moves focus to last button', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                    '<button data-action="export">Export</button>' +
                    '<button data-action="filter">Filter</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var buttons = fixture.queryAll('[data-action]');

            buttons[0].focus();

            var event = new KeyboardEvent('keydown', {
                key: 'End',
                bubbles: true
            });
            toolbar.dispatchEvent(event);

            expect(document.activeElement).toBe(buttons[2]);
        });

        it('wraps from last to first button', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                    '<button data-action="export">Export</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var buttons = fixture.queryAll('[data-action]');

            buttons[1].focus();

            var event = new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true
            });
            toolbar.dispatchEvent(event);

            expect(document.activeElement).toBe(buttons[0]);
        });

        it('wraps from first to last button', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                    '<button data-action="export">Export</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var buttons = fixture.queryAll('[data-action]');

            buttons[0].focus();

            var event = new KeyboardEvent('keydown', {
                key: 'ArrowLeft',
                bubbles: true
            });
            toolbar.dispatchEvent(event);

            expect(document.activeElement).toBe(buttons[1]);
        });

        it('skips disabled buttons', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="create">Add</button>' +
                    '<button data-action="export" disabled>Export</button>' +
                    '<button data-action="filter">Filter</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var buttons = fixture.queryAll('[data-action]');

            buttons[0].focus();

            var event = new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true
            });
            toolbar.dispatchEvent(event);

            expect(document.activeElement).toBe(buttons[2]);
        });

    });

    describe('Action events', function() {

        it('emits action event on button click', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" data-entity="clients">' +
                    '<button data-action="create">Add</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var btn = fixture.query('[data-action="create"]');

            var eventFired = false;
            var eventDetail = null;

            toolbar.addEventListener('funky.action-bar.action', function(e) {
                eventFired = true;
                eventDetail = e.detail;
            });

            btn.click();

            expect(eventFired).toBe(true);
            expect(eventDetail.action).toBe('create');
            expect(eventDetail.entity).toBe('clients');
        });

        it('emits create event', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" data-entity="clients">' +
                    '<button data-action="create" data-modal="#clientModal">Add</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var btn = fixture.query('[data-action="create"]');

            var eventFired = false;
            var eventDetail = null;

            toolbar.addEventListener('funky.action-bar.create', function(e) {
                eventFired = true;
                eventDetail = e.detail;
            });

            btn.click();

            expect(eventFired).toBe(true);
            expect(eventDetail.entity).toBe('clients');
            expect(eventDetail.modalId).toBe('#clientModal');
        });

        it('emits export event', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" data-entity="clients">' +
                    '<button data-action="export">Export</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var btn = fixture.query('[data-action="export"]');

            var eventFired = false;

            toolbar.addEventListener('funky.action-bar.export', function(e) {
                eventFired = true;
            });

            btn.click();

            expect(eventFired).toBe(true);
        });

        it('emits import event', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" data-entity="clients">' +
                    '<button data-action="import">Import</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var btn = fixture.query('[data-action="import"]');

            var eventFired = false;

            toolbar.addEventListener('funky.action-bar.import', function(e) {
                eventFired = true;
            });

            btn.click();

            expect(eventFired).toBe(true);
        });

        it('toggles filter and emits event', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="filter" aria-expanded="false">Filter</button>' +
                '</div>' +
                '<div id="filterPanel" class="d-none"></div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var btn = fixture.query('[data-action="filter"]');

            var eventFired = false;
            var eventDetail = null;

            toolbar.addEventListener('funky.action-bar.filter-toggle', function(e) {
                eventFired = true;
                eventDetail = e.detail;
            });

            btn.click();

            expect(eventFired).toBe(true);
            expect(eventDetail.visible).toBe(true);
            expect(btn.getAttribute('aria-expanded')).toBe('true');
        });

        it('emits custom event', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="custom" data-custom-action="special">Custom</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var toolbar = fixture.query('.action-bar');
            var btn = fixture.query('[data-action="custom"]');

            var eventFired = false;
            var eventDetail = null;

            toolbar.addEventListener('funky.action-bar.custom', function(e) {
                eventFired = true;
                eventDetail = e.detail;
            });

            btn.click();

            expect(eventFired).toBe(true);
            expect(eventDetail.action).toBe('special');
        });

    });

    describe('destroy()', function() {

        it('cleans up instance', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar">' +
                    '<button data-action="test">Test</button>' +
                '</div>'
            );

            ActionBar.initAll();
            var instance = ActionBar.getInstance('.action-bar');

            instance.destroy();

            expect(fixture.query('.action-bar')._actionBar).toBeNull();
        });

    });

    describe('destroyAll()', function() {

        it('destroys all instances', function() {
            fixture.html(
                '<div class="action-bar" role="toolbar" id="bar1">' +
                    '<button data-action="test">Test</button>' +
                '</div>' +
                '<div class="action-bar" role="toolbar" id="bar2">' +
                    '<button data-action="test">Test</button>' +
                '</div>'
            );

            ActionBar.initAll();
            ActionBar.destroyAll();

            expect(document.getElementById('bar1')._actionBar).toBeNull();
            expect(document.getElementById('bar2')._actionBar).toBeNull();
        });

    });

    describe('Accessibility', function() {

        it('toolbar has role="toolbar"', function() {
            fixture.html('<div id="container"></div>');

            ActionBar.create({
                container: '#container',
                buttons: [{ action: 'create' }]
            });

            var toolbar = fixture.query('.action-bar');
            expect(toolbar.getAttribute('role')).toBe('toolbar');
        });

        it('toolbar has aria-label', function() {
            fixture.html('<div id="container"></div>');

            ActionBar.create({
                container: '#container',
                ariaLabel: 'Page actions',
                buttons: [{ action: 'create' }]
            });

            var toolbar = fixture.query('.action-bar');
            expect(toolbar.getAttribute('aria-label')).toBe('Page actions');
        });

        it('buttons have type="button"', function() {
            fixture.html('<div id="container"></div>');

            ActionBar.create({
                container: '#container',
                buttons: [
                    { action: 'create' },
                    { action: 'export' }
                ]
            });

            var buttons = fixture.queryAll('[data-action]');
            buttons.forEach(function(btn) {
                expect(btn.getAttribute('type')).toBe('button');
            });
        });

        it('filter button has aria-expanded', function() {
            fixture.html('<div id="container"></div>');

            ActionBar.create({
                container: '#container',
                buttons: [{ action: 'filter' }]
            });

            var btn = fixture.query('[data-action="filter"]');
            expect(btn.getAttribute('aria-expanded')).toBe('false');
        });

    });

});
