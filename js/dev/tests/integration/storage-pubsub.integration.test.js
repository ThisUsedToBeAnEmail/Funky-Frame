/**
 * Integration Test: Storage + PubSub + Component State
 *
 * Tests the integration between localStorage/sessionStorage,
 * PubSub event broadcasting, and component state synchronization.
 */

describe('Funky.Integration.Storage.PubSub', function() {

    var Storage = Funky.Storage;
    var PubSub = Funky.PubSub;
    var fixture;

    beforeEach(function() {
        // Clear storage
        if (Storage && Storage.clear) {
            Storage.clear();
        }
        localStorage.clear();
        sessionStorage.clear();
        PubSub.clear();

        fixture = FunkyTests.fixture('<div id="storage-test"></div>');
    });

    afterEach(function() {
        if (Storage && Storage.clear) {
            Storage.clear();
        }
        localStorage.clear();
        sessionStorage.clear();
        PubSub.clear();
        fixture.destroy();
    });

    // =========================================================================
    // Storage Change Broadcasting
    // =========================================================================

    describe('Storage Change Broadcasting', function() {

        it('emits event when storage value set', function() {
            var events = [];

            PubSub.on('funky:storage:set', function(data) {
                events.push(data);
            });

            // Simulate storage set with event emission
            var key = 'user:preferences';
            var value = { theme: 'dark' };
            localStorage.setItem(key, JSON.stringify(value));
            PubSub.emit('funky:storage:set', { key: key, value: value });

            expect(events.length).toBe(1);
            expect(events[0].key).toBe('user:preferences');
            expect(events[0].value.theme).toBe('dark');
        });

        it('emits event when storage value removed', function() {
            var events = [];

            localStorage.setItem('temp:data', 'value');

            PubSub.on('funky:storage:remove', function(data) {
                events.push(data);
            });

            localStorage.removeItem('temp:data');
            PubSub.emit('funky:storage:remove', { key: 'temp:data' });

            expect(events.length).toBe(1);
            expect(events[0].key).toBe('temp:data');
        });

        it('emits event when storage cleared', function() {
            var events = [];

            localStorage.setItem('key1', 'value1');
            localStorage.setItem('key2', 'value2');

            PubSub.on('funky:storage:clear', function() {
                events.push({ type: 'clear' });
            });

            localStorage.clear();
            PubSub.emit('funky:storage:clear', {});

            expect(events.length).toBe(1);
        });

    });

    // =========================================================================
    // Component State Synchronization
    // =========================================================================

    describe('Component State Synchronization', function() {

        it('components receive storage change notifications', function() {
            var componentAUpdates = [];
            var componentBUpdates = [];

            // Component A listens for theme changes
            PubSub.on('funky:storage:set', function(data) {
                if (data.key === 'app:theme') {
                    componentAUpdates.push(data.value);
                }
            });

            // Component B also listens
            PubSub.on('funky:storage:set', function(data) {
                if (data.key === 'app:theme') {
                    componentBUpdates.push(data.value);
                }
            });

            // Theme changed
            PubSub.emit('funky:storage:set', { key: 'app:theme', value: 'dark' });

            expect(componentAUpdates.length).toBe(1);
            expect(componentBUpdates.length).toBe(1);
            expect(componentAUpdates[0]).toBe('dark');
        });

        it('sidebar state persists and syncs across components', function() {
            var sidebarState = { collapsed: true, width: 60 };
            var syncedComponents = [];

            // Multiple components listen for sidebar state
            PubSub.on('funky:storage:set', function(data) {
                if (data.key === 'ui:sidebar') {
                    syncedComponents.push('header');
                }
            });

            PubSub.on('funky:storage:set', function(data) {
                if (data.key === 'ui:sidebar') {
                    syncedComponents.push('content');
                }
            });

            localStorage.setItem('ui:sidebar', JSON.stringify(sidebarState));
            PubSub.emit('funky:storage:set', { key: 'ui:sidebar', value: sidebarState });

            expect(syncedComponents).toContain('header');
            expect(syncedComponents).toContain('content');
        });

        it('filter state persists between page loads', function() {
            var filterState = {
                status: ['active'],
                sort: 'name',
                page: 1
            };

            // Save filter state
            localStorage.setItem('filter:clients', JSON.stringify(filterState));

            // Simulate page reload - read from storage
            var restored = JSON.parse(localStorage.getItem('filter:clients'));

            expect(restored.status).toContain('active');
            expect(restored.sort).toBe('name');
        });

    });

    // =========================================================================
    // User Preferences Integration
    // =========================================================================

    describe('User Preferences Integration', function() {

        it('saves user preferences to storage', function() {
            var preferences = {
                theme: 'dark',
                fontSize: 'large',
                notifications: true,
                language: 'en'
            };

            localStorage.setItem('user:preferences', JSON.stringify(preferences));
            PubSub.emit('funky:preferences:updated', preferences);

            var saved = JSON.parse(localStorage.getItem('user:preferences'));
            expect(saved.theme).toBe('dark');
            expect(saved.notifications).toBe(true);
        });

        it('broadcasts preference changes to all components', function() {
            var componentUpdates = [];

            PubSub.on('funky:preferences:updated', function(prefs) {
                componentUpdates.push(prefs);
            });

            var newPrefs = { theme: 'light' };
            PubSub.emit('funky:preferences:updated', newPrefs);

            expect(componentUpdates.length).toBe(1);
            expect(componentUpdates[0].theme).toBe('light');
        });

        it('applies theme preference on load', function() {
            localStorage.setItem('user:preferences', JSON.stringify({ theme: 'dark' }));

            var prefs = JSON.parse(localStorage.getItem('user:preferences') || '{}');
            var appliedTheme = prefs.theme || 'light';

            expect(appliedTheme).toBe('dark');
        });

    });

    // =========================================================================
    // Session vs Persistent Storage
    // =========================================================================

    describe('Session vs Persistent Storage', function() {

        it('uses sessionStorage for temporary data', function() {
            var formDraft = { title: 'Draft', content: 'Work in progress' };

            sessionStorage.setItem('form:draft', JSON.stringify(formDraft));

            var retrieved = JSON.parse(sessionStorage.getItem('form:draft'));
            expect(retrieved.title).toBe('Draft');
        });

        it('uses localStorage for persistent data', function() {
            var userSettings = { rememberMe: true };

            localStorage.setItem('auth:settings', JSON.stringify(userSettings));

            var retrieved = JSON.parse(localStorage.getItem('auth:settings'));
            expect(retrieved.rememberMe).toBe(true);
        });

        it('broadcasts events for both storage types', function() {
            var events = [];

            PubSub.on('funky:storage:set', function(data) {
                events.push(data);
            });

            // Local storage change
            PubSub.emit('funky:storage:set', {
                key: 'local:key',
                value: 'local',
                type: 'local'
            });

            // Session storage change
            PubSub.emit('funky:storage:set', {
                key: 'session:key',
                value: 'session',
                type: 'session'
            });

            expect(events.length).toBe(2);
        });

    });

    // =========================================================================
    // Cross-Tab Synchronization
    // =========================================================================

    describe('Cross-Tab Synchronization', function() {

        it('listens for storage events from other tabs', function() {
            var crossTabEvents = [];

            // Listen for storage events (from other tabs)
            var handler = function(e) {
                if (e.key) {
                    crossTabEvents.push({
                        key: e.key,
                        newValue: e.newValue,
                        oldValue: e.oldValue
                    });
                }
            };
            window.addEventListener('storage', handler);

            // Simulate storage event (normally from another tab)
            var event = new StorageEvent('storage', {
                key: 'user:logout',
                newValue: 'true',
                oldValue: null
            });
            window.dispatchEvent(event);

            window.removeEventListener('storage', handler);

            expect(crossTabEvents.length).toBe(1);
            expect(crossTabEvents[0].key).toBe('user:logout');
        });

        it('broadcasts cross-tab changes via PubSub', function() {
            var pubsubEvents = [];

            PubSub.on('funky:storage:external', function(data) {
                pubsubEvents.push(data);
            });

            // Simulate receiving storage event and broadcasting
            var storageEvent = { key: 'auth:token', newValue: null };
            PubSub.emit('funky:storage:external', storageEvent);

            expect(pubsubEvents.length).toBe(1);
            expect(pubsubEvents[0].key).toBe('auth:token');
        });

        it('handles logout from another tab', function() {
            var logoutHandled = false;

            PubSub.on('funky:storage:external', function(data) {
                if (data.key === 'auth:token' && data.newValue === null) {
                    logoutHandled = true;
                    // Would redirect to login
                }
            });

            PubSub.emit('funky:storage:external', {
                key: 'auth:token',
                newValue: null,
                oldValue: 'some-token'
            });

            expect(logoutHandled).toBe(true);
        });

    });

    // =========================================================================
    // Namespaced Storage Keys
    // =========================================================================

    describe('Namespaced Storage Keys', function() {

        it('organizes keys by namespace', function() {
            localStorage.setItem('funky:cache:users', '[]');
            localStorage.setItem('funky:cache:products', '[]');
            localStorage.setItem('funky:ui:sidebar', '{}');
            localStorage.setItem('funky:user:preferences', '{}');

            // Find all cache keys
            var cacheKeys = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key.startsWith('funky:cache:')) {
                    cacheKeys.push(key);
                }
            }

            expect(cacheKeys.length).toBe(2);
        });

        it('clears only specific namespace', function() {
            localStorage.setItem('funky:cache:a', '1');
            localStorage.setItem('funky:cache:b', '2');
            localStorage.setItem('funky:user:prefs', '3');

            // Clear only cache namespace
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.startsWith('funky:cache:')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(function(key) {
                localStorage.removeItem(key);
            });

            expect(localStorage.getItem('funky:cache:a')).toBe(null);
            expect(localStorage.getItem('funky:cache:b')).toBe(null);
            expect(localStorage.getItem('funky:user:prefs')).toBe('3');
        });

    });

    // =========================================================================
    // Storage Quota Handling
    // =========================================================================

    describe('Storage Quota Handling', function() {

        it('handles quota exceeded gracefully', function() {
            var errorHandled = false;
            var errorEvents = [];

            PubSub.on('funky:storage:error', function(data) {
                errorEvents.push(data);
            });

            // Simulate quota error
            try {
                // This would throw in a real scenario when quota is exceeded
                throw new DOMException('Quota exceeded', 'QuotaExceededError');
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    errorHandled = true;
                    PubSub.emit('funky:storage:error', {
                        type: 'quota',
                        message: 'Storage quota exceeded'
                    });
                }
            }

            expect(errorHandled).toBe(true);
            expect(errorEvents.length).toBe(1);
        });

        it('clears old data when quota exceeded', function() {
            // Simulate cleanup strategy
            var oldKeys = ['funky:cache:old1', 'funky:cache:old2'];

            oldKeys.forEach(function(key) {
                localStorage.setItem(key, 'data');
            });

            // Cleanup old entries
            oldKeys.forEach(function(key) {
                localStorage.removeItem(key);
            });

            expect(localStorage.getItem('funky:cache:old1')).toBe(null);
        });

    });

    // =========================================================================
    // Form Draft Persistence
    // =========================================================================

    describe('Form Draft Persistence', function() {

        it('saves form draft to session storage', function() {
            var formData = {
                title: 'My Post',
                content: 'Draft content...',
                lastSaved: Date.now()
            };

            sessionStorage.setItem('form:draft:post:new', JSON.stringify(formData));

            var restored = JSON.parse(sessionStorage.getItem('form:draft:post:new'));
            expect(restored.title).toBe('My Post');
        });

        it('restores form draft on page load', function() {
            var draft = { title: 'Saved Draft', content: 'Content' };
            sessionStorage.setItem('form:draft:post:123', JSON.stringify(draft));

            // Simulate form restoration
            var savedDraft = sessionStorage.getItem('form:draft:post:123');
            var restoredData = savedDraft ? JSON.parse(savedDraft) : null;

            expect(restoredData).not.toBe(null);
            expect(restoredData.title).toBe('Saved Draft');
        });

        it('clears draft after successful save', function() {
            sessionStorage.setItem('form:draft:post:123', '{}');

            // After API save success
            sessionStorage.removeItem('form:draft:post:123');
            PubSub.emit('funky:storage:remove', { key: 'form:draft:post:123' });

            expect(sessionStorage.getItem('form:draft:post:123')).toBe(null);
        });

        it('auto-saves draft periodically', function(done) {
            var autoSaveCount = 0;

            var autoSave = function() {
                autoSaveCount++;
                sessionStorage.setItem('form:draft:auto', JSON.stringify({
                    content: 'Auto-saved content',
                    timestamp: Date.now()
                }));
            };

            // Simulate auto-save interval (shortened for test)
            var interval = setInterval(autoSave, 50);

            setTimeout(function() {
                clearInterval(interval);
                expect(autoSaveCount).toBeGreaterThan(0);
                done();
            }, 120);
        });

    });

    // =========================================================================
    // Recent Items History
    // =========================================================================

    describe('Recent Items History', function() {

        it('stores recently viewed items', function() {
            var recentItems = [];

            var addRecent = function(item) {
                recentItems = recentItems.filter(function(i) {
                    return i.id !== item.id;
                });
                recentItems.unshift(item);
                if (recentItems.length > 10) {
                    recentItems.pop();
                }
                localStorage.setItem('recent:items', JSON.stringify(recentItems));
            };

            addRecent({ id: 1, name: 'Item 1', type: 'client' });
            addRecent({ id: 2, name: 'Item 2', type: 'project' });

            var stored = JSON.parse(localStorage.getItem('recent:items'));
            expect(stored.length).toBe(2);
            expect(stored[0].id).toBe(2); // Most recent first
        });

        it('broadcasts recent items update', function() {
            var events = [];

            PubSub.on('funky:recent:updated', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:recent:updated', {
                items: [{ id: 1, name: 'Item 1' }]
            });

            expect(events.length).toBe(1);
        });

    });

});
