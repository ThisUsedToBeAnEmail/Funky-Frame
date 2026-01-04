/**
 * Funky.QuickNav Tests
 *
 * Tests for the floating navigation widget with back-to-top,
 * section detection, custom actions, and SPA support.
 */

describe('Funky.Component.QuickNav', function() {

    var QuickNav;
    var fixture;

    beforeEach(function() {
        // Get fresh reference - module may load after test file
        QuickNav = Funky.QuickNav;

        // Create a page structure with landmarks
        fixture = FunkyTests.fixture(
            '<main id="main-content">Main Content</main>' +
            '<nav id="site-nav">Navigation</nav>' +
            '<footer id="footer">Footer</footer>' +
            '<a href="#main-content" class="skip-link">Skip to main</a>'
        );
    });

    afterEach(function() {
        // Destroy QuickNav if initialized
        if (QuickNav && QuickNav._getState && QuickNav._getState().initialized) {
            QuickNav.destroy();
        }
        if (fixture) {
            fixture.destroy();
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('QuickNav')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof QuickNav.init).toBe('function');
        });

        it('has destroy method', function() {
            expect(typeof QuickNav.destroy).toBe('function');
        });

        it('has expand method', function() {
            expect(typeof QuickNav.expand).toBe('function');
        });

        it('has collapse method', function() {
            expect(typeof QuickNav.collapse).toBe('function');
        });

        it('has toggle method', function() {
            expect(typeof QuickNav.toggle).toBe('function');
        });

        it('has show method', function() {
            expect(typeof QuickNav.show).toBe('function');
        });

        it('has hide method', function() {
            expect(typeof QuickNav.hide).toBe('function');
        });

        it('has addAction method', function() {
            expect(typeof QuickNav.addAction).toBe('function');
        });

        it('has removeAction method', function() {
            expect(typeof QuickNav.removeAction).toBe('function');
        });

        it('has navigateTo method', function() {
            expect(typeof QuickNav.navigateTo).toBe('function');
        });

    });

    describe('Initialization', function() {

        it('initializes with default options', function() {
            QuickNav.init();

            expect(QuickNav._getState().initialized).toBe(true);
        });

        it('creates DOM element', function() {
            QuickNav.init();

            var el = document.querySelector('.quick-nav');
            expect(el).not.toBeNull();
        });

        it('adds navigation role', function() {
            QuickNav.init();

            var el = document.querySelector('.quick-nav');
            expect(el.getAttribute('role')).toBe('navigation');
        });

        it('adds aria-label', function() {
            QuickNav.init({
                ariaLabel: 'Quick navigation'
            });

            var el = document.querySelector('.quick-nav');
            expect(el.getAttribute('aria-label')).toBe('Quick navigation');
        });

        it('creates FAB button', function() {
            QuickNav.init();

            var fab = document.querySelector('.quick-nav__fab');
            expect(fab).not.toBeNull();
            expect(fab.getAttribute('type')).toBe('button');
        });

        it('creates action list container', function() {
            QuickNav.init();

            var actions = document.querySelector('.quick-nav__actions');
            expect(actions).not.toBeNull();
        });

        it('respects position option', function() {
            QuickNav.init({
                position: 'bottom-left'
            });

            var el = document.querySelector('.quick-nav');
            expect(el).not.toBeNull();
            expect(el.classList.contains('quick-nav--bottom-left')).toBe(true);
        });

        it('starts collapsed by default', function() {
            QuickNav.init({
                collapsed: true
            });

            var el = document.querySelector('.quick-nav');
            expect(el.classList.contains('quick-nav--collapsed')).toBe(true);
        });

        it('can start expanded', function() {
            QuickNav.init({
                collapsed: false
            });

            var el = document.querySelector('.quick-nav');
            expect(el.classList.contains('quick-nav--expanded')).toBe(true);
        });

        it('warns if already initialized', function() {
            QuickNav.init();

            // Should not throw, just return
            var result = QuickNav.init();
            expect(result).toBe(QuickNav);
        });

    });

    describe('destroy()', function() {

        it('removes DOM element', function() {
            QuickNav.init();
            QuickNav.destroy();

            var el = document.querySelector('.quick-nav');
            expect(el).toBeNull();
        });

        it('resets initialized state', function() {
            QuickNav.init();
            QuickNav.destroy();

            expect(QuickNav._getState().initialized).toBe(false);
        });

        it('returns QuickNav for chaining', function() {
            QuickNav.init();
            var result = QuickNav.destroy();

            expect(result).toBe(QuickNav);
        });

        it('handles destroy when not initialized', function() {
            // Should not throw
            var result = QuickNav.destroy();
            expect(result).toBe(QuickNav);
        });

    });

    describe('Expand/Collapse', function() {

        beforeEach(function() {
            QuickNav.init({ collapsed: true, collapseDelay: 0 });
        });

        it('expand() expands action list', function() {
            QuickNav.expand();

            var el = document.querySelector('.quick-nav');
            expect(el.classList.contains('quick-nav--expanded')).toBe(true);
            expect(QuickNav.isExpanded()).toBe(true);
        });

        it('expand() sets aria-expanded on FAB', function() {
            QuickNav.expand();

            var fab = document.querySelector('.quick-nav__fab');
            expect(fab.getAttribute('aria-expanded')).toBe('true');
        });

        it('collapse() collapses action list', function() {
            QuickNav.expand();
            QuickNav.collapse();

            var el = document.querySelector('.quick-nav');
            expect(el.classList.contains('quick-nav--collapsed')).toBe(true);
            expect(QuickNav.isExpanded()).toBe(false);
        });

        it('collapse() sets aria-expanded false on FAB', function() {
            QuickNav.expand();
            QuickNav.collapse();

            var fab = document.querySelector('.quick-nav__fab');
            expect(fab.getAttribute('aria-expanded')).toBe('false');
        });

        it('toggle() toggles state', function() {
            expect(QuickNav.isExpanded()).toBe(false);

            QuickNav.toggle();
            expect(QuickNav.isExpanded()).toBe(true);

            QuickNav.toggle();
            expect(QuickNav.isExpanded()).toBe(false);
        });

        it('sets aria-hidden on action list', function() {
            var actions = document.querySelector('.quick-nav__actions');

            QuickNav.expand();
            expect(actions.getAttribute('aria-hidden')).toBe('false');

            QuickNav.collapse();
            expect(actions.getAttribute('aria-hidden')).toBe('true');
        });

    });

    describe('Visibility', function() {

        beforeEach(function() {
            QuickNav.init({ showTrigger: 'always', animation: 'none' });
        });

        it('isVisible() returns current visibility', function() {
            expect(QuickNav.isVisible()).toBe(true);
        });

        it('hide() hides the component', function() {
            QuickNav.hide();

            expect(QuickNav.isVisible()).toBe(false);
        });

        it('show() shows the component', function() {
            QuickNav.hide();
            QuickNav.show();

            expect(QuickNav.isVisible()).toBe(true);
        });

        it('toggleVisibility() toggles visibility', function() {
            QuickNav.toggleVisibility();
            expect(QuickNav.isVisible()).toBe(false);

            QuickNav.toggleVisibility();
            expect(QuickNav.isVisible()).toBe(true);
        });

        it('adds hidden class when hidden', function() {
            QuickNav.hide();

            var el = document.querySelector('.quick-nav');
            expect(el.classList.contains('quick-nav--hidden')).toBe(true);
        });

    });

    describe('Position', function() {

        beforeEach(function() {
            // Always destroy first to ensure clean state (parent afterEach may or may not have run)
            QuickNav.destroy();
            // Disable preferences to prevent saved state from interfering with tests
            QuickNav.init({ position: 'bottom-right', preferences: { enabled: false } });
        });

        it('getPosition() returns current position', function() {
            expect(QuickNav.getPosition()).toBe('bottom-right');
        });

        it('setPosition() changes position', function() {
            QuickNav.setPosition('top-left');

            var el = document.querySelector('.quick-nav');
            expect(el.classList.contains('quick-nav--top-left')).toBe(true);
            expect(QuickNav.getPosition()).toBe('top-left');
        });

        it('setPosition() removes old position class', function() {
            QuickNav.setPosition('bottom-left');

            var el = document.querySelector('.quick-nav');
            expect(el).not.toBeNull();
            expect(el.classList.contains('quick-nav--bottom-right')).toBe(false);
        });

        it('warns on invalid position', function() {
            QuickNav.setPosition('invalid-position');

            // Position should remain unchanged
            expect(QuickNav.getPosition()).toBe('bottom-right');
        });

    });

    describe('Section Detection', function() {

        beforeEach(function() {
            QuickNav.init({
                backToTop: true,
                sections: true
            });
        });

        it('detects back-to-top section', function() {
            var sections = QuickNav.getSections();
            var backToTop = sections.find(function(s) { return s.isBackToTop; });

            expect(backToTop).toBeDefined();
            expect(backToTop.id).toBe('top');
        });

        it('detects main content via skip link', function() {
            var sections = QuickNav.getSections();
            // Skip link takes priority over landmark detection
            var main = sections.find(function(s) { return s.id === 'skip-main-content' || s.id === 'main'; });

            expect(main).toBeDefined();
        });

        it('detects navigation landmark', function() {
            var sections = QuickNav.getSections();
            var nav = sections.find(function(s) { return s.id === 'nav'; });

            expect(nav).toBeDefined();
        });

        it('detects footer landmark', function() {
            var sections = QuickNav.getSections();
            var footer = sections.find(function(s) { return s.id === 'footer'; });

            expect(footer).toBeDefined();
        });

        it('refreshSections() re-detects sections', function() {
            // Add a new landmark
            var search = document.createElement('div');
            search.setAttribute('role', 'search');
            document.body.appendChild(search);

            QuickNav.refreshSections();
            var sections = QuickNav.getSections();
            var searchSection = sections.find(function(s) { return s.id === 'search'; });

            expect(searchSection).toBeDefined();

            // Cleanup
            search.remove();
        });

        it('getSections() returns array copy', function() {
            var sections1 = QuickNav.getSections();
            var sections2 = QuickNav.getSections();

            expect(sections1).not.toBe(sections2);
        });

    });

    describe('Custom Actions', function() {

        beforeEach(function() {
            QuickNav.init();
        });

        it('addAction() adds a custom action', function() {
            QuickNav.addAction({
                id: 'help',
                icon: 'fas fa-question',
                label: 'Help'
            });

            var action = QuickNav.getAction('help');
            expect(action).not.toBeNull();
            expect(action.label).toBe('Help');
        });

        it('addAction() returns QuickNav for chaining', function() {
            var result = QuickNav.addAction({
                id: 'test',
                label: 'Test'
            });

            expect(result).toBe(QuickNav);
        });

        it('removeAction() removes an action', function() {
            QuickNav.addAction({
                id: 'to-remove',
                label: 'Remove Me'
            });

            QuickNav.removeAction('to-remove');

            expect(QuickNav.getAction('to-remove')).toBeNull();
        });

        it('updateAction() updates an action', function() {
            QuickNav.addAction({
                id: 'update-me',
                label: 'Original'
            });

            QuickNav.updateAction('update-me', { label: 'Updated' });

            expect(QuickNav.getAction('update-me').label).toBe('Updated');
        });

        it('getActions() returns sorted actions', function() {
            QuickNav.addAction({ id: 'z', label: 'Z', order: 100 });
            QuickNav.addAction({ id: 'a', label: 'A', order: 10 });
            QuickNav.addAction({ id: 'm', label: 'M', order: 50 });

            var actions = QuickNav.getActions();

            expect(actions[0].id).toBe('a');
            expect(actions[1].id).toBe('m');
            expect(actions[2].id).toBe('z');
        });

        it('hideAction() hides an action', function() {
            QuickNav.addAction({ id: 'hideable', label: 'Hide Me' });
            QuickNav.hideAction('hideable');

            var actions = QuickNav.getActions();
            var found = actions.find(function(a) { return a.id === 'hideable'; });

            expect(found).toBeUndefined();
        });

        it('showAction() shows a hidden action', function() {
            QuickNav.addAction({ id: 'showable', label: 'Show Me' });
            QuickNav.hideAction('showable');
            QuickNav.showAction('showable');

            var actions = QuickNav.getActions();
            var found = actions.find(function(a) { return a.id === 'showable'; });

            expect(found).toBeDefined();
        });

        it('renders action button with icon', function() {
            QuickNav.addAction({
                id: 'with-icon',
                icon: 'fas fa-star',
                label: 'Starred'
            });

            var button = document.querySelector('[data-action="with-icon"]');
            expect(button).not.toBeNull();

            var icon = button.querySelector('.fa-star');
            expect(icon).not.toBeNull();
        });

        it('renders action button with label', function() {
            QuickNav.addAction({
                id: 'with-label',
                label: 'My Label'
            });

            var button = document.querySelector('[data-action="with-label"]');
            var label = button.querySelector('.quick-nav__action-label');

            expect(label.textContent).toBe('My Label');
        });

    });

    describe('Badge Support', function() {

        beforeEach(function() {
            QuickNav.init();
        });

        it('setBadge() sets badge on action', function() {
            QuickNav.addAction({
                id: 'badge-test',
                label: 'Badge Test'
            });

            QuickNav.setBadge('badge-test', 5);

            var action = QuickNav.getAction('badge-test');
            expect(action.badge).toBe(5);
        });

        it('clearBadge() removes badge', function() {
            QuickNav.addAction({
                id: 'clear-badge',
                label: 'Clear Badge'
            });

            QuickNav.setBadge('clear-badge', 10);
            QuickNav.clearBadge('clear-badge');

            var action = QuickNav.getAction('clear-badge');
            expect(action.badge).toBeNull();
        });

        it('setBadge() returns QuickNav for chaining', function() {
            QuickNav.addAction({ id: 'chain-test', label: 'Test' });
            var result = QuickNav.setBadge('chain-test', 3);

            expect(result).toBe(QuickNav);
        });

    });

    describe('Z-Index Management', function() {

        beforeEach(function() {
            QuickNav.init({ zIndex: 1020 });
        });

        it('setZIndex() changes z-index', function() {
            QuickNav.setZIndex(2000);

            // Check that config was updated
            expect(QuickNav._getConfig().zIndex).toBe(2000);
        });

        it('resetZIndex() resets to default', function() {
            QuickNav.setZIndex(9999);
            QuickNav.resetZIndex();

            // Check that config was reset to default
            expect(QuickNav._getConfig().zIndex).toBe(1020);
        });

    });

    describe('Reset', function() {

        beforeEach(function() {
            QuickNav.init();
            QuickNav.addAction({ id: 'temp', label: 'Temp' });
        });

        it('reset() refreshes sections', function() {
            // Add a new section element
            var newSection = document.createElement('div');
            newSection.setAttribute('role', 'search');
            document.body.appendChild(newSection);

            QuickNav.reset({ sections: true });

            var sections = QuickNav.getSections();
            var search = sections.find(function(s) { return s.id === 'search'; });
            expect(search).toBeDefined();

            newSection.remove();
        });

        it('reset() returns QuickNav for chaining', function() {
            var result = QuickNav.reset();
            expect(result).toBe(QuickNav);
        });

    });

    describe('Accessibility', function() {

        beforeEach(function() {
            QuickNav.init();
        });

        it('FAB has aria-expanded', function() {
            var fab = document.querySelector('.quick-nav__fab');
            expect(fab.hasAttribute('aria-expanded')).toBe(true);
        });

        it('FAB has aria-controls', function() {
            var fab = document.querySelector('.quick-nav__fab');
            expect(fab.getAttribute('aria-controls')).toBe('quick-nav-actions');
        });

        it('FAB has aria-label', function() {
            var fab = document.querySelector('.quick-nav__fab');
            expect(fab.hasAttribute('aria-label')).toBe(true);
        });

        it('action list has id for aria-controls', function() {
            var actions = document.querySelector('.quick-nav__actions');
            expect(actions.id).toBe('quick-nav-actions');
        });

        it('creates live region for announcements', function() {
            var announcer = document.querySelector('.quick-nav__announcer');
            expect(announcer).not.toBeNull();
            expect(announcer.getAttribute('role')).toBe('status');
            expect(announcer.getAttribute('aria-live')).toBe('polite');
        });

    });

    describe('FAB Click Behavior', function() {

        beforeEach(function() {
            QuickNav.init({ collapsed: true, collapseDelay: 0 });
        });

        it('clicking FAB expands when collapsed', function() {
            var fab = document.querySelector('.quick-nav__fab');
            fab.click();

            expect(QuickNav.isExpanded()).toBe(true);
        });

        it('clicking FAB collapses when expanded', function() {
            QuickNav.expand();

            var fab = document.querySelector('.quick-nav__fab');
            fab.click();

            expect(QuickNav.isExpanded()).toBe(false);
        });

    });

    describe('State Access', function() {

        it('_getState() returns internal state', function() {
            QuickNav.init();

            var state = QuickNav._getState();
            expect(state).toBeDefined();
            expect(state.initialized).toBe(true);
        });

        it('_getConfig() returns internal config', function() {
            // Always destroy first to ensure clean state
            QuickNav.destroy();
            // Disable preferences to prevent saved state from interfering
            QuickNav.init({ position: 'top-left', preferences: { enabled: false } });

            var config = QuickNav._getConfig();
            expect(config).toBeDefined();
            expect(config.position).toBe('top-left');
        });

        it('_getActionRegistry() returns action registry', function() {
            QuickNav.init();

            var registry = QuickNav._getActionRegistry();
            expect(registry).toBeDefined();
            expect(typeof registry.add).toBe('function');
        });

    });

    describe('PubSub Events', function() {

        beforeEach(function() {
            QuickNav.init({ collapsed: true, collapseDelay: 0 });
        });

        it('emits funky:quick-nav:expanded on expand', function(done) {
            var eventFired = false;

            if (Funky.PubSub) {
                var unsub = Funky.PubSub.on('funky:quick-nav:expanded', function() {
                    eventFired = true;
                    unsub();
                });
            }

            QuickNav.expand();

            setTimeout(function() {
                expect(eventFired).toBe(true);
                done();
            }, 50);
        });

        it('emits funky:quick-nav:collapsed on collapse', function(done) {
            var eventFired = false;

            QuickNav.expand();

            if (Funky.PubSub) {
                var unsub = Funky.PubSub.on('funky:quick-nav:collapsed', function() {
                    eventFired = true;
                    unsub();
                });
            }

            QuickNav.collapse();

            setTimeout(function() {
                expect(eventFired).toBe(true);
                done();
            }, 50);
        });

        it('emits funky:quick-nav:action:added on addAction', function(done) {
            var eventData = null;

            if (Funky.PubSub) {
                var unsub = Funky.PubSub.on('funky:quick-nav:action:added', function(data) {
                    eventData = data;
                    unsub();
                });
            }

            QuickNav.addAction({
                id: 'event-test',
                label: 'Event Test'
            });

            setTimeout(function() {
                expect(eventData).not.toBeNull();
                expect(eventData.id).toBe('event-test');
                done();
            }, 50);
        });

    });

});
