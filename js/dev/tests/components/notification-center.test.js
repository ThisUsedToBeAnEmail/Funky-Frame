/**
 * Funky.NotificationCenter Tests
 *
 * Tests for the NotificationCenter component - in-app notification system
 * with bell icon, dropdown panel, badge, filters, and real-time updates.
 */

FunkyTests.describe('Funky.Component.NotificationCenter', function() {

    var expect = FunkyTests.expect;
    var NotificationCenter = Funky.NotificationCenter;
    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="notification-container"></div>'
        );

        // Reset any previous instance
        if (NotificationCenter && NotificationCenter.destroy) {
            NotificationCenter.destroy();
        }
    });

    FunkyTests.afterEach(function() {
        if (NotificationCenter && NotificationCenter.destroy) {
            NotificationCenter.destroy();
        }
        fixture.cleanup();

        // Clean up any orphaned announcer elements
        var announcers = document.querySelectorAll('.notification-center__announcer');
        for (var i = 0; i < announcers.length; i++) {
            if (announcers[i].parentNode) {
                announcers[i].parentNode.removeChild(announcers[i]);
            }
        }
    });

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    FunkyTests.describe('Registration', function() {

        FunkyTests.it('is registered with Funky namespace', function() {
            expect(NotificationCenter).toBeDefined();
        });

        FunkyTests.it('has init method', function() {
            expect(typeof NotificationCenter.init).toBe('function');
        });

        FunkyTests.it('has destroy method', function() {
            expect(typeof NotificationCenter.destroy).toBe('function');
        });

        FunkyTests.it('has open method', function() {
            expect(typeof NotificationCenter.open).toBe('function');
        });

        FunkyTests.it('has close method', function() {
            expect(typeof NotificationCenter.close).toBe('function');
        });

        FunkyTests.it('has toggle method', function() {
            expect(typeof NotificationCenter.toggle).toBe('function');
        });

    });

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    FunkyTests.describe('Initialization', function() {

        FunkyTests.it('creates trigger button', function() {
            NotificationCenter.init({
                container: '#notification-container'
            });

            var trigger = document.querySelector('.notification-center__trigger');
            expect(trigger).toBeDefined();
            expect(trigger).not.toBeNull();
        });

        FunkyTests.it('creates dropdown panel', function() {
            NotificationCenter.init({
                container: '#notification-container'
            });

            var dropdown = document.querySelector('.notification-center__dropdown');
            expect(dropdown).toBeDefined();
            expect(dropdown).not.toBeNull();
        });

        FunkyTests.it('creates badge element', function() {
            NotificationCenter.init({
                container: '#notification-container'
            });

            var badge = document.querySelector('.notification-center__badge');
            expect(badge).toBeDefined();
            expect(badge).not.toBeNull();
        });

        FunkyTests.it('creates notification list', function() {
            NotificationCenter.init({
                container: '#notification-container'
            });

            var list = document.querySelector('.notification-center__list');
            expect(list).toBeDefined();
            expect(list).not.toBeNull();
        });

        FunkyTests.it('dropdown is initially hidden', function() {
            NotificationCenter.init({
                container: '#notification-container'
            });

            var dropdown = document.querySelector('.notification-center__dropdown');
            expect(dropdown.hasAttribute('hidden')).toBe(true);
        });

        FunkyTests.it('returns this for chaining', function() {
            var result = NotificationCenter.init({
                container: '#notification-container'
            });

            expect(result).toBe(NotificationCenter);
        });

        FunkyTests.it('registers instance with instanceId', function() {
            NotificationCenter.init({
                container: '#notification-container',
                instanceId: 'test_instance'
            });

            var instance = NotificationCenter.getInstance('test_instance');
            expect(instance).toBeDefined();
        });

    });

    // =========================================================================
    // OPEN / CLOSE / TOGGLE
    // =========================================================================

    FunkyTests.describe('Open/Close/Toggle', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.init({
                container: '#notification-container'
            });
        });

        FunkyTests.it('open() opens dropdown', function() {
            NotificationCenter.open();
            expect(NotificationCenter.isOpen()).toBe(true);
        });

        FunkyTests.it('close() closes dropdown', function() {
            NotificationCenter.open();
            NotificationCenter.close();
            expect(NotificationCenter.isOpen()).toBe(false);
        });

        FunkyTests.it('toggle() toggles open state', function() {
            expect(NotificationCenter.isOpen()).toBe(false);
            NotificationCenter.toggle();
            expect(NotificationCenter.isOpen()).toBe(true);
            NotificationCenter.toggle();
            expect(NotificationCenter.isOpen()).toBe(false);
        });

        FunkyTests.it('opens dropdown on trigger click', function() {
            var trigger = document.querySelector('.notification-center__trigger');
            FunkyTests.simulate.click(trigger);
            expect(NotificationCenter.isOpen()).toBe(true);
        });

        FunkyTests.it('closes dropdown on escape key', function() {
            NotificationCenter.open();
            FunkyTests.simulate.keydown(document, { key: 'Escape' });
            expect(NotificationCenter.isOpen()).toBe(false);
        });

        FunkyTests.it('emits open event', function(done) {
            var container = document.getElementById('notification-container');

            Funky.Events.on(container, 'funky.notification.open', function() {
                done();
            });

            NotificationCenter.open();
        });

        FunkyTests.it('emits close event', function(done) {
            var container = document.getElementById('notification-container');
            NotificationCenter.open();

            Funky.Events.on(container, 'funky.notification.close', function() {
                done();
            });

            NotificationCenter.close();
        });

        FunkyTests.it('adds open class to dropdown', function() {
            NotificationCenter.open();
            var dropdown = document.querySelector('.notification-center__dropdown');
            expect(dropdown.classList.contains('notification-center__dropdown--open')).toBe(true);
        });

        FunkyTests.it('removes hidden attribute on open', function() {
            NotificationCenter.open();
            var dropdown = document.querySelector('.notification-center__dropdown');
            expect(dropdown.hasAttribute('hidden')).toBe(false);
        });

    });

    // =========================================================================
    // LIVEBINDING DATA METHODS
    // =========================================================================

    FunkyTests.describe('LiveBinding Data Methods', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.init({
                container: '#notification-container'
            });
        });

        FunkyTests.it('setData sets notifications array', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test 1', read: false },
                { id: '2', title: 'Test 2', read: true }
            ]);

            var data = NotificationCenter.getData();
            expect(data.length).toBe(2);
        });

        FunkyTests.it('getData returns notifications array', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            var data = NotificationCenter.getData();
            expect(Array.isArray(data)).toBe(true);
            expect(data[0].title).toBe('Test');
        });

        FunkyTests.it('addItem adds notification to beginning', function() {
            NotificationCenter.setData([
                { id: '1', title: 'First', read: false }
            ]);

            NotificationCenter.addItem({
                id: '2',
                title: 'Second',
                read: false
            });

            var data = NotificationCenter.getData();
            expect(data.length).toBe(2);
            expect(data[0].title).toBe('Second');
        });

        FunkyTests.it('removeItem removes notification by id', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            NotificationCenter.removeItem('1');

            var data = NotificationCenter.getData();
            expect(data.length).toBe(0);
        });

        FunkyTests.it('updateItem updates notification properties', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            NotificationCenter.updateItem('1', { read: true, title: 'Updated' });

            var data = NotificationCenter.getData();
            expect(data[0].read).toBe(true);
            expect(data[0].title).toBe('Updated');
        });

        FunkyTests.it('add() is alias for addItem', function() {
            NotificationCenter.add({
                id: '1',
                title: 'Added',
                read: false
            });

            var data = NotificationCenter.getData();
            expect(data.length).toBe(1);
            expect(data[0].title).toBe('Added');
        });

        FunkyTests.it('remove() is alias for removeItem', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            NotificationCenter.remove('1');

            var data = NotificationCenter.getData();
            expect(data.length).toBe(0);
        });

    });

    // =========================================================================
    // BADGE
    // =========================================================================

    FunkyTests.describe('Badge', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.init({
                container: '#notification-container'
            });
        });

        FunkyTests.it('shows unread count', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test 1', read: false },
                { id: '2', title: 'Test 2', read: false },
                { id: '3', title: 'Test 3', read: true }
            ]);

            var badge = document.querySelector('.notification-center__badge');
            expect(badge.textContent).toBe('2');
        });

        FunkyTests.it('hides badge when no unread', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: true }
            ]);

            var badge = document.querySelector('.notification-center__badge');
            expect(badge.classList.contains('notification-center__badge--empty')).toBe(true);
        });

        FunkyTests.it('shows 99+ for large counts', function() {
            var notifications = [];
            for (var i = 0; i < 150; i++) {
                notifications.push({ id: String(i), title: 'Test ' + i, read: false });
            }
            NotificationCenter.setData(notifications);

            var badge = document.querySelector('.notification-center__badge');
            expect(badge.textContent).toBe('99+');
        });

        FunkyTests.it('getUnreadCount returns correct count', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test 1', read: false },
                { id: '2', title: 'Test 2', read: false },
                { id: '3', title: 'Test 3', read: true }
            ]);

            expect(NotificationCenter.getUnreadCount()).toBe(2);
        });

        FunkyTests.it('updates badge when notification marked read', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            NotificationCenter.markRead('1');

            var badge = document.querySelector('.notification-center__badge');
            expect(badge.classList.contains('notification-center__badge--empty')).toBe(true);
        });

    });

    // =========================================================================
    // MARK READ
    // =========================================================================

    FunkyTests.describe('Mark Read', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.init({
                container: '#notification-container'
            });
        });

        FunkyTests.it('markRead marks single notification', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            NotificationCenter.markRead('1');

            var data = NotificationCenter.getData();
            expect(data[0].read).toBe(true);
        });

        FunkyTests.it('markAllRead marks all notifications', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test 1', read: false },
                { id: '2', title: 'Test 2', read: false }
            ]);

            NotificationCenter.markAllRead();

            var data = NotificationCenter.getData();
            expect(data.every(function(n) { return n.read; })).toBe(true);
        });

        FunkyTests.it('updates unread count on markRead', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            NotificationCenter.markRead('1');

            expect(NotificationCenter.getUnreadCount()).toBe(0);
        });

        FunkyTests.it('removes unread class from item', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);
            NotificationCenter.open();

            NotificationCenter.markRead('1');

            var item = document.querySelector('.notification-center__item');
            expect(item.classList.contains('notification-center__item--unread')).toBe(false);
        });

    });

    // =========================================================================
    // FILTERS
    // =========================================================================

    FunkyTests.describe('Filters', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.init({
                container: '#notification-container'
            });

            NotificationCenter.setData([
                { id: '1', title: 'Trade 1', category: 'trade', read: false },
                { id: '2', title: 'System', category: 'system', read: true },
                { id: '3', title: 'Trade 2', category: 'trade', read: true }
            ]);
        });

        FunkyTests.it('filter by category works', function() {
            NotificationCenter.filter('trade');
            NotificationCenter.open();

            var items = document.querySelectorAll('.notification-center__item');
            expect(items.length).toBe(2);
        });

        FunkyTests.it('filter by unread works', function() {
            NotificationCenter.filter('unread');
            NotificationCenter.open();

            var items = document.querySelectorAll('.notification-center__item');
            expect(items.length).toBe(1);
        });

        FunkyTests.it('filter all shows everything', function() {
            NotificationCenter.filter('all');
            NotificationCenter.open();

            var items = document.querySelectorAll('.notification-center__item');
            expect(items.length).toBe(3);
        });

        FunkyTests.it('getFilter returns current filter', function() {
            NotificationCenter.filter('trade');
            expect(NotificationCenter.getFilter()).toBe('trade');
        });

    });

    // =========================================================================
    // RENDERING
    // =========================================================================

    FunkyTests.describe('Rendering', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.init({
                container: '#notification-container'
            });
        });

        FunkyTests.it('renders notification items', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test Title', body: 'Test body', read: false }
            ]);
            NotificationCenter.open();

            var item = document.querySelector('.notification-center__item');
            expect(item).not.toBeNull();
        });

        FunkyTests.it('renders title text', function() {
            NotificationCenter.setData([
                { id: '1', title: 'My Title', read: false }
            ]);
            NotificationCenter.open();

            var title = document.querySelector('.notification-center__title');
            expect(title.textContent).toContain('My Title');
        });

        FunkyTests.it('renders body text', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Title', body: 'My Body Text', read: false }
            ]);
            NotificationCenter.open();

            var body = document.querySelector('.notification-center__body');
            expect(body.textContent).toContain('My Body Text');
        });

        FunkyTests.it('applies unread class to unread items', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);
            NotificationCenter.open();

            var item = document.querySelector('.notification-center__item');
            expect(item.classList.contains('notification-center__item--unread')).toBe(true);
        });

        FunkyTests.it('shows empty state when no notifications', function() {
            NotificationCenter.setData([]);
            NotificationCenter.open();

            var empty = document.querySelector('.notification-center__empty');
            expect(empty).not.toBeNull();
        });

        FunkyTests.it('sets data-notification-id on items', function() {
            NotificationCenter.setData([
                { id: 'notif-123', title: 'Test', read: false }
            ]);
            NotificationCenter.open();

            var item = document.querySelector('.notification-center__item');
            expect(item.getAttribute('data-notification-id')).toBe('notif-123');
        });

    });

    // =========================================================================
    // ACTIONS
    // =========================================================================

    FunkyTests.describe('Actions', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.init({
                container: '#notification-container'
            });
        });

        FunkyTests.it('registerAction adds handler', function() {
            var called = false;
            NotificationCenter.registerAction('test', function() {
                called = true;
            });

            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            var notification = NotificationCenter.getData()[0];
            NotificationCenter.executeAction('test', notification);

            expect(called).toBe(true);
        });

        FunkyTests.it('unregisterAction removes handler', function() {
            var called = false;
            NotificationCenter.registerAction('test', function() {
                called = true;
            });
            NotificationCenter.unregisterAction('test');

            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            var notification = NotificationCenter.getData()[0];
            NotificationCenter.executeAction('test', notification);

            expect(called).toBe(false);
        });

        FunkyTests.it('getActionHandlers returns handlers', function() {
            NotificationCenter.registerAction('test', function() {});
            var handlers = NotificationCenter.getActionHandlers();
            expect(handlers.test).toBeDefined();
        });

        FunkyTests.it('built-in dismiss action works', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            var notification = NotificationCenter.getData()[0];
            NotificationCenter.executeAction('dismiss', notification);

            expect(NotificationCenter.getData().length).toBe(0);
        });

        FunkyTests.it('built-in mark-read action works', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            var notification = NotificationCenter.getData()[0];
            NotificationCenter.executeAction('mark-read', notification);

            expect(NotificationCenter.getData()[0].read).toBe(true);
        });

        FunkyTests.it('emits action event via PubSub', function(done) {
            Funky.PubSub.on('funky:notification:action', function(data) {
                expect(data.action).toBe('test-action');
                Funky.PubSub.off('funky:notification:action');
                done();
            });

            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            var notification = NotificationCenter.getData()[0];
            NotificationCenter.executeAction('test-action', notification);
        });

        FunkyTests.it('bulkAction executes on multiple notifications', function() {
            var count = 0;
            NotificationCenter.registerAction('count', function() {
                count++;
            });

            NotificationCenter.setData([
                { id: '1', title: 'Test 1', read: false },
                { id: '2', title: 'Test 2', read: false }
            ]);

            NotificationCenter.bulkAction('count', ['1', '2']);

            expect(count).toBe(2);
        });

        FunkyTests.it('actionAll executes on all notifications', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test 1', read: false },
                { id: '2', title: 'Test 2', read: false }
            ]);

            NotificationCenter.actionAll('mark-read');

            var data = NotificationCenter.getData();
            expect(data.every(function(n) { return n.read; })).toBe(true);
        });

    });

    // =========================================================================
    // SETTINGS
    // =========================================================================

    FunkyTests.describe('Settings', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.init({
                container: '#notification-container'
            });
        });

        FunkyTests.it('getSettings returns settings object', function() {
            var settings = NotificationCenter.getSettings();
            expect(settings).toBeDefined();
            expect(typeof settings.sound).toBe('boolean');
            expect(typeof settings.desktop).toBe('boolean');
        });

        FunkyTests.it('setSettings updates sound setting', function() {
            NotificationCenter.setSettings({ sound: false });
            var settings = NotificationCenter.getSettings();
            expect(settings.sound).toBe(false);
        });

        FunkyTests.it('setSettings updates volume setting', function() {
            NotificationCenter.setSettings({ soundVolume: 0.75 });
            var settings = NotificationCenter.getSettings();
            expect(settings.soundVolume).toBe(0.75);
        });

        FunkyTests.it('setSettings clamps volume to 0-1', function() {
            NotificationCenter.setSettings({ soundVolume: 2 });
            var settings = NotificationCenter.getSettings();
            expect(settings.soundVolume).toBe(1);

            NotificationCenter.setSettings({ soundVolume: -1 });
            settings = NotificationCenter.getSettings();
            expect(settings.soundVolume).toBe(0);
        });

    });

    // =========================================================================
    // DESTROY
    // =========================================================================

    FunkyTests.describe('Destroy', function() {

        FunkyTests.it('removes DOM elements', function() {
            NotificationCenter.init({
                container: '#notification-container'
            });

            NotificationCenter.destroy();

            var trigger = document.querySelector('.notification-center__trigger');
            expect(trigger).toBeNull();
        });

        FunkyTests.it('clears notifications data', function() {
            NotificationCenter.init({
                container: '#notification-container'
            });

            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            NotificationCenter.destroy();
            NotificationCenter.init({
                container: '#notification-container'
            });

            expect(NotificationCenter.getData().length).toBe(0);
        });

        FunkyTests.it('closes dropdown if open', function() {
            NotificationCenter.init({
                container: '#notification-container'
            });

            NotificationCenter.open();
            NotificationCenter.destroy();

            // Re-init should start closed
            NotificationCenter.init({
                container: '#notification-container'
            });

            expect(NotificationCenter.isOpen()).toBe(false);
        });

    });

});
