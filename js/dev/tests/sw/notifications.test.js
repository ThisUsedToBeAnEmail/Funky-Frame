/**
 * FunkySW.Notifications Tests
 *
 * Tests for Service Worker push notification handlers
 * Note: These tests mock the Notification API since they run in browser context
 */
describe('FunkySW.Notifications', function() {
    var originalRegistration;
    var originalClients;
    var mockNotifications;
    var showNotificationCalls;

    // Skip tests if FunkySW.Notifications not properly loaded
    if (typeof FunkySW === 'undefined' || !FunkySW.Notifications || !FunkySW.Notifications.show) {
        it('FunkySW.Notifications module not loaded (skipping tests)', function() {
            expect(true).toBe(true);
        });
        return;
    }

    beforeAll(function() {
        // Store originals (may be undefined in browser context)
        originalRegistration = window.registration;
        originalClients = window.clients;
    });

    beforeEach(function() {
        mockNotifications = [];
        showNotificationCalls = [];

        // Mock registration
        window.registration = {
            showNotification: function(title, options) {
                options = options || {};
                var notification = {
                    title: title,
                    body: options.body,
                    icon: options.icon,
                    badge: options.badge,
                    tag: options.tag,
                    data: options.data,
                    actions: options.actions,
                    close: function() {
                        var idx = mockNotifications.indexOf(this);
                        if (idx > -1) mockNotifications.splice(idx, 1);
                    }
                };
                mockNotifications.push(notification);
                showNotificationCalls.push({ title: title, options: options });
                return Promise.resolve();
            },
            getNotifications: function(options) {
                if (options && options.tag) {
                    return Promise.resolve(mockNotifications.filter(function(n) {
                        return n.tag === options.tag;
                    }));
                }
                return Promise.resolve(mockNotifications.slice());
            }
        };

        // Mock clients
        window.clients = {
            _windows: [],
            matchAll: function(options) {
                return Promise.resolve(this._windows);
            },
            openWindow: function(url) {
                var win = { url: url, focus: function() { return Promise.resolve(this); } };
                this._windows.push(win);
                return Promise.resolve(win);
            }
        };
    });

    afterEach(function() {
        // Restore originals
        if (originalRegistration !== undefined) {
            window.registration = originalRegistration;
        } else {
            delete window.registration;
        }
        if (originalClients !== undefined) {
            window.clients = originalClients;
        } else {
            delete window.clients;
        }
    });

    // =========================================================================
    // MODULE STRUCTURE
    // =========================================================================

    describe('Module Structure', function() {
        it('has FunkySW namespace', function() {
            expect(self.FunkySW).toBeDefined();
        });

        it('has Notifications object', function() {
            expect(FunkySW.Notifications).toBeDefined();
        });

        it('has show method', function() {
            expect(typeof FunkySW.Notifications.show).toBe('function');
        });

        it('has handlePush method', function() {
            expect(typeof FunkySW.Notifications.handlePush).toBe('function');
        });

        it('has handleClick method', function() {
            expect(typeof FunkySW.Notifications.handleClick).toBe('function');
        });

        it('has handleClose method', function() {
            expect(typeof FunkySW.Notifications.handleClose).toBe('function');
        });

        it('has getAll method', function() {
            expect(typeof FunkySW.Notifications.getAll).toBe('function');
        });

        it('has close method', function() {
            expect(typeof FunkySW.Notifications.close).toBe('function');
        });

        it('has setDefaults method', function() {
            expect(typeof FunkySW.Notifications.setDefaults).toBe('function');
        });

        it('has getDefaults method', function() {
            expect(typeof FunkySW.Notifications.getDefaults).toBe('function');
        });

        it('has version', function() {
            expect(FunkySW.Notifications.version).toBeDefined();
        });
    });

    // =========================================================================
    // SHOW
    // =========================================================================

    describe('show', function() {
        it('shows notification with title', function(done) {
            FunkySW.Notifications.show('Test Title', { body: 'Test body' }).then(function() {
                expect(showNotificationCalls.length).toBe(1);
                expect(showNotificationCalls[0].title).toBe('Test Title');
                done();
            });
        });

        it('merges options with defaults', function(done) {
            FunkySW.Notifications.show('Test', { body: 'Custom body' }).then(function() {
                var options = showNotificationCalls[0].options;
                expect(options.body).toBe('Custom body');
                // Should have default icon
                expect(options.icon).toBeDefined();
                done();
            });
        });

        it('allows overriding defaults', function(done) {
            FunkySW.Notifications.show('Test', {
                icon: '/custom-icon.png',
                badge: '/custom-badge.png'
            }).then(function() {
                var options = showNotificationCalls[0].options;
                expect(options.icon).toBe('/custom-icon.png');
                expect(options.badge).toBe('/custom-badge.png');
                done();
            });
        });

        it('passes through all notification options', function(done) {
            FunkySW.Notifications.show('Test', {
                body: 'Body',
                tag: 'test-tag',
                data: { id: 123 },
                actions: [{ action: 'view', title: 'View' }],
                requireInteraction: true,
                silent: true
            }).then(function() {
                var options = showNotificationCalls[0].options;
                expect(options.body).toBe('Body');
                expect(options.tag).toBe('test-tag');
                expect(options.data.id).toBe(123);
                expect(options.actions.length).toBe(1);
                expect(options.requireInteraction).toBe(true);
                expect(options.silent).toBe(true);
                done();
            });
        });
    });

    // =========================================================================
    // HANDLE PUSH
    // =========================================================================

    describe('handlePush', function() {
        it('parses JSON payload', function(done) {
            var pushEvent = {
                data: {
                    json: function() {
                        return {
                            title: 'Push Title',
                            body: 'Push body',
                            tag: 'push-tag'
                        };
                    },
                    text: function() { return ''; }
                }
            };

            FunkySW.Notifications.handlePush(pushEvent).then(function() {
                expect(showNotificationCalls[0].title).toBe('Push Title');
                expect(showNotificationCalls[0].options.body).toBe('Push body');
                expect(showNotificationCalls[0].options.tag).toBe('push-tag');
                done();
            });
        });

        it('falls back to text payload', function(done) {
            var pushEvent = {
                data: {
                    json: function() { throw new Error('Not JSON'); },
                    text: function() { return 'Plain text message'; }
                }
            };

            FunkySW.Notifications.handlePush(pushEvent, { title: 'Default' }).then(function() {
                expect(showNotificationCalls[0].title).toBe('Default');
                expect(showNotificationCalls[0].options.body).toBe('Plain text message');
                done();
            });
        });

        it('uses default options when payload missing fields', function(done) {
            var pushEvent = {
                data: {
                    json: function() { return { title: 'Only Title' }; },
                    text: function() { return ''; }
                }
            };

            FunkySW.Notifications.handlePush(pushEvent, {
                icon: '/default-icon.png'
            }).then(function() {
                expect(showNotificationCalls[0].options.icon).toBe('/default-icon.png');
                done();
            });
        });

        it('handles empty push data', function(done) {
            var pushEvent = { data: null };

            FunkySW.Notifications.handlePush(pushEvent, { title: 'Fallback' }).then(function() {
                expect(showNotificationCalls[0].title).toBe('Fallback');
                done();
            });
        });

        it('supports message field as body alias', function(done) {
            var pushEvent = {
                data: {
                    json: function() {
                        return { title: 'Alert', message: 'Message content' };
                    }
                }
            };

            FunkySW.Notifications.handlePush(pushEvent).then(function() {
                expect(showNotificationCalls[0].options.body).toBe('Message content');
                done();
            });
        });

        it('stores full payload in data for click handler', function(done) {
            var pushEvent = {
                data: {
                    json: function() {
                        return {
                            title: 'Test',
                            body: 'Body',
                            url: '/target-url',
                            customField: 'value'
                        };
                    }
                }
            };

            FunkySW.Notifications.handlePush(pushEvent).then(function() {
                var data = showNotificationCalls[0].options.data;
                expect(data.url).toBe('/target-url');
                expect(data.customField).toBe('value');
                done();
            });
        });
    });

    // =========================================================================
    // HANDLE CLICK
    // =========================================================================

    describe('handleClick', function() {
        it('routes to action handler', function(done) {
            var handlerCalled = false;
            var event = {
                action: 'view',
                notification: {
                    data: { id: 123 },
                    close: function() {}
                }
            };

            FunkySW.Notifications.handleClick(event, {
                'view': function(data) {
                    handlerCalled = true;
                    expect(data.id).toBe(123);
                    return Promise.resolve();
                }
            }).then(function() {
                expect(handlerCalled).toBe(true);
                done();
            });
        });

        it('routes to default handler when no action', function(done) {
            var defaultCalled = false;
            var event = {
                action: '',
                notification: {
                    data: { url: '/home' },
                    close: function() {}
                }
            };

            FunkySW.Notifications.handleClick(event, {
                'default': function(data) {
                    defaultCalled = true;
                    return Promise.resolve();
                }
            }).then(function() {
                expect(defaultCalled).toBe(true);
                done();
            });
        });

        it('closes notification before handling', function(done) {
            var closed = false;
            var event = {
                action: 'test',
                notification: {
                    data: {},
                    close: function() { closed = true; }
                }
            };

            FunkySW.Notifications.handleClick(event, {
                'test': function() {
                    expect(closed).toBe(true);
                    return Promise.resolve();
                }
            }).then(function() {
                done();
            });
        });

        it('opens URL when no handlers match', function(done) {
            var event = {
                action: '',
                notification: {
                    data: { url: '/target-page' },
                    close: function() {}
                }
            };

            FunkySW.Notifications.handleClick(event, {}).then(function() {
                expect(window.clients._windows.length).toBe(1);
                expect(window.clients._windows[0].url).toBe('/target-page');
                done();
            });
        });

        it('focuses existing window with same URL', function(done) {
            var focused = false;
            // Use location.origin to ensure URL comparison works
            var targetUrl = window.location.origin + '/target';
            window.clients._windows = [{
                url: targetUrl,
                focus: function() {
                    focused = true;
                    return Promise.resolve(this);
                }
            }];

            var event = {
                action: '',
                notification: {
                    data: { url: '/target' },
                    close: function() {}
                }
            };

            FunkySW.Notifications.handleClick(event, {}).then(function() {
                expect(focused).toBe(true);
                done();
            });
        });

        it('uses click_action as fallback URL', function(done) {
            var event = {
                action: '',
                notification: {
                    data: { click_action: '/click-action-url' },
                    close: function() {}
                }
            };

            FunkySW.Notifications.handleClick(event, {}).then(function() {
                expect(window.clients._windows[0].url).toBe('/click-action-url');
                done();
            });
        });
    });

    // =========================================================================
    // HANDLE CLOSE
    // =========================================================================

    describe('handleClose', function() {
        it('calls callback with notification data', function() {
            var callbackData = null;
            var event = {
                notification: {
                    tag: 'test-tag',
                    data: { id: 456 }
                }
            };

            FunkySW.Notifications.handleClose(event, function(data) {
                callbackData = data;
            });

            expect(callbackData).not.toBe(null);
            expect(callbackData.id).toBe(456);
        });

        it('handles missing callback gracefully', function() {
            var event = {
                notification: {
                    tag: 'test',
                    data: {}
                }
            };

            expect(function() {
                FunkySW.Notifications.handleClose(event);
            }).not.toThrow();
        });

        it('returns callback result', function() {
            var event = {
                notification: { data: {} }
            };

            var result = FunkySW.Notifications.handleClose(event, function() {
                return 'callback result';
            });

            expect(result).toBe('callback result');
        });
    });

    // =========================================================================
    // GET ALL
    // =========================================================================

    describe('getAll', function() {
        beforeEach(function(done) {
            Promise.all([
                FunkySW.Notifications.show('Notif 1', { tag: 'tag-a' }),
                FunkySW.Notifications.show('Notif 2', { tag: 'tag-a' }),
                FunkySW.Notifications.show('Notif 3', { tag: 'tag-b' })
            ]).then(function() {
                done();
            });
        });

        it('returns all notifications when no tag', function(done) {
            FunkySW.Notifications.getAll().then(function(notifications) {
                expect(notifications.length).toBe(3);
                done();
            });
        });

        it('filters by tag', function(done) {
            FunkySW.Notifications.getAll('tag-a').then(function(notifications) {
                expect(notifications.length).toBe(2);
                notifications.forEach(function(n) {
                    expect(n.tag).toBe('tag-a');
                });
                done();
            });
        });

        it('returns empty array for non-existent tag', function(done) {
            FunkySW.Notifications.getAll('non-existent').then(function(notifications) {
                expect(notifications.length).toBe(0);
                done();
            });
        });
    });

    // =========================================================================
    // CLOSE
    // =========================================================================

    describe('close', function() {
        beforeEach(function(done) {
            Promise.all([
                FunkySW.Notifications.show('Notif 1', { tag: 'close-tag' }),
                FunkySW.Notifications.show('Notif 2', { tag: 'close-tag' }),
                FunkySW.Notifications.show('Notif 3', { tag: 'keep-tag' })
            ]).then(function() {
                done();
            });
        });

        it('closes notifications by tag', function(done) {
            FunkySW.Notifications.close('close-tag').then(function(count) {
                expect(count).toBe(2);
                return FunkySW.Notifications.getAll();
            }).then(function(remaining) {
                expect(remaining.length).toBe(1);
                expect(remaining[0].tag).toBe('keep-tag');
                done();
            });
        });

        it('returns count of closed notifications', function(done) {
            FunkySW.Notifications.close('close-tag').then(function(count) {
                expect(count).toBe(2);
                done();
            });
        });

        it('returns 0 for non-existent tag', function(done) {
            FunkySW.Notifications.close('non-existent').then(function(count) {
                expect(count).toBe(0);
                done();
            });
        });
    });

    // =========================================================================
    // DEFAULTS
    // =========================================================================

    describe('setDefaults / getDefaults', function() {
        var originalDefaults;

        beforeEach(function() {
            originalDefaults = FunkySW.Notifications.getDefaults();
        });

        afterEach(function() {
            // Restore original defaults
            FunkySW.Notifications.setDefaults(originalDefaults);
        });

        it('updates default values', function() {
            FunkySW.Notifications.setDefaults({
                icon: '/new-icon.png'
            });

            var defaults = FunkySW.Notifications.getDefaults();
            expect(defaults.icon).toBe('/new-icon.png');
        });

        it('merges with existing defaults', function() {
            var originalBadge = originalDefaults.badge;

            FunkySW.Notifications.setDefaults({
                icon: '/updated-icon.png'
            });

            var defaults = FunkySW.Notifications.getDefaults();
            expect(defaults.icon).toBe('/updated-icon.png');
            expect(defaults.badge).toBe(originalBadge);
        });

        it('getDefaults returns a copy', function() {
            var defaults1 = FunkySW.Notifications.getDefaults();
            var defaults2 = FunkySW.Notifications.getDefaults();

            defaults1.icon = '/modified.png';
            expect(defaults2.icon).not.toBe('/modified.png');
        });
    });
});
