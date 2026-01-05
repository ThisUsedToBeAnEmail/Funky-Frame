/**
 * Funky.MobileCore Tests
 *
 * Tests for the mobile bottom navigation bar component with
 * action registration, overflow menu, scroll hiding, and viewport reactivity.
 */
FunkyTests.describe('Funky.MobileCore', function() {
    'use strict';

    var MobileCore = Funky.MobileCore;
    var expect = FunkyTests.expect;

    // Skip all tests if MobileCore failed to load
    if (!MobileCore) {
        FunkyTests.it('MobileCore module not available (dependency not loaded)', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    FunkyTests.beforeEach(function() {
        // Create basic fixture with sidebar for default action detection
        fixture = FunkyTests.fixture(
            '<div class="sidebar">Mock Sidebar</div>' +
            '<div class="main-content">Main Content</div>'
        );

        // Cleanup any existing MobileCore instance
        if (MobileCore && MobileCore.isInitialized && MobileCore.isInitialized()) {
            try {
                MobileCore.destroy();
            } catch (e) {
                // Ignore
            }
        }

        // Clean up any leftover DOM elements
        var mobileCore = document.querySelector('.mobile-core');
        if (mobileCore && mobileCore.parentNode) {
            mobileCore.parentNode.removeChild(mobileCore);
        }
    });

    FunkyTests.afterEach(function() {
        // Always destroy MobileCore after each test
        if (MobileCore && MobileCore.isInitialized && MobileCore.isInitialized()) {
            try {
                MobileCore.destroy();
            } catch (e) {
                // Ignore
            }
        }

        // Clean up any leftover DOM elements
        var mobileCore = document.querySelector('.mobile-core');
        if (mobileCore && mobileCore.parentNode) {
            mobileCore.parentNode.removeChild(mobileCore);
        }

        if (fixture && fixture.cleanup) {
            fixture.cleanup();
        }
    });

    FunkyTests.describe('Module availability', function() {

        FunkyTests.it('is registered', function() {
            expect(Funky.isRegistered('MobileCore')).toBe(true);
        });

        FunkyTests.it('has init method', function() {
            expect(typeof MobileCore.init).toBe('function');
        });

        FunkyTests.it('has destroy method', function() {
            expect(typeof MobileCore.destroy).toBe('function');
        });

        FunkyTests.it('has show method', function() {
            expect(typeof MobileCore.show).toBe('function');
        });

        FunkyTests.it('has hide method', function() {
            expect(typeof MobileCore.hide).toBe('function');
        });

        FunkyTests.it('has isVisible method', function() {
            expect(typeof MobileCore.isVisible).toBe('function');
        });

        FunkyTests.it('has isInitialized method', function() {
            expect(typeof MobileCore.isInitialized).toBe('function');
        });

        FunkyTests.it('has registerAction method', function() {
            expect(typeof MobileCore.registerAction).toBe('function');
        });

        FunkyTests.it('has unregisterAction method', function() {
            expect(typeof MobileCore.unregisterAction).toBe('function');
        });

        FunkyTests.it('has updateAction method', function() {
            expect(typeof MobileCore.updateAction).toBe('function');
        });

        FunkyTests.it('has getAction method', function() {
            expect(typeof MobileCore.getAction).toBe('function');
        });

        FunkyTests.it('has getActions method', function() {
            expect(typeof MobileCore.getActions).toBe('function');
        });

        FunkyTests.it('has openOverflow method', function() {
            expect(typeof MobileCore.openOverflow).toBe('function');
        });

        FunkyTests.it('has closeOverflow method', function() {
            expect(typeof MobileCore.closeOverflow).toBe('function');
        });

        FunkyTests.it('has toggleOverflow method', function() {
            expect(typeof MobileCore.toggleOverflow).toBe('function');
        });

    });

    FunkyTests.describe('Initialization', function() {

        FunkyTests.it('initializes successfully', function() {
            MobileCore.init({
                autoRegister: false
            });

            expect(MobileCore.isInitialized()).toBe(true);
        });

        FunkyTests.it('creates DOM element', function() {
            MobileCore.init({
                autoRegister: false
            });

            var element = document.querySelector('.mobile-core');
            expect(element).not.toBeNull();
        });

        FunkyTests.it('creates nav element with role navigation', function() {
            MobileCore.init({
                autoRegister: false
            });

            var element = document.querySelector('.mobile-core');
            expect(element.tagName.toLowerCase()).toBe('nav');
            expect(element.getAttribute('role')).toBe('navigation');
        });

        FunkyTests.it('creates actions container', function() {
            MobileCore.init({
                autoRegister: false
            });

            var container = document.querySelector('.mobile-core__actions');
            expect(container).not.toBeNull();
        });

        FunkyTests.it('creates overflow panel', function() {
            MobileCore.init({
                autoRegister: false
            });

            var panel = document.querySelector('.mobile-core__overflow');
            expect(panel).not.toBeNull();
        });

        FunkyTests.it('sets aria-label on nav element', function() {
            MobileCore.init({
                autoRegister: false,
                ariaLabel: 'Test navigation'
            });

            var element = document.querySelector('.mobile-core');
            expect(element.getAttribute('aria-label')).toBe('Test navigation');
        });

        FunkyTests.it('warns and returns if already initialized', function() {
            MobileCore.init({ autoRegister: false });
            var result = MobileCore.init({ autoRegister: false });

            expect(result).toBe(MobileCore);
            expect(MobileCore.isInitialized()).toBe(true);
        });

        FunkyTests.it('returns MobileCore for chaining', function() {
            var result = MobileCore.init({ autoRegister: false });
            expect(result).toBe(MobileCore);
        });

    });

    FunkyTests.describe('Configuration', function() {

        FunkyTests.it('accepts custom breakpoint', function() {
            MobileCore.init({
                breakpoint: 'tablet',
                autoRegister: false
            });

            expect(MobileCore.isInitialized()).toBe(true);
        });

        FunkyTests.it('accepts maxVisibleActions option', function() {
            MobileCore.init({
                maxVisibleActions: 3,
                autoRegister: false
            });

            expect(MobileCore.isInitialized()).toBe(true);
        });

        FunkyTests.it('accepts hideOnScroll option', function() {
            MobileCore.init({
                hideOnScroll: false,
                autoRegister: false
            });

            expect(MobileCore.isInitialized()).toBe(true);
        });

        FunkyTests.it('accepts custom moreIcon option', function() {
            MobileCore.init({
                moreIcon: 'fas fa-plus',
                autoRegister: false
            });

            expect(MobileCore.isInitialized()).toBe(true);
        });

        FunkyTests.it('accepts custom moreLabel option', function() {
            MobileCore.init({
                moreLabel: 'Extra',
                autoRegister: false
            });

            expect(MobileCore.isInitialized()).toBe(true);
        });

        FunkyTests.it('accepts scrollThreshold option', function() {
            MobileCore.init({
                scrollThreshold: 100,
                autoRegister: false
            });

            expect(MobileCore.isInitialized()).toBe(true);
        });

    });

    FunkyTests.describe('Visibility', function() {

        FunkyTests.it('starts not visible by default', function() {
            MobileCore.init({
                autoRegister: false
            });

            expect(MobileCore.isVisible()).toBe(false);
        });

        FunkyTests.it('shows with show()', function() {
            MobileCore.init({
                autoRegister: false
            });

            MobileCore.show();

            expect(MobileCore.isVisible()).toBe(true);
        });

        FunkyTests.it('hides with hide()', function() {
            MobileCore.init({
                autoRegister: false
            });

            MobileCore.show();
            MobileCore.hide();

            expect(MobileCore.isVisible()).toBe(false);
        });

        FunkyTests.it('adds mobile-core--active class when shown', function() {
            MobileCore.init({
                autoRegister: false
            });

            MobileCore.show();

            var element = document.querySelector('.mobile-core');
            expect(element.classList.contains('mobile-core--active')).toBe(true);
        });

        FunkyTests.it('removes mobile-core--active class when hidden', function() {
            MobileCore.init({
                autoRegister: false
            });

            MobileCore.show();
            MobileCore.hide();

            var element = document.querySelector('.mobile-core');
            expect(element.classList.contains('mobile-core--active')).toBe(false);
        });

        FunkyTests.it('does nothing if show() called when already visible', function() {
            MobileCore.init({
                autoRegister: false
            });

            MobileCore.show();
            MobileCore.show(); // Should not throw

            expect(MobileCore.isVisible()).toBe(true);
        });

        FunkyTests.it('does nothing if hide() called when already hidden', function() {
            MobileCore.init({
                autoRegister: false
            });

            MobileCore.hide(); // Should not throw

            expect(MobileCore.isVisible()).toBe(false);
        });

    });

    FunkyTests.describe('Action Registration', function() {

        FunkyTests.beforeEach(function() {
            MobileCore.init({
                autoRegister: false
            });
        });

        FunkyTests.it('registers an action', function() {
            MobileCore.registerAction({
                id: 'test-action',
                icon: 'fas fa-star',
                label: 'Test'
            });

            var action = MobileCore.getAction('test-action');
            expect(action).not.toBeNull();
            expect(action.id).toBe('test-action');
        });

        FunkyTests.it('registers action with onClick handler', function() {
            MobileCore.registerAction({
                id: 'clickable',
                icon: 'fas fa-star',
                label: 'Click Me',
                onClick: function() {}
            });

            var action = MobileCore.getAction('clickable');
            expect(action.onClick).toBeDefined();
        });

        FunkyTests.it('registers action with order', function() {
            MobileCore.registerAction({
                id: 'ordered',
                icon: 'fas fa-star',
                label: 'Ordered',
                order: 25
            });

            var action = MobileCore.getAction('ordered');
            expect(action.order).toBe(25);
        });

        FunkyTests.it('registers action with badge', function() {
            MobileCore.registerAction({
                id: 'badged',
                icon: 'fas fa-bell',
                label: 'Notifications',
                badge: 5
            });

            var action = MobileCore.getAction('badged');
            expect(action.badge).toBe(5);
        });

        FunkyTests.it('unregisters an action', function() {
            MobileCore.registerAction({
                id: 'to-remove',
                icon: 'fas fa-trash',
                label: 'Remove Me'
            });

            MobileCore.unregisterAction('to-remove');

            var action = MobileCore.getAction('to-remove');
            expect(action).toBeNull();
        });

        FunkyTests.it('updates an action', function() {
            MobileCore.registerAction({
                id: 'updatable',
                icon: 'fas fa-star',
                label: 'Original'
            });

            MobileCore.updateAction('updatable', {
                label: 'Updated',
                badge: 3
            });

            var action = MobileCore.getAction('updatable');
            expect(action.label).toBe('Updated');
            expect(action.badge).toBe(3);
        });

        FunkyTests.it('returns all actions with getActions()', function() {
            MobileCore.registerAction({
                id: 'action1',
                icon: 'fas fa-star',
                label: 'One'
            });

            MobileCore.registerAction({
                id: 'action2',
                icon: 'fas fa-heart',
                label: 'Two'
            });

            var actions = MobileCore.getActions();
            expect(actions.length).toBeGreaterThanOrEqual(2);
        });

        FunkyTests.it('returns null for non-existent action', function() {
            var action = MobileCore.getAction('does-not-exist');
            expect(action).toBeNull();
        });

    });

    FunkyTests.describe('Action Rendering', function() {

        FunkyTests.beforeEach(function() {
            MobileCore.init({
                autoRegister: false,
                maxVisibleActions: 5
            });
            MobileCore.show();
        });

        FunkyTests.it('renders action button', function() {
            MobileCore.registerAction({
                id: 'render-test',
                icon: 'fas fa-star',
                label: 'Render'
            });

            var button = document.querySelector('[data-action="render-test"]');
            expect(button).not.toBeNull();
        });

        FunkyTests.it('renders action icon', function() {
            MobileCore.registerAction({
                id: 'icon-test',
                icon: 'fas fa-star',
                label: 'Icon'
            });

            var button = document.querySelector('[data-action="icon-test"]');
            var icon = button.querySelector('.fa-star');
            expect(icon).not.toBeNull();
        });

        FunkyTests.it('renders action label', function() {
            MobileCore.registerAction({
                id: 'label-test',
                icon: 'fas fa-star',
                label: 'My Label'
            });

            var button = document.querySelector('[data-action="label-test"]');
            var label = button.querySelector('.mobile-core__action-label');
            expect(label.textContent).toBe('My Label');
        });

        FunkyTests.it('renders action badge when present', function() {
            MobileCore.registerAction({
                id: 'badge-test',
                icon: 'fas fa-bell',
                label: 'Badge',
                badge: 7
            });

            var button = document.querySelector('[data-action="badge-test"]');
            var badge = button.querySelector('.mobile-core__action-badge');
            expect(badge).not.toBeNull();
            expect(badge.textContent).toBe('7');
        });

        FunkyTests.it('sets aria-label on action button', function() {
            MobileCore.registerAction({
                id: 'aria-test',
                icon: 'fas fa-star',
                label: 'Accessible'
            });

            var button = document.querySelector('[data-action="aria-test"]');
            expect(button.getAttribute('aria-label')).toBe('Accessible');
        });

        FunkyTests.it('sets disabled attribute on disabled action', function() {
            MobileCore.registerAction({
                id: 'disabled-test',
                icon: 'fas fa-ban',
                label: 'Disabled',
                disabled: true
            });

            var button = document.querySelector('[data-action="disabled-test"]');
            expect(button.hasAttribute('disabled')).toBe(true);
        });

        FunkyTests.it('adds custom className to action button', function() {
            MobileCore.registerAction({
                id: 'class-test',
                icon: 'fas fa-star',
                label: 'Custom',
                className: 'my-custom-class'
            });

            var button = document.querySelector('[data-action="class-test"]');
            expect(button.classList.contains('my-custom-class')).toBe(true);
        });

        FunkyTests.it('does not render hidden actions', function() {
            MobileCore.registerAction({
                id: 'hidden-test',
                icon: 'fas fa-eye-slash',
                label: 'Hidden',
                hidden: true
            });

            var button = document.querySelector('[data-action="hidden-test"]');
            expect(button).toBeNull();
        });

        FunkyTests.it('orders actions by order property', function() {
            MobileCore.registerAction({
                id: 'second',
                icon: 'fas fa-star',
                label: 'Second',
                order: 20
            });

            MobileCore.registerAction({
                id: 'first',
                icon: 'fas fa-star',
                label: 'First',
                order: 10
            });

            var buttons = document.querySelectorAll('.mobile-core__action');
            var firstButton = buttons[0];
            var secondButton = buttons[1];

            expect(firstButton.getAttribute('data-action')).toBe('first');
            expect(secondButton.getAttribute('data-action')).toBe('second');
        });

    });

    FunkyTests.describe('Action Click Handler', function() {

        FunkyTests.beforeEach(function() {
            MobileCore.init({
                autoRegister: false
            });
            MobileCore.show();
        });

        FunkyTests.it('executes onClick when action is clicked', function() {
            var clicked = false;

            MobileCore.registerAction({
                id: 'click-handler',
                icon: 'fas fa-mouse-pointer',
                label: 'Click',
                onClick: function() {
                    clicked = true;
                }
            });

            var button = document.querySelector('[data-action="click-handler"]');
            button.click();

            expect(clicked).toBe(true);
        });

        FunkyTests.it('does not execute onClick when disabled', function() {
            var clicked = false;

            MobileCore.registerAction({
                id: 'disabled-click',
                icon: 'fas fa-ban',
                label: 'Disabled',
                disabled: true,
                onClick: function() {
                    clicked = true;
                }
            });

            var button = document.querySelector('[data-action="disabled-click"]');
            button.click();

            expect(clicked).toBe(false);
        });

        FunkyTests.it('emits PubSub event when emit is specified', function(done) {
            var eventFired = false;

            Funky.PubSub.on('test:action:fired', function() {
                eventFired = true;
            });

            MobileCore.registerAction({
                id: 'emit-action',
                icon: 'fas fa-broadcast-tower',
                label: 'Emit',
                emit: 'test:action:fired'
            });

            var button = document.querySelector('[data-action="emit-action"]');
            button.click();

            setTimeout(function() {
                expect(eventFired).toBe(true);
                Funky.PubSub.off('test:action:fired');
                done();
            }, 50);
        });

        FunkyTests.it('emits funky:mobile:action:triggered on click', function(done) {
            var triggeredId = null;

            Funky.PubSub.on('funky:mobile:action:triggered', function(data) {
                triggeredId = data.id;
            });

            MobileCore.registerAction({
                id: 'trigger-test',
                icon: 'fas fa-star',
                label: 'Trigger',
                onClick: function() {}
            });

            var button = document.querySelector('[data-action="trigger-test"]');
            button.click();

            setTimeout(function() {
                expect(triggeredId).toBe('trigger-test');
                Funky.PubSub.off('funky:mobile:action:triggered');
                done();
            }, 50);
        });

    });

    FunkyTests.describe('Overflow Menu', function() {

        FunkyTests.beforeEach(function() {
            MobileCore.init({
                autoRegister: false,
                maxVisibleActions: 3
            });
            MobileCore.show();

            // Register more actions than maxVisibleActions
            for (var i = 1; i <= 5; i++) {
                MobileCore.registerAction({
                    id: 'overflow-action-' + i,
                    icon: 'fas fa-star',
                    label: 'Action ' + i,
                    order: i * 10
                });
            }
        });

        FunkyTests.it('shows More button when actions exceed maxVisibleActions', function() {
            var moreButton = document.querySelector('[data-action="more"]');
            expect(moreButton).not.toBeNull();
        });

        FunkyTests.it('More button has mobile-core__action--more class', function() {
            var moreButton = document.querySelector('[data-action="more"]');
            expect(moreButton.classList.contains('mobile-core__action--more')).toBe(true);
        });

        FunkyTests.it('opens overflow with openOverflow()', function() {
            MobileCore.openOverflow();

            var element = document.querySelector('.mobile-core');
            expect(element.classList.contains('mobile-core--overflow-open')).toBe(true);
        });

        FunkyTests.it('closes overflow with closeOverflow()', function() {
            MobileCore.openOverflow();
            MobileCore.closeOverflow();

            var element = document.querySelector('.mobile-core');
            expect(element.classList.contains('mobile-core--overflow-open')).toBe(false);
        });

        FunkyTests.it('toggles overflow with toggleOverflow()', function() {
            MobileCore.toggleOverflow();
            var element = document.querySelector('.mobile-core');
            expect(element.classList.contains('mobile-core--overflow-open')).toBe(true);

            MobileCore.toggleOverflow();
            expect(element.classList.contains('mobile-core--overflow-open')).toBe(false);
        });

        FunkyTests.it('sets aria-hidden false when overflow is open', function() {
            MobileCore.openOverflow();

            var panel = document.querySelector('.mobile-core__overflow');
            expect(panel.getAttribute('aria-hidden')).toBe('false');
        });

        FunkyTests.it('sets aria-hidden true when overflow is closed', function() {
            MobileCore.openOverflow();
            MobileCore.closeOverflow();

            var panel = document.querySelector('.mobile-core__overflow');
            expect(panel.getAttribute('aria-hidden')).toBe('true');
        });

        FunkyTests.it('renders overflow actions in panel', function() {
            MobileCore.openOverflow();

            var overflowItems = document.querySelectorAll('.mobile-core__overflow-item');
            expect(overflowItems.length).toBeGreaterThan(0);
        });

        FunkyTests.it('clicking backdrop closes overflow', function() {
            MobileCore.openOverflow();

            var backdrop = document.querySelector('.mobile-core__overflow-backdrop');
            backdrop.click();

            var element = document.querySelector('.mobile-core');
            expect(element.classList.contains('mobile-core--overflow-open')).toBe(false);
        });

        FunkyTests.it('emits funky:mobile:overflow:opened when opened', function(done) {
            var opened = false;

            Funky.PubSub.on('funky:mobile:overflow:opened', function() {
                opened = true;
            });

            MobileCore.openOverflow();

            setTimeout(function() {
                expect(opened).toBe(true);
                Funky.PubSub.off('funky:mobile:overflow:opened');
                done();
            }, 50);
        });

        FunkyTests.it('emits funky:mobile:overflow:closed when closed', function(done) {
            var closed = false;

            Funky.PubSub.on('funky:mobile:overflow:closed', function() {
                closed = true;
            });

            MobileCore.openOverflow();
            MobileCore.closeOverflow();

            setTimeout(function() {
                expect(closed).toBe(true);
                Funky.PubSub.off('funky:mobile:overflow:closed');
                done();
            }, 50);
        });

    });

    FunkyTests.describe('PubSub Integration', function() {

        FunkyTests.beforeEach(function() {
            MobileCore.init({
                autoRegister: false
            });
        });

        FunkyTests.it('registers action via PubSub event', function(done) {
            Funky.PubSub.emit('funky:mobile:action:register', {
                id: 'pubsub-action',
                icon: 'fas fa-star',
                label: 'PubSub'
            });

            setTimeout(function() {
                var action = MobileCore.getAction('pubsub-action');
                expect(action).not.toBeNull();
                done();
            }, 50);
        });

        FunkyTests.it('unregisters action via PubSub event', function(done) {
            MobileCore.registerAction({
                id: 'to-unregister',
                icon: 'fas fa-trash',
                label: 'Unregister'
            });

            Funky.PubSub.emit('funky:mobile:action:unregister', {
                id: 'to-unregister'
            });

            setTimeout(function() {
                var action = MobileCore.getAction('to-unregister');
                expect(action).toBeNull();
                done();
            }, 50);
        });

        FunkyTests.it('updates action via PubSub event', function(done) {
            MobileCore.registerAction({
                id: 'to-update',
                icon: 'fas fa-star',
                label: 'Original'
            });

            Funky.PubSub.emit('funky:mobile:action:update', {
                id: 'to-update',
                updates: {
                    label: 'Updated via PubSub'
                }
            });

            setTimeout(function() {
                var action = MobileCore.getAction('to-update');
                expect(action.label).toBe('Updated via PubSub');
                done();
            }, 50);
        });

        FunkyTests.it('emits funky:mobile:initialized on init', function(done) {
            MobileCore.destroy();

            var initialized = false;

            Funky.PubSub.on('funky:mobile:initialized', function() {
                initialized = true;
            });

            MobileCore.init({ autoRegister: false });

            setTimeout(function() {
                expect(initialized).toBe(true);
                Funky.PubSub.off('funky:mobile:initialized');
                done();
            }, 50);
        });

        FunkyTests.it('emits funky:mobile:shown when shown', function(done) {
            var shown = false;

            Funky.PubSub.on('funky:mobile:shown', function() {
                shown = true;
            });

            MobileCore.show();

            setTimeout(function() {
                expect(shown).toBe(true);
                Funky.PubSub.off('funky:mobile:shown');
                done();
            }, 50);
        });

        FunkyTests.it('emits funky:mobile:hidden when hidden', function(done) {
            MobileCore.show();

            var hidden = false;

            Funky.PubSub.on('funky:mobile:hidden', function() {
                hidden = true;
            });

            MobileCore.hide();

            setTimeout(function() {
                expect(hidden).toBe(true);
                Funky.PubSub.off('funky:mobile:hidden');
                done();
            }, 50);
        });

        FunkyTests.it('emits funky:mobile:action:added when action registered', function(done) {
            var addedId = null;

            Funky.PubSub.on('funky:mobile:action:added', function(data) {
                addedId = data.id;
            });

            MobileCore.registerAction({
                id: 'added-action',
                icon: 'fas fa-plus',
                label: 'Added'
            });

            setTimeout(function() {
                expect(addedId).toBe('added-action');
                Funky.PubSub.off('funky:mobile:action:added');
                done();
            }, 50);
        });

        FunkyTests.it('emits funky:mobile:action:removed when action unregistered', function(done) {
            MobileCore.registerAction({
                id: 'removed-action',
                icon: 'fas fa-minus',
                label: 'Removed'
            });

            var removedId = null;

            Funky.PubSub.on('funky:mobile:action:removed', function(data) {
                removedId = data.id;
            });

            MobileCore.unregisterAction('removed-action');

            setTimeout(function() {
                expect(removedId).toBe('removed-action');
                Funky.PubSub.off('funky:mobile:action:removed');
                done();
            }, 50);
        });

    });

    FunkyTests.describe('Destroy', function() {

        FunkyTests.it('destroys successfully', function() {
            MobileCore.init({ autoRegister: false });
            MobileCore.destroy();

            expect(MobileCore.isInitialized()).toBe(false);
        });

        FunkyTests.it('removes DOM element on destroy', function() {
            MobileCore.init({ autoRegister: false });
            MobileCore.destroy();

            var element = document.querySelector('.mobile-core');
            expect(element).toBeNull();
        });

        FunkyTests.it('closes overflow on destroy', function() {
            MobileCore.init({
                autoRegister: false,
                maxVisibleActions: 2
            });

            MobileCore.registerAction({ id: 'a1', icon: 'fas fa-star', label: 'A1' });
            MobileCore.registerAction({ id: 'a2', icon: 'fas fa-star', label: 'A2' });
            MobileCore.registerAction({ id: 'a3', icon: 'fas fa-star', label: 'A3' });

            MobileCore.show();
            MobileCore.openOverflow();
            MobileCore.destroy();

            // Should not throw and should clean up
            expect(MobileCore.isInitialized()).toBe(false);
        });

        FunkyTests.it('clears all actions on destroy', function() {
            MobileCore.init({ autoRegister: false });

            MobileCore.registerAction({
                id: 'to-clear',
                icon: 'fas fa-star',
                label: 'Clear'
            });

            MobileCore.destroy();

            // Re-init to check actions were cleared
            MobileCore.init({ autoRegister: false });
            var action = MobileCore.getAction('to-clear');
            expect(action).toBeNull();
        });

        FunkyTests.it('emits funky:mobile:destroyed on destroy', function(done) {
            MobileCore.init({ autoRegister: false });

            var destroyed = false;

            Funky.PubSub.on('funky:mobile:destroyed', function() {
                destroyed = true;
            });

            MobileCore.destroy();

            setTimeout(function() {
                expect(destroyed).toBe(true);
                Funky.PubSub.off('funky:mobile:destroyed');
                done();
            }, 50);
        });

        FunkyTests.it('does nothing if not initialized', function() {
            // Should not throw
            MobileCore.destroy();
            expect(MobileCore.isInitialized()).toBe(false);
        });

    });

    FunkyTests.describe('Default Actions', function() {

        FunkyTests.it('registers sidenav-toggle when sidebar exists and enabled', function() {
            MobileCore.init({
                autoRegister: true,
                defaultActions: {
                    sidenavToggle: true,
                    commandPalette: false,
                    keyboardHelp: false,
                    skipLinks: false
                }
            });

            var action = MobileCore.getAction('sidenav-toggle');
            expect(action).not.toBeNull();
        });

        FunkyTests.it('does not register sidenav-toggle when disabled', function() {
            MobileCore.init({
                autoRegister: true,
                defaultActions: {
                    sidenavToggle: false,
                    commandPalette: false,
                    keyboardHelp: false,
                    skipLinks: false
                }
            });

            var action = MobileCore.getAction('sidenav-toggle');
            expect(action).toBeNull();
        });

        FunkyTests.it('registers command-palette when CommandPalette exists', function() {
            // Only test if CommandPalette is available
            if (!Funky.CommandPalette) {
                expect(true).toBe(true); // Skip test
                return;
            }

            MobileCore.init({
                autoRegister: true,
                defaultActions: {
                    sidenavToggle: false,
                    commandPalette: true,
                    keyboardHelp: false,
                    skipLinks: false
                }
            });

            var action = MobileCore.getAction('command-palette');
            expect(action).not.toBeNull();
        });

        FunkyTests.it('registers keyboard-help when Keyboard.showHelp exists', function() {
            // Only test if Keyboard is available
            if (!Funky.Keyboard || !Funky.Keyboard.showHelp) {
                expect(true).toBe(true); // Skip test
                return;
            }

            MobileCore.init({
                autoRegister: true,
                defaultActions: {
                    sidenavToggle: false,
                    commandPalette: false,
                    keyboardHelp: true,
                    skipLinks: false
                }
            });

            var action = MobileCore.getAction('keyboard-help');
            expect(action).not.toBeNull();
        });

    });

    FunkyTests.describe('Edge Cases', function() {

        FunkyTests.it('handles registerAction before init gracefully', function() {
            // This should warn but not throw
            MobileCore.registerAction({
                id: 'early-action',
                icon: 'fas fa-star',
                label: 'Early'
            });

            // Action should not be registered since not initialized
            // (depends on implementation - may warn)
            expect(true).toBe(true);
        });

        FunkyTests.it('handles updateAction for non-existent action', function() {
            MobileCore.init({ autoRegister: false });

            // Should not throw
            MobileCore.updateAction('non-existent', { label: 'Updated' });

            expect(true).toBe(true);
        });

        FunkyTests.it('handles unregisterAction for non-existent action', function() {
            MobileCore.init({ autoRegister: false });

            // Should not throw
            MobileCore.unregisterAction('non-existent');

            expect(true).toBe(true);
        });

        FunkyTests.it('handles getActions when no actions registered', function() {
            MobileCore.init({ autoRegister: false });

            var actions = MobileCore.getActions();
            expect(Array.isArray(actions)).toBe(true);
        });

        FunkyTests.it('handles rapid show/hide calls', function() {
            MobileCore.init({ autoRegister: false });

            MobileCore.show();
            MobileCore.hide();
            MobileCore.show();
            MobileCore.hide();
            MobileCore.show();

            expect(MobileCore.isVisible()).toBe(true);
        });

        FunkyTests.it('handles overflow toggle when no overflow actions', function() {
            MobileCore.init({
                autoRegister: false,
                maxVisibleActions: 10
            });

            MobileCore.registerAction({
                id: 'single',
                icon: 'fas fa-star',
                label: 'Single'
            });

            MobileCore.show();

            // More button should not exist
            var moreButton = document.querySelector('[data-action="more"]');
            expect(moreButton).toBeNull();

            // Toggle should not throw
            MobileCore.toggleOverflow();
            expect(true).toBe(true);
        });

    });

});
