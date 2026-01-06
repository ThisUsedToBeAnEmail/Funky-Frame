/**
 * Funky.ToggleGroup - Unit Tests
 * Tests for toggle group initialization, selection, keyboard navigation, and events
 */
FunkyTests.describe('Funky.Component.ToggleGroup', function() {
    'use strict';

    var ToggleGroup;
    var testContainer;
    var instance;

    var testOptions = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
        { value: 'c', label: 'Option C', disabled: true }
    ];

    FunkyTests.beforeEach(function() {
        ToggleGroup = Funky.ToggleGroup;

        // Create test container
        testContainer = document.createElement('div');
        testContainer.id = 'toggle-group-test-' + Date.now();
        document.body.appendChild(testContainer);
    });

    FunkyTests.afterEach(function() {
        // Destroy instance
        if (instance && instance.destroy) {
            instance.destroy();
            instance = null;
        }

        // Remove test container
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    FunkyTests.describe('Registration', function() {

        FunkyTests.it('should be registered with Funky namespace', function() {
            FunkyTests.expect(Funky.ToggleGroup).toBeDefined();
        });

        FunkyTests.it('should expose init method', function() {
            FunkyTests.expect(typeof ToggleGroup.init).toBe('function');
        });

        FunkyTests.it('should expose getInstance method', function() {
            FunkyTests.expect(typeof ToggleGroup.getInstance).toBe('function');
        });

        FunkyTests.it('should expose destroyAll method', function() {
            FunkyTests.expect(typeof ToggleGroup.destroyAll).toBe('function');
        });

        FunkyTests.it('should expose initAll method', function() {
            FunkyTests.expect(typeof ToggleGroup.initAll).toBe('function');
        });

    });

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    FunkyTests.describe('Initialization', function() {

        FunkyTests.it('should create instance', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            FunkyTests.expect(instance).toBeTruthy();
        });

        FunkyTests.it('should render buttons for each option', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons.length).toBe(3);
        });

        FunkyTests.it('should apply initial value', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'b'
            });
            FunkyTests.expect(instance.getValue()).toBe('b');
        });

        FunkyTests.it('should apply container class', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            FunkyTests.expect(testContainer.classList.contains('funky-toggle-group')).toBe(true);
        });

        FunkyTests.it('should set role attribute', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'single',
                options: testOptions
            });
            FunkyTests.expect(testContainer.getAttribute('role')).toBe('radiogroup');
        });

        FunkyTests.it('should apply size class', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                size: 'lg'
            });
            FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--lg')).toBe(true);
        });

    });

    // =========================================================================
    // SINGLE SELECT MODE
    // =========================================================================

    FunkyTests.describe('Single Select Mode', function() {

        FunkyTests.it('should select one value', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'single',
                options: testOptions,
                value: 'a'
            });
            FunkyTests.expect(instance.getValue()).toBe('a');
        });

        FunkyTests.it('should change value on click', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'single',
                options: testOptions,
                value: 'a'
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].click();
            FunkyTests.expect(instance.getValue()).toBe('b');
        });

        FunkyTests.it('should not deselect when allowEmpty is false', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'single',
                options: testOptions,
                value: 'a',
                allowEmpty: false
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[0].click();
            FunkyTests.expect(instance.getValue()).toBe('a');
        });

        FunkyTests.it('should deselect when allowEmpty is true', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'single',
                options: testOptions,
                value: 'a',
                allowEmpty: true
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[0].click();
            FunkyTests.expect(instance.getValue()).toBe(null);
        });

        FunkyTests.it('should update active class on selection', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'single',
                options: testOptions,
                value: 'a'
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[0].classList.contains('funky-toggle-group__btn--active')).toBe(true);

            buttons[1].click();
            FunkyTests.expect(buttons[0].classList.contains('funky-toggle-group__btn--active')).toBe(false);
            FunkyTests.expect(buttons[1].classList.contains('funky-toggle-group__btn--active')).toBe(true);
        });

    });

    // =========================================================================
    // MULTIPLE SELECT MODE
    // =========================================================================

    FunkyTests.describe('Multiple Select Mode', function() {

        FunkyTests.it('should return array value', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'multiple',
                options: testOptions,
                value: ['a']
            });
            FunkyTests.expect(Array.isArray(instance.getValue())).toBe(true);
        });

        FunkyTests.it('should toggle values on click', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'multiple',
                options: testOptions,
                value: ['a']
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].click();

            var value = instance.getValue();
            FunkyTests.expect(value.indexOf('a') !== -1).toBe(true);
            FunkyTests.expect(value.indexOf('b') !== -1).toBe(true);
        });

        FunkyTests.it('should remove value on second click', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'multiple',
                options: testOptions,
                value: ['a', 'b']
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[0].click();

            var value = instance.getValue();
            FunkyTests.expect(value.indexOf('a') === -1).toBe(true);
            FunkyTests.expect(value.indexOf('b') !== -1).toBe(true);
        });

        FunkyTests.it('should allow empty selection', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'multiple',
                options: testOptions,
                value: ['a']
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[0].click();
            FunkyTests.expect(instance.getValue().length).toBe(0);
        });

        FunkyTests.it('should set role="group" in multiple mode', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'multiple',
                options: testOptions
            });
            FunkyTests.expect(testContainer.getAttribute('role')).toBe('group');
        });

    });

    // =========================================================================
    // DISABLED STATE
    // =========================================================================

    FunkyTests.describe('Disabled State', function() {

        FunkyTests.it('should disable entire group', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                disabled: true
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons.forEach(function(btn) {
                FunkyTests.expect(btn.disabled).toBe(true);
            });
        });

        FunkyTests.it('should disable individual option', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[2].disabled).toBe(true);
        });

        FunkyTests.it('should not select disabled option', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'a'
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[2].click();
            FunkyTests.expect(instance.getValue()).toBe('a');
        });

        FunkyTests.it('should set aria-disabled on disabled buttons', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[2].getAttribute('aria-disabled')).toBe('true');
        });

    });

    // =========================================================================
    // FORM INTEGRATION
    // =========================================================================

    FunkyTests.describe('Form Integration', function() {

        FunkyTests.it('should create hidden input when name provided', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                name: 'test_field'
            });
            var input = testContainer.querySelector('input[type="hidden"]');
            FunkyTests.expect(input).toBeTruthy();
            FunkyTests.expect(input.name).toBe('test_field');
        });

        FunkyTests.it('should update hidden input on change', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                name: 'test_field',
                value: 'a'
            });
            var input = testContainer.querySelector('input[type="hidden"]');
            FunkyTests.expect(input.value).toBe('a');

            instance.setValue('b');
            FunkyTests.expect(input.value).toBe('b');
        });

        FunkyTests.it('should serialize array in multiple mode', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'multiple',
                options: testOptions,
                name: 'test_field',
                value: ['a', 'b']
            });
            var input = testContainer.querySelector('input[type="hidden"]');
            FunkyTests.expect(input.value).toBe('["a","b"]');
        });

        FunkyTests.it('should not create hidden input without name', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            var input = testContainer.querySelector('input[type="hidden"]');
            FunkyTests.expect(input).toBe(null);
        });

    });

    // =========================================================================
    // METHODS
    // =========================================================================

    FunkyTests.describe('Public Methods', function() {

        FunkyTests.it('setValue should update selection', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'a'
            });
            instance.setValue('b');
            FunkyTests.expect(instance.getValue()).toBe('b');
        });

        FunkyTests.it('getOptions should return options array', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            var options = instance.getOptions();
            FunkyTests.expect(options.length).toBe(3);
            FunkyTests.expect(options[0].value).toBe('a');
        });

        FunkyTests.it('setOptions should replace options', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            instance.setOptions([
                { value: 'x', label: 'X' },
                { value: 'y', label: 'Y' }
            ]);
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons.length).toBe(2);
        });

        FunkyTests.it('disable should disable all buttons', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            instance.disable();
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[0].disabled).toBe(true);
            FunkyTests.expect(buttons[1].disabled).toBe(true);
        });

        FunkyTests.it('enable should enable buttons', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                disabled: true
            });
            instance.enable();
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[0].disabled).toBe(false);
            FunkyTests.expect(buttons[1].disabled).toBe(false);
            // Option c is still disabled
            FunkyTests.expect(buttons[2].disabled).toBe(true);
        });

        FunkyTests.it('disableOption should disable single option', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            instance.disableOption('a');
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[0].disabled).toBe(true);
            FunkyTests.expect(buttons[1].disabled).toBe(false);
        });

        FunkyTests.it('enableOption should enable single option', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            instance.enableOption('c');
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[2].disabled).toBe(false);
        });

    });

    // =========================================================================
    // EVENTS
    // =========================================================================

    FunkyTests.describe('Events', function() {

        FunkyTests.it('should fire change event', function() {
            var fired = false;
            var eventValue;

            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'a'
            });

            testContainer.addEventListener('togglegroup:change', function(e) {
                fired = true;
                eventValue = e.detail.value;
            });

            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].click();

            FunkyTests.expect(fired).toBe(true);
            FunkyTests.expect(eventValue).toBe('b');
        });

        FunkyTests.it('should include previous value in event', function() {
            var previousValue;

            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'a'
            });

            testContainer.addEventListener('togglegroup:change', function(e) {
                previousValue = e.detail.previous;
            });

            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].click();

            FunkyTests.expect(previousValue).toBe('a');
        });

        FunkyTests.it('should call onChange callback', function() {
            var callbackValue;

            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'a',
                onChange: function(value) {
                    callbackValue = value;
                }
            });

            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].click();

            FunkyTests.expect(callbackValue).toBe('b');
        });

        FunkyTests.it('should include option in callback', function() {
            var callbackOption;

            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'a',
                onChange: function(value, option) {
                    callbackOption = option;
                }
            });

            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].click();

            FunkyTests.expect(callbackOption.value).toBe('b');
            FunkyTests.expect(callbackOption.label).toBe('Option B');
        });

    });

    // =========================================================================
    // ACCESSIBILITY
    // =========================================================================

    FunkyTests.describe('Accessibility', function() {

        FunkyTests.it('should have radiogroup role in single mode', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'single',
                options: testOptions
            });
            FunkyTests.expect(testContainer.getAttribute('role')).toBe('radiogroup');
        });

        FunkyTests.it('should have group role in multiple mode', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'multiple',
                options: testOptions
            });
            FunkyTests.expect(testContainer.getAttribute('role')).toBe('group');
        });

        FunkyTests.it('should have radio role on buttons in single mode', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'single',
                options: testOptions
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[0].getAttribute('role')).toBe('radio');
        });

        FunkyTests.it('should have checkbox role on buttons in multiple mode', function() {
            instance = ToggleGroup.init(testContainer, {
                mode: 'multiple',
                options: testOptions
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[0].getAttribute('role')).toBe('checkbox');
        });

        FunkyTests.it('should have aria-checked on buttons', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'a'
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons[0].getAttribute('aria-checked')).toBe('true');
            FunkyTests.expect(buttons[1].getAttribute('aria-checked')).toBe('false');
        });

        FunkyTests.it('should update aria-checked on selection', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'a'
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].click();
            FunkyTests.expect(buttons[0].getAttribute('aria-checked')).toBe('false');
            FunkyTests.expect(buttons[1].getAttribute('aria-checked')).toBe('true');
        });

        FunkyTests.it('should have aria-label on container', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                label: 'View mode'
            });
            FunkyTests.expect(testContainer.getAttribute('aria-label')).toBe('View mode');
        });

    });

    // =========================================================================
    // KEYBOARD NAVIGATION
    // =========================================================================

    FunkyTests.describe('Keyboard Navigation', function() {

        FunkyTests.it('should have roving tabindex', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions,
                value: 'b'
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');

            // Selected button should have tabindex 0
            FunkyTests.expect(buttons[1].tabIndex).toBe(0);
        });

        FunkyTests.it('should move focus with ArrowRight', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions.slice(0, 2) // Only non-disabled options
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[0].focus();

            var event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
            testContainer.dispatchEvent(event);

            FunkyTests.expect(document.activeElement).toBe(buttons[1]);
        });

        FunkyTests.it('should move focus with ArrowLeft', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions.slice(0, 2)
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].focus();

            var event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
            testContainer.dispatchEvent(event);

            FunkyTests.expect(document.activeElement).toBe(buttons[0]);
        });

        FunkyTests.it('should wrap focus at boundaries', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions.slice(0, 2)
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].focus();

            var event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
            testContainer.dispatchEvent(event);

            FunkyTests.expect(document.activeElement).toBe(buttons[0]);
        });

        FunkyTests.it('should focus first with Home key', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions.slice(0, 2)
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].focus();

            var event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
            testContainer.dispatchEvent(event);

            FunkyTests.expect(document.activeElement).toBe(buttons[0]);
        });

        FunkyTests.it('should focus last with End key', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions.slice(0, 2)
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[0].focus();

            var event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
            testContainer.dispatchEvent(event);

            FunkyTests.expect(document.activeElement).toBe(buttons[1]);
        });

        FunkyTests.it('should select with Space key', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions.slice(0, 2),
                value: 'a'
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].focus();

            var event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
            testContainer.dispatchEvent(event);

            FunkyTests.expect(instance.getValue()).toBe('b');
        });

        FunkyTests.it('should select with Enter key', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions.slice(0, 2),
                value: 'a'
            });
            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            buttons[1].focus();

            var event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            testContainer.dispatchEvent(event);

            FunkyTests.expect(instance.getValue()).toBe('b');
        });

    });

    // =========================================================================
    // DATA ATTRIBUTES
    // =========================================================================

    FunkyTests.describe('Data Attributes', function() {

        FunkyTests.it('should parse options from data-options', function() {
            testContainer.setAttribute('data-options', JSON.stringify(testOptions));
            instance = ToggleGroup.init(testContainer, {});

            var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
            FunkyTests.expect(buttons.length).toBe(3);
        });

        FunkyTests.it('should parse value from data-value', function() {
            testContainer.setAttribute('data-options', JSON.stringify(testOptions));
            testContainer.setAttribute('data-value', 'b');
            instance = ToggleGroup.init(testContainer, {});

            FunkyTests.expect(instance.getValue()).toBe('b');
        });

        FunkyTests.it('should parse name from data-name', function() {
            testContainer.setAttribute('data-options', JSON.stringify(testOptions));
            testContainer.setAttribute('data-name', 'my_field');
            instance = ToggleGroup.init(testContainer, {});

            var input = testContainer.querySelector('input[type="hidden"]');
            FunkyTests.expect(input.name).toBe('my_field');
        });

        FunkyTests.it('should parse mode from data-mode', function() {
            testContainer.setAttribute('data-options', JSON.stringify(testOptions));
            testContainer.setAttribute('data-mode', 'multiple');
            instance = ToggleGroup.init(testContainer, {});

            FunkyTests.expect(testContainer.getAttribute('role')).toBe('group');
        });

    });

    // =========================================================================
    // CLEANUP
    // =========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('should cleanup on destroy', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            var id = instance.id;

            instance.destroy();

            FunkyTests.expect(ToggleGroup.getInstance(id)).toBe(null);
            FunkyTests.expect(testContainer.innerHTML).toBe('');
        });

        FunkyTests.it('should remove container classes on destroy', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });

            instance.destroy();

            FunkyTests.expect(testContainer.className).toBe('');
        });

        FunkyTests.it('should remove role attribute on destroy', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });

            instance.destroy();

            FunkyTests.expect(testContainer.getAttribute('role')).toBe(null);
        });

    });

    // =========================================================================
    // STATIC METHODS
    // =========================================================================

    FunkyTests.describe('Static Methods', function() {

        FunkyTests.it('getInstance should return instance by ID', function() {
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });
            var id = instance.id;

            var found = ToggleGroup.getInstance(id);
            FunkyTests.expect(found).toBe(instance);
        });

        FunkyTests.it('getInstance should return instance by selector', function() {
            testContainer.id = 'test-toggle-selector';
            instance = ToggleGroup.init(testContainer, {
                options: testOptions
            });

            var found = ToggleGroup.getInstance('#test-toggle-selector');
            FunkyTests.expect(found).toBe(instance);
        });

        FunkyTests.it('initAll should initialize from data attributes', function() {
            var div1 = document.createElement('div');
            div1.setAttribute('data-toggle-group', '');
            div1.setAttribute('data-options', JSON.stringify([{ value: 'x', label: 'X' }]));
            document.body.appendChild(div1);

            var instances = ToggleGroup.initAll();

            FunkyTests.expect(instances.length).toBeGreaterThan(0);

            // Cleanup
            instances.forEach(function(inst) {
                inst.destroy();
            });
            if (div1.parentNode) {
                div1.parentNode.removeChild(div1);
            }
        });

    });

    // =========================================================================
    // VISUAL OPTIONS (Phase 2)
    // =========================================================================

    FunkyTests.describe('Visual Options', function() {

        FunkyTests.describe('Size Variants', function() {

            FunkyTests.it('should apply sm size class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    size: 'sm'
                });
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--sm')).toBe(true);
            });

            FunkyTests.it('should apply lg size class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    size: 'lg'
                });
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--lg')).toBe(true);
            });

            FunkyTests.it('setSize should change size at runtime', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    size: 'md'
                });
                instance.setSize('lg');
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--lg')).toBe(true);
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--md')).toBe(false);
            });

            FunkyTests.it('setSize should reject invalid sizes', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    size: 'md'
                });
                instance.setSize('invalid');
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--md')).toBe(true);
            });

        });

        FunkyTests.describe('Variant Styles', function() {

            FunkyTests.it('should apply outline variant', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    variant: 'outline'
                });
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--outline')).toBe(true);
            });

            FunkyTests.it('should apply pills variant', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    variant: 'pills'
                });
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--pills')).toBe(true);
            });

            FunkyTests.it('setVariant should change variant at runtime', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    variant: 'default'
                });
                instance.setVariant('pills');
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--pills')).toBe(true);
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--default')).toBe(false);
            });

            FunkyTests.it('setVariant should reject invalid variants', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    variant: 'default'
                });
                instance.setVariant('invalid');
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--default')).toBe(true);
            });

        });

        FunkyTests.describe('Icon-Only Mode', function() {

            FunkyTests.it('should apply icon-only class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A', icon: 'fa-star' }
                    ],
                    iconOnly: true
                });
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--icon-only')).toBe(true);
            });

            FunkyTests.it('should set aria-label for icon-only buttons', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'Option A', icon: 'fa-star' }
                    ],
                    iconOnly: true
                });
                var btn = testContainer.querySelector('.funky-toggle-group__btn');
                FunkyTests.expect(btn.getAttribute('aria-label')).toBe('Option A');
            });

            FunkyTests.it('should set title for icon-only buttons', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'Option A', icon: 'fa-star' }
                    ],
                    iconOnly: true
                });
                var btn = testContainer.querySelector('.funky-toggle-group__btn');
                FunkyTests.expect(btn.getAttribute('title')).toBe('Option A');
            });

        });

        FunkyTests.describe('Orientation', function() {

            FunkyTests.it('should apply vertical class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    orientation: 'vertical'
                });
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--vertical')).toBe(true);
            });

            FunkyTests.it('setOrientation should add vertical class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    orientation: 'horizontal'
                });
                instance.setOrientation('vertical');
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--vertical')).toBe(true);
            });

            FunkyTests.it('setOrientation should remove vertical class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    orientation: 'vertical'
                });
                instance.setOrientation('horizontal');
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--vertical')).toBe(false);
            });

        });

        FunkyTests.describe('Equal Width', function() {

            FunkyTests.it('should apply equal width class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    equalWidth: true
                });
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--equal')).toBe(true);
            });

        });

        FunkyTests.describe('Responsive', function() {

            FunkyTests.it('should apply responsive class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    responsive: true
                });
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--responsive')).toBe(true);
            });

        });

        FunkyTests.describe('Loading State', function() {

            FunkyTests.it('setLoading should add loading class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions
                });
                instance.setLoading(true);
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--loading')).toBe(true);
            });

            FunkyTests.it('setLoading should remove loading class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions
                });
                instance.setLoading(true);
                instance.setLoading(false);
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--loading')).toBe(false);
            });

        });

    });

    // =========================================================================
    // PHASE 3: ADVANCED FEATURES
    // =========================================================================

    FunkyTests.describe('Advanced Features (Phase 3)', function() {

        FunkyTests.describe('Loading State', function() {

            FunkyTests.it('should show loading state initially when loading: true', function() {
                instance = ToggleGroup.init(testContainer, {
                    loading: true,
                    options: []
                });
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--loading')).toBe(true);
                FunkyTests.expect(testContainer.getAttribute('aria-busy')).toBe('true');
            });

            FunkyTests.it('should render skeleton placeholders when loading', function() {
                instance = ToggleGroup.init(testContainer, {
                    loading: true,
                    loadingSkeletons: 4,
                    options: []
                });
                var skeletons = testContainer.querySelectorAll('.funky-toggle-group__skeleton');
                FunkyTests.expect(skeletons.length).toBe(4);
            });

            FunkyTests.it('should include screen reader text when loading', function() {
                instance = ToggleGroup.init(testContainer, {
                    loading: true,
                    loadingText: 'Loading filters...',
                    options: []
                });
                var srText = testContainer.querySelector('.visually-hidden');
                FunkyTests.expect(srText).toBeDefined();
                FunkyTests.expect(srText.textContent).toBe('Loading filters...');
            });

            FunkyTests.it('setLoading(false) should render options and remove loading state', function() {
                instance = ToggleGroup.init(testContainer, {
                    loading: true,
                    options: testOptions
                });
                instance.setLoading(false);
                FunkyTests.expect(testContainer.classList.contains('funky-toggle-group--loading')).toBe(false);
                FunkyTests.expect(testContainer.getAttribute('aria-busy')).toBe('false');
                var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
                FunkyTests.expect(buttons.length).toBe(testOptions.length);
            });

            FunkyTests.it('isLoading should return current loading state', function() {
                instance = ToggleGroup.init(testContainer, {
                    loading: true,
                    options: []
                });
                FunkyTests.expect(instance.isLoading()).toBe(true);
                instance.setLoading(false);
                FunkyTests.expect(instance.isLoading()).toBe(false);
            });

        });

        FunkyTests.describe('Badges', function() {

            FunkyTests.it('should render badges on options', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A', badge: 5 },
                        { value: 'b', label: 'B', badge: 10 }
                    ]
                });
                var badges = testContainer.querySelectorAll('.funky-toggle-group__badge');
                FunkyTests.expect(badges.length).toBe(2);
                FunkyTests.expect(badges[0].textContent).toBe('5');
                FunkyTests.expect(badges[1].textContent).toBe('10');
            });

            FunkyTests.it('should apply badge variant class', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A', badge: 5, badgeVariant: 'success' }
                    ]
                });
                var badge = testContainer.querySelector('.funky-toggle-group__badge');
                FunkyTests.expect(badge.classList.contains('funky-toggle-group__badge--success')).toBe(true);
            });

            FunkyTests.it('updateBadge should change badge value', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A', badge: 5 }
                    ]
                });
                instance.updateBadge('a', 99);
                var badge = testContainer.querySelector('.funky-toggle-group__badge');
                FunkyTests.expect(badge.textContent).toBe('99');
            });

            FunkyTests.it('updateBadge should add badge if none exists', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A' }
                    ]
                });
                instance.updateBadge('a', 42);
                var badge = testContainer.querySelector('.funky-toggle-group__badge');
                FunkyTests.expect(badge).toBeDefined();
                FunkyTests.expect(badge.textContent).toBe('42');
            });

            FunkyTests.it('updateBadge should hide badge when value is 0 with hide option', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A', badge: 5 }
                    ]
                });
                instance.updateBadge('a', 0, { hide: true });
                var badge = testContainer.querySelector('.funky-toggle-group__badge');
                FunkyTests.expect(badge).toBe(null);
            });

            FunkyTests.it('updateBadge should update variant', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A', badge: 5 }
                    ]
                });
                instance.updateBadge('a', 5, { variant: 'danger' });
                var badge = testContainer.querySelector('.funky-toggle-group__badge');
                FunkyTests.expect(badge.classList.contains('funky-toggle-group__badge--danger')).toBe(true);
            });

        });

        FunkyTests.describe('Separators', function() {

            FunkyTests.it('should render separator element', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A' },
                        { type: 'separator' },
                        { value: 'b', label: 'B' }
                    ]
                });
                var separator = testContainer.querySelector('.funky-toggle-group__separator');
                FunkyTests.expect(separator).toBeDefined();
            });

            FunkyTests.it('separator should have aria-hidden', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A' },
                        { type: 'separator' },
                        { value: 'b', label: 'B' }
                    ]
                });
                var separator = testContainer.querySelector('.funky-toggle-group__separator');
                FunkyTests.expect(separator.getAttribute('aria-hidden')).toBe('true');
            });

            FunkyTests.it('separator should not create button', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A' },
                        { type: 'separator' },
                        { value: 'b', label: 'B' }
                    ]
                });
                var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
                FunkyTests.expect(buttons.length).toBe(2);
            });

        });

        FunkyTests.describe('Grouped Options', function() {

            FunkyTests.it('should add data-group attribute to buttons', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A', group: 'letters' },
                        { value: 'b', label: 'B', group: 'letters' }
                    ]
                });
                var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
                FunkyTests.expect(buttons[0].getAttribute('data-group')).toBe('letters');
                FunkyTests.expect(buttons[1].getAttribute('data-group')).toBe('letters');
            });

            FunkyTests.it('groupBehavior single should allow only one per group in multiple mode', function() {
                instance = ToggleGroup.init(testContainer, {
                    mode: 'multiple',
                    groupBehavior: 'single',
                    options: [
                        { value: 'a', label: 'A', group: 'letters' },
                        { value: 'b', label: 'B', group: 'letters' },
                        { value: '1', label: '1', group: 'numbers' }
                    ],
                    value: ['a', '1']
                });

                // Click 'b' which is in same group as 'a'
                var buttons = testContainer.querySelectorAll('.funky-toggle-group__btn');
                buttons[1].click();

                var value = instance.getValue();
                FunkyTests.expect(value.indexOf('a')).toBe(-1); // 'a' should be removed
                FunkyTests.expect(value.indexOf('b') !== -1).toBe(true); // 'b' should be added
                FunkyTests.expect(value.indexOf('1') !== -1).toBe(true); // '1' should remain
            });

        });

        FunkyTests.describe('Custom Render', function() {

            FunkyTests.it('should use custom renderOption function', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'custom', label: 'Custom', extra: 'data' }
                    ],
                    renderOption: function(option, isActive, isDisabled) {
                        var span = document.createElement('span');
                        span.className = 'custom-content';
                        span.textContent = option.extra;
                        return span;
                    }
                });
                var customContent = testContainer.querySelector('.custom-content');
                FunkyTests.expect(customContent).toBeDefined();
                FunkyTests.expect(customContent.textContent).toBe('data');
            });

            FunkyTests.it('renderOption should receive isActive state', function() {
                var receivedIsActive = null;
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A' }
                    ],
                    value: 'a',
                    renderOption: function(option, isActive, isDisabled) {
                        receivedIsActive = isActive;
                        return document.createElement('span');
                    }
                });
                FunkyTests.expect(receivedIsActive).toBe(true);
            });

            FunkyTests.it('renderOption should still allow badges', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A', badge: 5 }
                    ],
                    renderOption: function(option) {
                        var span = document.createElement('span');
                        span.textContent = option.label;
                        return span;
                    }
                });
                var badge = testContainer.querySelector('.funky-toggle-group__badge');
                FunkyTests.expect(badge).toBeDefined();
                FunkyTests.expect(badge.textContent).toBe('5');
            });

        });

        FunkyTests.describe('Required Validation', function() {

            FunkyTests.it('should add required attribute to hidden input', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    name: 'view',
                    required: true
                });
                var hidden = testContainer.querySelector('input[type="hidden"]');
                FunkyTests.expect(hidden.required).toBe(true);
            });

        });

        FunkyTests.describe('LiveBinding Interface', function() {

            FunkyTests.it('setData should update value', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    value: 'a'
                });
                instance.setData({ value: 'b' });
                FunkyTests.expect(instance.getValue()).toBe('b');
            });

            FunkyTests.it('setData should update disabled state', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions
                });
                instance.setData({ disabled: true });
                FunkyTests.expect(testContainer.getAttribute('aria-disabled')).toBe('true');
            });

            FunkyTests.it('setData should update badges', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: [
                        { value: 'a', label: 'A', badge: 5 },
                        { value: 'b', label: 'B', badge: 10 }
                    ]
                });
                instance.setData({
                    badges: { a: 99, b: 0 }
                });
                var badges = testContainer.querySelectorAll('.funky-toggle-group__badge');
                FunkyTests.expect(badges[0].textContent).toBe('99');
                FunkyTests.expect(badges[1].textContent).toBe('0');
            });

            FunkyTests.it('getData should return current state', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions,
                    value: 'b'
                });
                var data = instance.getData();
                FunkyTests.expect(data.value).toBe('b');
                FunkyTests.expect(data.options.length).toBe(testOptions.length);
                FunkyTests.expect(data.disabled).toBe(false);
            });

            FunkyTests.it('getData should include disabled options', function() {
                instance = ToggleGroup.init(testContainer, {
                    options: testOptions
                });
                var data = instance.getData();
                FunkyTests.expect(data.disabledOptions.length).toBe(1);
                FunkyTests.expect(data.disabledOptions[0]).toBe('c');
            });

        });

    });

});
