/**
 * Funky.EmptyState Tests
 *
 * Tests for the empty state placeholder component.
 */

describe('Funky.Component.EmptyState', function() {

    var EmptyState;
    var fixture;

    beforeEach(function() {
        // Get fresh reference - module may load after test file
        EmptyState = Funky.EmptyState;

        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('EmptyState')).toBe(true);
        });

        it('has show method', function() {
            expect(typeof EmptyState.show).toBe('function');
        });

        it('has hide method', function() {
            expect(typeof EmptyState.hide).toBe('function');
        });

        it('has isShowing method', function() {
            expect(typeof EmptyState.isShowing).toBe('function');
        });

        it('has registerPreset method', function() {
            expect(typeof EmptyState.registerPreset).toBe('function');
        });

        it('has getPresets method', function() {
            expect(typeof EmptyState.getPresets).toBe('function');
        });

        it('has getPresetNames method', function() {
            expect(typeof EmptyState.getPresetNames).toBe('function');
        });

    });

    describe('show()', function() {

        it('returns instance object', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = EmptyState.show(container, { title: 'Empty' });

            expect(instance).not.toBeNull();
            expect(instance.id).toBeDefined();
            expect(typeof instance.destroy).toBe('function');
        });

        it('renders empty state element', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'No data' });

            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState).not.toBeNull();
        });

        it('displays title', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Custom Title' });

            var title = container.querySelector('.funky-empty-state-title');
            expect(title.textContent).toBe('Custom Title');
        });

        it('displays message', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title', message: 'Custom message here' });

            var message = container.querySelector('.funky-empty-state-message');
            expect(message.textContent).toBe('Custom message here');
        });

        it('displays icon', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title', icon: 'fa-search' });

            var iconContainer = container.querySelector('.funky-empty-state-icon');
            expect(iconContainer).not.toBeNull();

            var icon = iconContainer.querySelector('.fa-search');
            expect(icon).not.toBeNull();
        });

        it('sets role="status" for accessibility', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title' });

            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState.getAttribute('role')).toBe('status');
        });

        it('hides icon from screen readers', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title', icon: 'fa-inbox' });

            var iconContainer = container.querySelector('.funky-empty-state-icon');
            expect(iconContainer.getAttribute('aria-hidden')).toBe('true');
        });

        it('accepts selector string', function() {
            fixture.html('<div id="container"></div>');

            var instance = EmptyState.show('#container', { title: 'Title' });

            expect(instance).not.toBeNull();
        });

        it('returns null for non-existent container', function() {
            var instance = EmptyState.show('#nonexistent', { title: 'Title' });
            expect(instance).toBeNull();
        });

    });

    describe('hide()', function() {

        it('removes empty state element', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title' });
            EmptyState.hide(container);

            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState).toBeNull();
        });

        it('instance.destroy() hides empty state', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = EmptyState.show(container, { title: 'Title' });
            instance.destroy();

            expect(EmptyState.isShowing(container)).toBe(false);
        });

    });

    describe('isShowing()', function() {

        it('returns true when empty state is active', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title' });

            expect(EmptyState.isShowing(container)).toBe(true);
        });

        it('returns false when no empty state', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            expect(EmptyState.isShowing(container)).toBe(false);
        });

        it('returns false after hide', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title' });
            EmptyState.hide(container);

            expect(EmptyState.isShowing(container)).toBe(false);
        });

    });

    describe('Presets', function() {

        it('getPresetNames() returns array of names', function() {
            var names = EmptyState.getPresetNames();

            expect(Array.isArray(names)).toBe(true);
            expect(names.length).toBeGreaterThan(0);
        });

        it('includes built-in presets', function() {
            var names = EmptyState.getPresetNames();

            expect(names).toContain('no-results');
            expect(names).toContain('no-data');
            expect(names).toContain('error');
        });

        it('type option applies preset', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { type: 'no-results' });

            var title = container.querySelector('.funky-empty-state-title');
            expect(title.textContent).toBe('No results found');
        });

        it('registerPreset() adds custom preset', function() {
            EmptyState.registerPreset('custom-preset', {
                icon: 'fa-star',
                title: 'Custom Preset',
                message: 'This is custom'
            });

            var names = EmptyState.getPresetNames();
            expect(names).toContain('custom-preset');
        });

        it('custom options override preset', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, {
                type: 'no-results',
                title: 'Custom Title Override'
            });

            var title = container.querySelector('.funky-empty-state-title');
            expect(title.textContent).toBe('Custom Title Override');
        });

        it('getPresets() returns all presets', function() {
            var presets = EmptyState.getPresets();

            expect(typeof presets).toBe('object');
            expect(presets['no-results']).toBeDefined();
            expect(presets['error']).toBeDefined();
        });

    });

    describe('Sizes', function() {

        it('applies size class', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title', size: 'lg' });

            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState.classList.contains('funky-empty-state-lg')).toBe(true);
        });

        it('default size is md', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title' });

            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState.classList.contains('funky-empty-state-md')).toBe(true);
        });

    });

    describe('Variants', function() {

        it('applies variant class', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Error', variant: 'danger' });

            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState.classList.contains('funky-empty-state-variant-danger')).toBe(true);
        });

        it('preset variants are applied', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { type: 'error' });

            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState.classList.contains('funky-empty-state-variant-danger')).toBe(true);
        });

    });

    describe('Actions', function() {

        it('renders primary action button', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, {
                title: 'Title',
                action: {
                    text: 'Click Me'
                }
            });

            var actionBtn = container.querySelector('.funky-empty-state-action');
            expect(actionBtn).not.toBeNull();
            expect(actionBtn.textContent).toContain('Click Me');
        });

        it('action button has icon when specified', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, {
                title: 'Title',
                action: {
                    text: 'Add',
                    icon: 'fa-plus'
                }
            });

            var actionBtn = container.querySelector('.funky-empty-state-action');
            var icon = actionBtn.querySelector('.fa-plus');
            expect(icon).not.toBeNull();
        });

        it('primary action onClick is called', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');
            var clicked = false;

            EmptyState.show(container, {
                title: 'Title',
                action: {
                    text: 'Click',
                    onClick: function() {
                        clicked = true;
                    }
                }
            });

            var actionBtn = container.querySelector('.funky-empty-state-action');
            FunkyTests.simulate.click(actionBtn);

            expect(clicked).toBe(true);
        });

        it('renders secondary action', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, {
                title: 'Title',
                secondaryAction: {
                    text: 'Learn More'
                }
            });

            var secondary = container.querySelector('.funky-empty-state-secondary');
            expect(secondary).not.toBeNull();
            expect(secondary.textContent).toBe('Learn More');
        });

        it('secondary action with href is a link', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, {
                title: 'Title',
                secondaryAction: {
                    text: 'Help',
                    href: '/help'
                }
            });

            var secondary = container.querySelector('.funky-empty-state-secondary');
            expect(secondary.tagName).toBe('A');
            expect(secondary.getAttribute('href')).toBe('/help');
        });

        it('secondary action onClick is called', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');
            var clicked = false;

            EmptyState.show(container, {
                title: 'Title',
                secondaryAction: {
                    text: 'Click',
                    onClick: function() {
                        clicked = true;
                    }
                }
            });

            var secondary = container.querySelector('.funky-empty-state-secondary');
            FunkyTests.simulate.click(secondary);

            expect(clicked).toBe(true);
        });

    });

    describe('Icons', function() {

        it('supports FontAwesome icons', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title', icon: 'fa-inbox' });

            var icon = container.querySelector('.fa-inbox');
            expect(icon).not.toBeNull();
        });

        it('supports image URLs', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title', icon: '/images/empty.png' });

            var img = container.querySelector('.funky-empty-state-icon img');
            expect(img).not.toBeNull();
            expect(img.getAttribute('src')).toBe('/images/empty.png');
        });

    });

    describe('Animation', function() {

        it('adds animate-in class by default', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title' });

            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState.classList.contains('animate-in')).toBe(true);
        });

        it('animation can be disabled', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'Title', animate: false });

            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState.classList.contains('animate-in')).toBe(false);
        });

    });

    describe('Bindable Interface', function() {

        it('setData() shows empty state', function() {
            fixture.html('<div id="test-container"></div>');

            EmptyState.setData('test-container', { title: 'Set via data' });

            var container = fixture.query('#test-container');
            var emptyState = container.querySelector('.funky-empty-state');
            expect(emptyState).not.toBeNull();
        });

        it('getData() returns current options', function() {
            fixture.html('<div id="test-container"></div>');

            EmptyState.setData('test-container', { title: 'Test Title', message: 'Test Message' });

            var data = EmptyState.getData('test-container');
            expect(data).not.toBeNull();
            expect(data.title).toBe('Test Title');
            expect(data.message).toBe('Test Message');
        });

        it('getData() returns null when not showing', function() {
            fixture.html('<div id="empty-container"></div>');

            var data = EmptyState.getData('empty-container');
            expect(data).toBeNull();
        });

    });

    describe('Multiple instances', function() {

        it('show() replaces existing empty state', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            EmptyState.show(container, { title: 'First' });
            EmptyState.show(container, { title: 'Second' });

            var titles = container.querySelectorAll('.funky-empty-state-title');
            expect(titles.length).toBe(1);
            expect(titles[0].textContent).toBe('Second');
        });

    });

});
