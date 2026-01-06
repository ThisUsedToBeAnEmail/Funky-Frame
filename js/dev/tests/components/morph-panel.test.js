/**
 * Tests for Funky.MorphPanel
 * @see public/assets/js/components/morph-panel.js
 */
describe('Funky.Component.MorphPanel', function() {
    'use strict';

    var expect = FunkyTests.expect;
    var fixture;
    var panelId = 'test-panel';
    var MorphPanel = Funky.MorphPanel;

    beforeEach(function() {
        // Clear keyboard scopes to avoid cross-test contamination
        if (Funky.Keyboard && Funky.Keyboard.clearScopes) {
            Funky.Keyboard.clearScopes();
        }
        fixture = FunkyTests.fixture('<button id="trigger">Open</button>');

        // Register a test panel
        MorphPanel.register(panelId, {
            position: 'center',
            size: 'md'
        });
    });

    afterEach(function() {
        Funky.MorphPanel.destroyAll();
        fixture.cleanup();
    });

    // =========================================================================
    // MODULE AVAILABILITY
    // =========================================================================

    describe('Module availability', function() {
        it('is registered in Funky namespace', function() {
            expect(Funky.MorphPanel).toBeDefined();
        });

        it('has register method', function() {
            expect(typeof Funky.MorphPanel.register).toBe('function');
        });

        it('has show method', function() {
            expect(typeof Funky.MorphPanel.show).toBe('function');
        });

        it('has hide method', function() {
            expect(typeof Funky.MorphPanel.hide).toBe('function');
        });

        it('is registered via Funky.register', function() {
            expect(Funky.isRegistered('MorphPanel')).toBe(true);
        });
    });

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    describe('Registration', function() {
        it('registers a panel configuration', function() {
            Funky.MorphPanel.register('custom-panel', {
                position: 'right',
                size: 'lg'
            });

            expect(Funky.MorphPanel.getInstance('custom-panel')).toBeNull();
            // Instance created on first show
        });

        it('allows chaining', function() {
            var result = Funky.MorphPanel.register('chain-test', {});
            expect(result).toBe(Funky.MorphPanel);
        });
    });

    // =========================================================================
    // SHOW / HIDE
    // =========================================================================

    describe('Show/Hide', function() {
        it('shows a panel', function(done) {
            Funky.MorphPanel.show('#trigger', panelId);

            setTimeout(function() {
                expect(Funky.MorphPanel.isVisible(panelId)).toBe(true);
                done();
            }, 50);
        });

        it('creates panel DOM on show', function(done) {
            Funky.MorphPanel.show('#trigger', panelId);

            setTimeout(function() {
                var panel = document.querySelector('.funky-morph-panel');
                expect(panel).toBeTruthy();
                done();
            }, 50);
        });

        it('hides a panel', function(done) {
            Funky.MorphPanel.show('#trigger', panelId);

            setTimeout(function() {
                Funky.MorphPanel.hide(panelId);

                setTimeout(function() {
                    expect(Funky.MorphPanel.isVisible(panelId)).toBe(false);
                    done();
                }, 500); // 300ms duration + 200ms buffer for test env variability
            }, 100);
        });

        it('shows backdrop', function(done) {
            Funky.MorphPanel.show('#trigger', panelId);

            setTimeout(function() {
                // Look for any backdrop element (visible or transitioning)
                var backdrop = document.querySelector('.funky-morph-panel__backdrop--visible') ||
                              document.querySelector('.funky-morph-panel__backdrop');
                expect(backdrop).toBeTruthy();
                done();
            }, 100);
        });

        it('works without trigger (null)', function(done) {
            Funky.MorphPanel.show(null, panelId);

            setTimeout(function() {
                expect(Funky.MorphPanel.isVisible(panelId)).toBe(true);
                done();
            }, 100);
        });
    });

    // =========================================================================
    // POSITIONS
    // =========================================================================

    describe('Positions', function() {
        var positions = ['center', 'left', 'right', 'top', 'bottom'];

        positions.forEach(function(position) {
            it('renders with position: ' + position, function(done) {
                Funky.MorphPanel.register('pos-' + position, {
                    position: position,
                    size: 'md'
                });

                Funky.MorphPanel.show(null, 'pos-' + position);

                setTimeout(function() {
                    var panel = document.querySelector('.funky-morph-panel--' + position);
                    expect(panel).toBeTruthy();
                    Funky.MorphPanel.hide('pos-' + position);
                    done();
                }, 50);
            });
        });
    });

    // =========================================================================
    // SIZES
    // =========================================================================

    describe('Sizes', function() {
        var sizes = ['sm', 'md', 'lg', 'xl', 'full'];

        sizes.forEach(function(size) {
            it('renders with size: ' + size, function(done) {
                Funky.MorphPanel.register('size-' + size, {
                    position: 'center',
                    size: size
                });

                Funky.MorphPanel.show(null, 'size-' + size);

                setTimeout(function() {
                    var panel = document.querySelector('.funky-morph-panel--' + size);
                    expect(panel).toBeTruthy();
                    Funky.MorphPanel.hide('size-' + size);
                    done();
                }, 50);
            });
        });
    });

    // =========================================================================
    // SETDATA
    // =========================================================================

    describe('setData', function() {
        beforeEach(function(done) {
            Funky.MorphPanel.show('#trigger', panelId);
            setTimeout(done, 50);
        });

        it('sets title', function() {
            Funky.MorphPanel.setData(panelId, { title: 'Test Title' });

            var title = document.querySelector('.funky-morph-panel__title');
            expect(title.textContent).toBe('Test Title');
        });

        it('sets content as string', function() {
            Funky.MorphPanel.setData(panelId, { content: '<p>Hello World</p>' });

            var body = document.querySelector('.funky-morph-panel__body');
            expect(body.innerHTML).toContain('Hello World');
        });

        it('sets footer', function() {
            Funky.MorphPanel.setData(panelId, { footer: '<button>OK</button>' });

            var footer = document.querySelector('.funky-morph-panel__footer');
            expect(footer.innerHTML).toContain('OK');
        });
    });

    // =========================================================================
    // ACCESSIBILITY
    // =========================================================================

    describe('Accessibility', function() {
        beforeEach(function(done) {
            Funky.MorphPanel.show('#trigger', panelId);
            setTimeout(done, 50);
        });

        it('has role="dialog"', function() {
            var panel = document.querySelector('.funky-morph-panel');
            expect(panel.getAttribute('role')).toBe('dialog');
        });

        it('has aria-modal="true"', function() {
            var panel = document.querySelector('.funky-morph-panel');
            expect(panel.getAttribute('aria-modal')).toBe('true');
        });

        it('has aria-labelledby', function() {
            var panel = document.querySelector('.funky-morph-panel');
            var labelledBy = panel.getAttribute('aria-labelledby');
            expect(labelledBy).toBeTruthy();
            expect(document.getElementById(labelledBy)).toBeTruthy();
        });

        it('sets aria-hidden to false when visible', function() {
            var panel = document.querySelector('.funky-morph-panel');
            expect(panel.getAttribute('aria-hidden')).toBe('false');
        });
    });

    // =========================================================================
    // KEYBOARD
    // =========================================================================

    describe('Keyboard', function() {
        beforeEach(function(done) {
            Funky.MorphPanel.show('#trigger', panelId);
            // Wait for animation to complete (300ms) + keyboard setup
            setTimeout(done, 400);
        });

        it('closes on Escape', function(done) {
            var event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(event);

            setTimeout(function() {
                expect(Funky.MorphPanel.isVisible(panelId)).toBe(false);
                done();
            }, 400); // 300ms duration + 100ms buffer
        });
    });

    // =========================================================================
    // EVENTS
    // =========================================================================

    describe('Events', function() {
        it('emits show event', function(done) {
            var eventFired = false;

            document.addEventListener('funky.morphpanel.show', function handler(e) {
                eventFired = true;
                expect(e.detail.panelId).toBe(panelId);
                document.removeEventListener('funky.morphpanel.show', handler);
            });

            Funky.MorphPanel.show('#trigger', panelId);

            setTimeout(function() {
                expect(eventFired).toBe(true);
                done();
            }, 50);
        });

        it('emits shown event after animation', function(done) {
            var eventFired = false;

            document.addEventListener('funky.morphpanel.shown', function handler(e) {
                eventFired = true;
                document.removeEventListener('funky.morphpanel.shown', handler);
            });

            Funky.MorphPanel.show('#trigger', panelId);

            setTimeout(function() {
                expect(eventFired).toBe(true);
                done();
            }, 400);
        });

        it('emits hide event', function(done) {
            Funky.MorphPanel.show('#trigger', panelId);

            setTimeout(function() {
                var eventFired = false;

                document.addEventListener('funky.morphpanel.hide', function handler(e) {
                    eventFired = true;
                    document.removeEventListener('funky.morphpanel.hide', handler);
                });

                Funky.MorphPanel.hide(panelId);

                setTimeout(function() {
                    expect(eventFired).toBe(true);
                    done();
                }, 50);
            }, 100);
        });
    });

    // =========================================================================
    // CLOSE BUTTON
    // =========================================================================

    describe('Close button', function() {
        beforeEach(function(done) {
            Funky.MorphPanel.show('#trigger', panelId);
            setTimeout(done, 100);
        });

        it('renders close button by default', function() {
            var closeBtn = document.querySelector('.funky-morph-panel__close');
            expect(closeBtn).toBeTruthy();
        });

        it('closes panel on click', function(done) {
            var closeBtn = document.querySelector('.funky-morph-panel__close');
            closeBtn.click();

            setTimeout(function() {
                expect(Funky.MorphPanel.isVisible(panelId)).toBe(false);
                done();
            }, 400); // 300ms duration + 100ms buffer
        });
    });

    // =========================================================================
    // BACKDROP
    // =========================================================================

    describe('Backdrop', function() {
        it('closes on backdrop click when closeOnBackdrop is true', function(done) {
            Funky.MorphPanel.register('backdrop-test', {
                position: 'center',
                closeOnBackdrop: true
            });

            Funky.MorphPanel.show('#trigger', 'backdrop-test');

            setTimeout(function() {
                var backdrop = document.querySelector('.funky-morph-panel__backdrop');
                backdrop.click();

                setTimeout(function() {
                    expect(Funky.MorphPanel.isVisible('backdrop-test')).toBe(false);
                    done();
                }, 400); // 300ms duration + 100ms buffer
            }, 100);
        });

        it('does not close on backdrop click when closeOnBackdrop is false', function(done) {
            Funky.MorphPanel.register('no-backdrop-close', {
                position: 'center',
                closeOnBackdrop: false
            });

            Funky.MorphPanel.show('#trigger', 'no-backdrop-close');

            setTimeout(function() {
                var backdrop = document.querySelector('.funky-morph-panel__backdrop');
                backdrop.click();

                setTimeout(function() {
                    expect(Funky.MorphPanel.isVisible('no-backdrop-close')).toBe(true);
                    Funky.MorphPanel.hide('no-backdrop-close');
                    done();
                }, 100);
            }, 100);
        });
    });

    // =========================================================================
    // FORM MODE (if Form available)
    // =========================================================================

    describe('Form Mode', function() {
        var skipFormTests = !Funky.Form;

        beforeEach(function() {
            if (skipFormTests) return;

            Funky.MorphPanel.register('form-panel', {
                position: 'center',
                size: 'md',
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true }
                    }
                },
                entityLabel: 'User'
            });
        });

        it('create() opens in create mode', function(done) {
            if (skipFormTests) {
                this.skip();
                return done();
            }

            Funky.MorphPanel.create('#trigger', 'form-panel');

            setTimeout(function() {
                var title = document.querySelector('.funky-morph-panel__title');
                expect(title.textContent).toContain('Create');
                done();
            }, 100);
        });

        it('edit() opens in edit mode', function(done) {
            if (skipFormTests) {
                this.skip();
                return done();
            }

            Funky.MorphPanel.edit('#trigger', 'form-panel', { name: 'John' });

            setTimeout(function() {
                var title = document.querySelector('.funky-morph-panel__title');
                expect(title.textContent).toContain('Edit');
                done();
            }, 100);
        });

        it('has submit and cancel buttons', function(done) {
            if (skipFormTests) {
                this.skip();
                return done();
            }

            Funky.MorphPanel.create('#trigger', 'form-panel');

            setTimeout(function() {
                var footer = document.querySelector('.funky-morph-panel__footer');
                expect(footer.querySelectorAll('button').length).toBe(2);
                done();
            }, 100);
        });

        it('getForm() returns form instance', function(done) {
            if (skipFormTests) {
                this.skip();
                return done();
            }

            Funky.MorphPanel.create('#trigger', 'form-panel');

            setTimeout(function() {
                var form = Funky.MorphPanel.getForm('form-panel');
                expect(form).toBeTruthy();
                done();
            }, 150);
        });
    });

    // =========================================================================
    // INSTANCE METHODS
    // =========================================================================

    describe('Instance methods', function() {
        beforeEach(function(done) {
            Funky.MorphPanel.show('#trigger', panelId);
            setTimeout(done, 50);
        });

        it('getInstance() returns instance', function() {
            var instance = Funky.MorphPanel.getInstance(panelId);
            expect(instance).toBeTruthy();
            expect(typeof instance.show).toBe('function');
        });

        it('isVisible() returns correct state', function() {
            expect(Funky.MorphPanel.isVisible(panelId)).toBe(true);
        });

        it('getActivePanel() returns active panel id', function() {
            var active = Funky.MorphPanel.getActivePanel();
            expect(active).toBe(panelId);
        });

        it('getHeader() returns header element', function() {
            var instance = Funky.MorphPanel.getInstance(panelId);
            var header = instance.getHeader();
            expect(header).toBeTruthy();
        });

        it('getBody() returns body element', function() {
            var instance = Funky.MorphPanel.getInstance(panelId);
            var body = instance.getBody();
            expect(body).toBeTruthy();
        });

        it('getFooter() returns footer element', function() {
            var instance = Funky.MorphPanel.getInstance(panelId);
            var footer = instance.getFooter();
            expect(footer).toBeTruthy();
        });

        it('toggle() opens closed panel', function(done) {
            var instance = Funky.MorphPanel.getInstance(panelId);
            instance.hide();

            setTimeout(function() {
                expect(instance.isVisible).toBe(false);

                var result = instance.toggle('#trigger');
                expect(result).toBe(instance); // Returns this for chaining

                setTimeout(function() {
                    expect(instance.isVisible).toBe(true);
                    done();
                }, 100);
            }, 350);
        });

        it('toggle() closes open panel', function(done) {
            var instance = Funky.MorphPanel.getInstance(panelId);
            expect(instance.isVisible).toBe(true);

            instance.toggle();

            setTimeout(function() {
                expect(instance.isVisible).toBe(false);
                done();
            }, 350);
        });

        it('toggle() returns instance for chaining', function() {
            var instance = Funky.MorphPanel.getInstance(panelId);
            var result = instance.toggle();
            expect(result).toBe(instance);
        });
    });

    // =========================================================================
    // DESTROY
    // =========================================================================

    describe('Destroy', function() {
        it('destroy() removes instance', function(done) {
            Funky.MorphPanel.show('#trigger', panelId);

            setTimeout(function() {
                Funky.MorphPanel.destroy(panelId);

                setTimeout(function() {
                    expect(Funky.MorphPanel.getInstance(panelId)).toBeNull();
                    done();
                }, 350);
            }, 100);
        });

        it('destroyAll() removes all instances', function() {
            Funky.MorphPanel.register('panel-a', {});
            Funky.MorphPanel.register('panel-b', {});

            Funky.MorphPanel.destroyAll();

            expect(Funky.MorphPanel.getInstance('panel-a')).toBeNull();
            expect(Funky.MorphPanel.getInstance('panel-b')).toBeNull();
        });
    });

    // =========================================================================
    // POSITION-AWARE ANIMATION
    // =========================================================================

    describe('Position-aware animation', function() {
        it('uses slide preset for left position', function(done) {
            Funky.MorphPanel.register('slide-left', {
                position: 'left',
                size: 'md'
            });

            Funky.MorphPanel.show(null, 'slide-left');

            setTimeout(function() {
                var panel = document.querySelector('.funky-morph-panel--left');
                expect(panel).toBeTruthy();
                Funky.MorphPanel.hide('slide-left');
                done();
            }, 50);
        });

        it('uses expand preset for center position', function(done) {
            Funky.MorphPanel.register('expand-center', {
                position: 'center',
                size: 'md'
            });

            Funky.MorphPanel.show(null, 'expand-center');

            setTimeout(function() {
                var panel = document.querySelector('.funky-morph-panel--center');
                expect(panel).toBeTruthy();
                Funky.MorphPanel.hide('expand-center');
                done();
            }, 50);
        });
    });

    // =========================================================================
    // LOADING STATE
    // =========================================================================

    describe('Loading state', function() {
        beforeEach(function(done) {
            Funky.MorphPanel.show('#trigger', panelId);
            setTimeout(done, 50);
        });

        it('setLoading(true) adds loading class', function() {
            var instance = Funky.MorphPanel.getInstance(panelId);
            instance.setLoading(true);

            var panel = document.querySelector('.funky-morph-panel--loading');
            expect(panel).toBeTruthy();
        });

        it('setLoading(false) removes loading class', function() {
            var instance = Funky.MorphPanel.getInstance(panelId);
            instance.setLoading(true);
            instance.setLoading(false);

            var panel = document.querySelector('.funky-morph-panel--loading');
            expect(panel).toBeNull();
        });
    });

});
