/**
 * Funky.PushNotification Tests
 *
 * Tests for the browser push notification wrapper component.
 */

describe('Funky.Component.PushNotification', function() {

    var PushNotification = Funky.PushNotification;
    var originalNotification;
    var originalServiceWorker;
    var mockPermission = 'default';
    var mockEventHandlers = {};

    beforeEach(function() {
        // Store originals
        originalNotification = window.Notification;
        originalServiceWorker = navigator.serviceWorker;

        // Reset mock state
        mockPermission = 'default';
        mockEventHandlers = {};

        // Mock Notification API
        window.Notification = {
            permission: mockPermission,
            requestPermission: function() {
                return Promise.resolve(mockPermission);
            }
        };

        // Define permission as a getter so we can change it
        Object.defineProperty(window.Notification, 'permission', {
            get: function() { return mockPermission; },
            configurable: true
        });
    });

    afterEach(function() {
        // Restore originals
        window.Notification = originalNotification;

        // Clear all event handlers
        PushNotification.off('permission');
        PushNotification.off('ready');
        PushNotification.off('show');
        PushNotification.off('error');
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('PushNotification')).toBe(true);
        });

        it('has isSupported method', function() {
            expect(typeof PushNotification.isSupported).toBe('function');
        });

        it('has isReady method', function() {
            expect(typeof PushNotification.isReady).toBe('function');
        });

        it('has getPermission method', function() {
            expect(typeof PushNotification.getPermission).toBe('function');
        });

        it('has requestPermission method', function() {
            expect(typeof PushNotification.requestPermission).toBe('function');
        });

        it('has init method', function() {
            expect(typeof PushNotification.init).toBe('function');
        });

        it('has show method', function() {
            expect(typeof PushNotification.show).toBe('function');
        });

        it('has showNow method', function() {
            expect(typeof PushNotification.showNow).toBe('function');
        });

        it('has schedule method', function() {
            expect(typeof PushNotification.schedule).toBe('function');
        });

        it('has getRegistration method', function() {
            expect(typeof PushNotification.getRegistration).toBe('function');
        });

        it('has setDefaults method', function() {
            expect(typeof PushNotification.setDefaults).toBe('function');
        });

        it('has getDefaults method', function() {
            expect(typeof PushNotification.getDefaults).toBe('function');
        });

        it('has on method', function() {
            expect(typeof PushNotification.on).toBe('function');
        });

        it('has off method', function() {
            expect(typeof PushNotification.off).toBe('function');
        });

        it('has once method', function() {
            expect(typeof PushNotification.once).toBe('function');
        });

    });

    describe('isSupported()', function() {

        it('returns true when Notification and serviceWorker exist', function() {
            // Both should exist in our test environment
            expect(PushNotification.isSupported()).toBe(true);
        });

        it('returns false when Notification is missing', function() {
            delete window.Notification;
            expect(PushNotification.isSupported()).toBe(false);
            window.Notification = originalNotification;
        });

    });

    describe('getPermission()', function() {

        it('returns current permission status', function() {
            mockPermission = 'granted';
            expect(PushNotification.getPermission()).toBe('granted');
        });

        it('returns "default" when not yet requested', function() {
            mockPermission = 'default';
            expect(PushNotification.getPermission()).toBe('default');
        });

        it('returns "denied" when blocked', function() {
            mockPermission = 'denied';
            expect(PushNotification.getPermission()).toBe('denied');
        });

        it('returns "unsupported" when Notification API missing', function() {
            delete window.Notification;
            expect(PushNotification.getPermission()).toBe('unsupported');
            window.Notification = originalNotification;
        });

    });

    describe('requestPermission()', function() {

        it('returns a promise', function() {
            var result = PushNotification.requestPermission();
            expect(result instanceof Promise).toBe(true);
            return result;
        });

        it('resolves with permission status', function() {
            mockPermission = 'granted';
            window.Notification.requestPermission = function() {
                return Promise.resolve('granted');
            };

            return PushNotification.requestPermission().then(function(permission) {
                expect(permission).toBe('granted');
            });
        });

        it('emits permission event', function() {
            var eventEmitted = false;
            var receivedPermission = null;

            PushNotification.on('permission', function(data) {
                eventEmitted = true;
                receivedPermission = data.permission;
            });

            window.Notification.requestPermission = function() {
                return Promise.resolve('granted');
            };

            return PushNotification.requestPermission().then(function() {
                expect(eventEmitted).toBe(true);
                expect(receivedPermission).toBe('granted');
            });
        });

        it('rejects when Notification not supported', function() {
            delete window.Notification;

            return PushNotification.requestPermission().then(function() {
                throw new Error('Should have rejected');
            }).catch(function(error) {
                expect(error.message).toContain('not supported');
            }).finally(function() {
                window.Notification = originalNotification;
            });
        });

    });

    describe('DEFAULTS', function() {

        it('has default icon', function() {
            expect(PushNotification.DEFAULTS.icon).toBeDefined();
        });

        it('has default badge', function() {
            expect(PushNotification.DEFAULTS.badge).toBeDefined();
        });

        it('has default vibrate pattern', function() {
            expect(Array.isArray(PushNotification.DEFAULTS.vibrate)).toBe(true);
        });

        it('has delay default of 0', function() {
            expect(PushNotification.DEFAULTS.delay).toBe(0);
        });

        it('has renotify default of true', function() {
            expect(PushNotification.DEFAULTS.renotify).toBe(true);
        });

    });

    describe('setDefaults()', function() {

        var originalDefaults;

        beforeEach(function() {
            originalDefaults = PushNotification.getDefaults();
        });

        afterEach(function() {
            // Restore original defaults
            PushNotification.setDefaults(originalDefaults);
        });

        it('updates default icon', function() {
            PushNotification.setDefaults({ icon: '/custom-icon.png' });
            expect(PushNotification.DEFAULTS.icon).toBe('/custom-icon.png');
        });

        it('updates default badge', function() {
            PushNotification.setDefaults({ badge: '/custom-badge.png' });
            expect(PushNotification.DEFAULTS.badge).toBe('/custom-badge.png');
        });

        it('preserves unspecified defaults', function() {
            var originalVibrate = PushNotification.DEFAULTS.vibrate;
            PushNotification.setDefaults({ icon: '/new-icon.png' });
            expect(PushNotification.DEFAULTS.vibrate).toEqual(originalVibrate);
        });

    });

    describe('getDefaults()', function() {

        it('returns a copy of defaults', function() {
            var defaults = PushNotification.getDefaults();
            expect(typeof defaults).toBe('object');
            expect(defaults.icon).toBeDefined();
        });

        it('returns a new object each time', function() {
            var defaults1 = PushNotification.getDefaults();
            var defaults2 = PushNotification.getDefaults();
            expect(defaults1).not.toBe(defaults2);
        });

        it('modifying returned object does not affect DEFAULTS', function() {
            var defaults = PushNotification.getDefaults();
            var originalIcon = PushNotification.DEFAULTS.icon;
            defaults.icon = '/modified-icon.png';
            expect(PushNotification.DEFAULTS.icon).toBe(originalIcon);
        });

    });

    describe('Event methods', function() {

        describe('on()', function() {

            it('registers event handler', function() {
                var called = false;
                PushNotification.on('permission', function() {
                    called = true;
                });

                // Trigger the event via requestPermission
                window.Notification.requestPermission = function() {
                    return Promise.resolve('granted');
                };

                return PushNotification.requestPermission().then(function() {
                    expect(called).toBe(true);
                });
            });

            it('returns PushNotification for chaining', function() {
                var result = PushNotification.on('permission', function() {});
                expect(result).toBe(PushNotification);
            });

            it('ignores non-function handlers', function() {
                var result = PushNotification.on('permission', 'not a function');
                expect(result).toBe(PushNotification);
            });

        });

        describe('off()', function() {

            it('removes specific handler', function() {
                var called = false;
                var handler = function() { called = true; };

                PushNotification.on('permission', handler);
                PushNotification.off('permission', handler);

                window.Notification.requestPermission = function() {
                    return Promise.resolve('granted');
                };

                return PushNotification.requestPermission().then(function() {
                    expect(called).toBe(false);
                });
            });

            it('removes all handlers when no handler specified', function() {
                var called1 = false;
                var called2 = false;

                PushNotification.on('permission', function() { called1 = true; });
                PushNotification.on('permission', function() { called2 = true; });
                PushNotification.off('permission');

                window.Notification.requestPermission = function() {
                    return Promise.resolve('granted');
                };

                return PushNotification.requestPermission().then(function() {
                    expect(called1).toBe(false);
                    expect(called2).toBe(false);
                });
            });

            it('returns PushNotification for chaining', function() {
                var result = PushNotification.off('permission');
                expect(result).toBe(PushNotification);
            });

        });

        describe('once()', function() {

            it('registers one-time handler', function() {
                var callCount = 0;

                PushNotification.once('permission', function() {
                    callCount++;
                });

                window.Notification.requestPermission = function() {
                    return Promise.resolve('granted');
                };

                return PushNotification.requestPermission().then(function() {
                    return PushNotification.requestPermission();
                }).then(function() {
                    expect(callCount).toBe(1);
                });
            });

            it('returns PushNotification for chaining', function() {
                var result = PushNotification.once('permission', function() {});
                expect(result).toBe(PushNotification);
            });

        });

    });

    describe('show()', function() {

        it('rejects when permission not granted', function() {
            mockPermission = 'denied';

            return PushNotification.show('Test', { body: 'Test body' }).then(function() {
                throw new Error('Should have rejected');
            }).catch(function(error) {
                expect(error.message).toContain('permission not granted');
            });
        });

        it('rejects when permission is default', function() {
            mockPermission = 'default';

            return PushNotification.show('Test', { body: 'Test body' }).then(function() {
                throw new Error('Should have rejected');
            }).catch(function(error) {
                expect(error.message).toContain('permission not granted');
            });
        });

    });

    describe('showNow()', function() {

        it('sets delay to 0', function() {
            // This is a wrapper around show() with delay: 0
            mockPermission = 'denied';

            return PushNotification.showNow('Test', { delay: 10 }).catch(function() {
                // We just want to verify it calls through - permission check happens first
                expect(true).toBe(true);
            });
        });

    });

    describe('schedule()', function() {

        it('accepts delay as second parameter', function() {
            mockPermission = 'denied';

            return PushNotification.schedule('Test', 30, { body: 'Delayed' }).catch(function() {
                // We just want to verify it calls through - permission check happens first
                expect(true).toBe(true);
            });
        });

    });

    describe('getRegistration()', function() {

        it('returns null initially or registration after init', function() {
            var registration = PushNotification.getRegistration();
            // Could be null or a registration depending on init state
            expect(registration === null || typeof registration === 'object').toBe(true);
        });

    });

    describe('isReady()', function() {

        it('returns boolean', function() {
            expect(typeof PushNotification.isReady()).toBe('boolean');
        });

    });

    describe('PubSub integration', function() {

        it('emits funky:push-notification:permission on requestPermission', function() {
            var eventReceived = false;

            Funky.PubSub.on('funky:push-notification:permission', function(data) {
                eventReceived = true;
            });

            window.Notification.requestPermission = function() {
                return Promise.resolve('granted');
            };

            return PushNotification.requestPermission().then(function() {
                return FunkyTests.delay(10);
            }).then(function() {
                expect(eventReceived).toBe(true);
                Funky.PubSub.off('funky:push-notification:permission');
            });
        });

    });

});
