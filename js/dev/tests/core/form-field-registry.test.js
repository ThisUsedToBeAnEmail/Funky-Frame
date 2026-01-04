/**
 * Form Field Registry Unit Tests
 *
 * Tests for Funky.Form.FieldRegistry and BaseField class.
 */

describe('Funky.Core.Form.FieldRegistry', function() {

    var FieldRegistry = Funky.Form.FieldRegistry;
    var BaseField = Funky.Form.BaseField;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
        fixture.html('<div id="field-container"></div>');
    });

    afterEach(function() {
        fixture.cleanup();
    });

    describe('Module registration', function() {

        it('is registered with Funky.Form', function() {
            expect(Funky.Form.FieldRegistry).toBeDefined();
        });

        it('exposes BaseField class', function() {
            expect(Funky.Form.BaseField).toBeDefined();
            expect(typeof Funky.Form.BaseField).toBe('function');
        });

        it('has static methods', function() {
            expect(typeof FieldRegistry.register).toBe('function');
            expect(typeof FieldRegistry.get).toBe('function');
            expect(typeof FieldRegistry.has).toBe('function');
            expect(typeof FieldRegistry.create).toBe('function');
            expect(typeof FieldRegistry.types).toBe('function');
        });

    });

    describe('Built-in field types', function() {

        it('has text type registered', function() {
            expect(FieldRegistry.has('text')).toBe(true);
        });

        it('has email type registered', function() {
            expect(FieldRegistry.has('email')).toBe(true);
        });

        it('has password type registered', function() {
            expect(FieldRegistry.has('password')).toBe(true);
        });

        it('has number type registered', function() {
            expect(FieldRegistry.has('number')).toBe(true);
        });

        it('has textarea type registered', function() {
            expect(FieldRegistry.has('textarea')).toBe(true);
        });

        it('has checkbox type registered', function() {
            expect(FieldRegistry.has('checkbox')).toBe(true);
        });

        it('has select type registered', function() {
            expect(FieldRegistry.has('select')).toBe(true);
        });

        it('has hidden type registered', function() {
            expect(FieldRegistry.has('hidden')).toBe(true);
        });

        it('has radio type registered', function() {
            expect(FieldRegistry.has('radio')).toBe(true);
        });

        it('has tel type registered', function() {
            expect(FieldRegistry.has('tel')).toBe(true);
        });

        it('has url type registered', function() {
            expect(FieldRegistry.has('url')).toBe(true);
        });

        it('has integer type registered (alias for number)', function() {
            expect(FieldRegistry.has('integer')).toBe(true);
        });

        it('has boolean type registered (alias for checkbox)', function() {
            expect(FieldRegistry.has('boolean')).toBe(true);
        });

        it('types() returns all registered types', function() {
            var types = FieldRegistry.types();
            expect(types).toContain('text');
            expect(types).toContain('email');
            expect(types).toContain('number');
            expect(types).toContain('select');
            expect(types).toContain('tel');
            expect(types).toContain('url');
            expect(types).toContain('integer');
            expect(types).toContain('boolean');
        });

    });

    describe('Field type registration', function() {

        afterEach(function() {
            // Clean up custom registrations
            FieldRegistry.unregister('custom-test');
        });

        it('registers new field type', function() {
            function CustomField(config, form) {
                BaseField.call(this, config, form);
            }
            CustomField.prototype = Object.create(BaseField.prototype);

            FieldRegistry.register('custom-test', {
                class: CustomField
            });

            expect(FieldRegistry.has('custom-test')).toBe(true);
        });

        it('get returns field definition', function() {
            var definition = FieldRegistry.get('text');
            expect(definition).not.toBeNull();
            expect(definition.class).toBeDefined();
        });

        it('get returns null for unknown type', function() {
            var definition = FieldRegistry.get('unknown-type');
            expect(definition).toBeNull();
        });

        it('accepts function as shorthand', function() {
            function ShorthandField(config, form) {
                BaseField.call(this, config, form);
            }

            FieldRegistry.register('custom-test', ShorthandField);

            var definition = FieldRegistry.get('custom-test');
            expect(definition.class).toBe(ShorthandField);
        });

        it('unregister removes field type', function() {
            FieldRegistry.register('custom-test', { class: BaseField });
            expect(FieldRegistry.has('custom-test')).toBe(true);

            FieldRegistry.unregister('custom-test');
            expect(FieldRegistry.has('custom-test')).toBe(false);
        });

    });

    describe('Field creation', function() {

        var mockForm;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: { validateOnBlur: false },
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };
        });

        it('creates field instance', function() {
            var field = FieldRegistry.create('text', {
                name: 'testField',
                label: 'Test Field'
            }, mockForm);

            expect(field).toBeDefined();
            expect(field instanceof BaseField).toBe(true);
        });

        it('falls back to text for unknown type', function() {
            var field = FieldRegistry.create('unknown-type', {
                name: 'testField'
            }, mockForm);

            expect(field).toBeDefined();
        });

        it('applies defaults from definition', function() {
            var field = FieldRegistry.create('textarea', {
                name: 'testField'
            }, mockForm);

            expect(field.config.rows).toBeDefined();
        });

    });

    describe('BaseField class', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: { validateOnBlur: false },
                _onFieldChange: jasmine.createSpy('_onFieldChange'),
                _emit: jasmine.createSpy('_emit'),
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = new BaseField({
                name: 'testField',
                type: 'text',
                label: 'Test Label'
            }, mockForm);
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('initializes with config', function() {
            expect(field.name).toBe('testField');
            expect(field.config.label).toBe('Test Label');
        });

        it('starts with null value', function() {
            expect(field.getValue()).toBeNull();
        });

        it('starts pristine', function() {
            expect(field.isPristine()).toBe(true);
            expect(field.isDirty()).toBe(false);
        });

        it('starts visible', function() {
            expect(field.isVisible()).toBe(true);
        });

        it('starts enabled', function() {
            expect(field.isEnabled()).toBe(true);
        });

    });

    describe('BaseField.render()', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: { validateOnBlur: false },
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = new BaseField({
                name: 'testField',
                type: 'text',
                label: 'Test Label',
                required: true,
                help: 'Enter a value'
            }, mockForm);
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders field element', function() {
            var el = field.render();

            expect(el).not.toBeNull();
            expect(el.classList.contains('funky-form-field')).toBe(true);
        });

        it('renders label', function() {
            var el = field.render();

            var label = el.querySelector('.funky-form-label');
            expect(label).not.toBeNull();
            expect(label.textContent).toContain('Test Label');
        });

        it('renders required indicator', function() {
            var el = field.render();

            var required = el.querySelector('.funky-form-required');
            expect(required).not.toBeNull();
        });

        it('renders input', function() {
            var el = field.render();

            expect(field.inputElement).not.toBeNull();
            expect(field.inputElement.tagName.toLowerCase()).toBe('input');
        });

        it('renders help text', function() {
            var el = field.render();

            var help = el.querySelector('.funky-form-help');
            expect(help).not.toBeNull();
            expect(help.textContent).toBe('Enter a value');
        });

        it('renders error container', function() {
            var el = field.render();

            expect(field.errorElement).not.toBeNull();
            expect(field.errorElement.classList.contains('funky-form-errors')).toBe(true);
        });

        it('sets data-field attribute', function() {
            var el = field.render();

            expect(el.getAttribute('data-field')).toBe('testField');
        });

        it('sets proper ARIA attributes', function() {
            var el = field.render();

            var input = field.inputElement;
            expect(input.getAttribute('aria-describedby')).toContain('test-form-testField-error');
        });

    });

    describe('BaseField value management', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: { validateOnBlur: false },
                _onFieldChange: jasmine.createSpy('_onFieldChange'),
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = new BaseField({
                name: 'testField',
                type: 'text'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('setValue updates value', function() {
            field.setValue('test value');

            expect(field.getValue()).toBe('test value');
        });

        it('setValue updates input element', function() {
            field.setValue('test value');

            expect(field.inputElement.value).toBe('test value');
        });

        it('setValue marks field dirty', function() {
            field.setValue('test value');

            expect(field.isDirty()).toBe(true);
            expect(field.isPristine()).toBe(false);
        });

        it('setValue emits change event', function() {
            field.setValue('test value');

            expect(mockForm._onFieldChange).toHaveBeenCalledWith('testField', 'test value');
        });

        it('setValue with silent option does not emit', function() {
            field.setValue('test value', { silent: true });

            expect(mockForm._onFieldChange).not.toHaveBeenCalled();
        });

        it('reset restores default value', function() {
            field.setValue('changed');
            field.reset();

            expect(field.getValue()).toBeNull();
            expect(field.isPristine()).toBe(true);
        });

    });

    describe('BaseField visibility', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = new BaseField({
                name: 'testField',
                type: 'text'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('hide hides the field', function() {
            field.hide();

            expect(field.isVisible()).toBe(false);
            expect(field.element.style.display).toBe('none');
            expect(field.element.classList.contains('funky-form-field--hidden')).toBe(true);
        });

        it('show shows hidden field', function() {
            field.hide();
            field.show();

            expect(field.isVisible()).toBe(true);
            expect(field.element.style.display).toBe('');
            expect(field.element.classList.contains('funky-form-field--hidden')).toBe(false);
        });

    });

    describe('BaseField enable/disable', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = new BaseField({
                name: 'testField',
                type: 'text'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('disable disables the field', function() {
            field.disable();

            expect(field.isEnabled()).toBe(false);
            expect(field.inputElement.disabled).toBe(true);
            expect(field.element.classList.contains('funky-form-field--disabled')).toBe(true);
        });

        it('enable enables disabled field', function() {
            field.disable();
            field.enable();

            expect(field.isEnabled()).toBe(true);
            expect(field.inputElement.disabled).toBe(false);
            expect(field.element.classList.contains('funky-form-field--disabled')).toBe(false);
        });

    });

    describe('BaseField errors', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = new BaseField({
                name: 'testField',
                type: 'text'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('showError displays error', function() {
            field.showError('This field is required');

            expect(field.isValid()).toBe(false);
            expect(field.element.classList.contains('funky-form-field--error')).toBe(true);
            expect(field.errorElement.textContent).toContain('This field is required');
        });

        it('showError accepts array of errors', function() {
            field.showError(['Error 1', 'Error 2']);

            var messages = field.errorElement.querySelectorAll('.funky-form-error-message');
            expect(messages.length).toBe(2);
        });

        it('clearError removes error', function() {
            field.showError('Error');
            field.clearError();

            expect(field.isValid()).toBe(true);
            expect(field.element.classList.contains('funky-form-field--error')).toBe(false);
            expect(field.errorElement.textContent).toBe('');
        });

        it('showError sets aria-invalid', function() {
            field.showError('Error');

            expect(field.inputElement.getAttribute('aria-invalid')).toBe('true');
        });

        it('clearError removes aria-invalid', function() {
            field.showError('Error');
            field.clearError();

            expect(field.inputElement.getAttribute('aria-invalid')).toBeNull();
        });

    });

    describe('TextField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('text', {
                name: 'testField',
                placeholder: 'Enter text',
                maxLength: 100
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders text input', function() {
            expect(field.inputElement.type).toBe('text');
        });

        it('applies placeholder', function() {
            expect(field.inputElement.placeholder).toBe('Enter text');
        });

        it('applies maxLength', function() {
            expect(field.inputElement.maxLength).toBe(100);
        });

    });

    describe('NumberField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('number', {
                name: 'age',
                min: 0,
                max: 120,
                step: 1
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders number input', function() {
            expect(field.inputElement.type).toBe('number');
        });

        it('applies min/max/step', function() {
            expect(field.inputElement.min).toBe('0');
            expect(field.inputElement.max).toBe('120');
            expect(field.inputElement.step).toBe('1');
        });

        it('parses value as number', function() {
            field.setValue('42');

            expect(field.getValue()).toBe(42);
            expect(typeof field.getValue()).toBe('number');
        });

        it('returns null for empty value', function() {
            field.setValue('');

            expect(field.getValue()).toBeNull();
        });

    });

    describe('CheckboxField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('checkbox', {
                name: 'agree',
                label: 'Terms',
                checkboxLabel: 'I agree to the terms'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders checkbox input', function() {
            expect(field.inputElement.type).toBe('checkbox');
        });

        it('defaults to false', function() {
            expect(field.getValue()).toBe(false);
        });

        it('setValue sets checked state', function() {
            field.setValue(true);

            expect(field.inputElement.checked).toBe(true);
            expect(field.getValue()).toBe(true);
        });

    });

    describe('SelectField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('select', {
                name: 'country',
                placeholder: 'Select a country',
                options: [
                    { value: 'us', label: 'United States' },
                    { value: 'uk', label: 'United Kingdom' },
                    { value: 'ca', label: 'Canada' }
                ]
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders select element', function() {
            expect(field.inputElement.tagName.toLowerCase()).toBe('select');
        });

        it('renders options', function() {
            // +1 for placeholder
            expect(field.inputElement.options.length).toBe(4);
        });

        it('renders placeholder as first option', function() {
            expect(field.inputElement.options[0].textContent).toBe('Select a country');
            expect(field.inputElement.options[0].disabled).toBe(true);
        });

        it('setValue selects option', function() {
            field.setValue('uk');

            expect(field.inputElement.value).toBe('uk');
        });

    });

    describe('TextareaField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('textarea', {
                name: 'bio',
                rows: 5,
                placeholder: 'Tell us about yourself'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders textarea element', function() {
            expect(field.inputElement.tagName.toLowerCase()).toBe('textarea');
        });

        it('applies rows', function() {
            expect(field.inputElement.rows).toBe(5);
        });

        it('applies placeholder', function() {
            expect(field.inputElement.placeholder).toBe('Tell us about yourself');
        });

    });

    describe('TextareaField autoResize', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('textarea', {
                name: 'bio',
                autoResize: true
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('adds autoResize class', function() {
            expect(field.inputElement.classList.contains('funky-form-textarea--autoresize')).toBe(true);
        });

        it('sets overflow to hidden', function() {
            expect(field.inputElement.style.overflow).toBe('hidden');
        });

        it('sets resize to none', function() {
            expect(field.inputElement.style.resize).toBe('none');
        });

    });

    describe('TelField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('tel', {
                name: 'phone',
                placeholder: 'Enter phone number'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders tel input', function() {
            expect(field.inputElement.type).toBe('tel');
        });

        it('applies placeholder', function() {
            expect(field.inputElement.placeholder).toBe('Enter phone number');
        });

    });

    describe('UrlField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('url', {
                name: 'website',
                placeholder: 'https://example.com'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders url input', function() {
            expect(field.inputElement.type).toBe('url');
        });

        it('applies placeholder', function() {
            expect(field.inputElement.placeholder).toBe('https://example.com');
        });

    });

    describe('IntegerField (alias)', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('integer', {
                name: 'count'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders number input', function() {
            expect(field.inputElement.type).toBe('number');
        });

        it('has step 1 by default', function() {
            expect(field.inputElement.step).toBe('1');
        });

    });

    describe('BooleanField (alias)', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('boolean', {
                name: 'active'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders checkbox input', function() {
            expect(field.inputElement.type).toBe('checkbox');
        });

        it('defaults to false', function() {
            expect(field.getValue()).toBe(false);
        });

    });

    describe('Bootstrap classes', function() {

        var mockForm;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };
        });

        it('text field has form-control class', function() {
            var field = FieldRegistry.create('text', { name: 'test' }, mockForm);
            field.render();
            expect(field.inputElement.classList.contains('form-control')).toBe(true);
            field.destroy();
        });

        it('select field has form-select class', function() {
            var field = FieldRegistry.create('select', { name: 'test', options: [] }, mockForm);
            field.render();
            expect(field.inputElement.classList.contains('form-select')).toBe(true);
            field.destroy();
        });

        it('checkbox has form-check-input class', function() {
            var field = FieldRegistry.create('checkbox', { name: 'test' }, mockForm);
            field.render();
            expect(field.inputElement.classList.contains('form-check-input')).toBe(true);
            field.destroy();
        });

        it('textarea has form-control class', function() {
            var field = FieldRegistry.create('textarea', { name: 'test' }, mockForm);
            field.render();
            expect(field.inputElement.classList.contains('form-control')).toBe(true);
            field.destroy();
        });

    });

    describe('HiddenField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('hidden', {
                name: 'token',
                defaultValue: 'secret-value'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders hidden input', function() {
            expect(field.inputElement.type).toBe('hidden');
        });

        it('does not render wrapper structure', function() {
            expect(field.element.classList.contains('funky-form-field')).toBe(false);
        });

        it('sets value', function() {
            expect(field.getValue()).toBe('secret-value');
        });

    });

    describe('RadioField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: jasmine.createSpy('_onFieldChange'),
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('radio', {
                name: 'size',
                label: 'Size',
                options: [
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' }
                ]
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders radio group', function() {
            var radios = field.element.querySelectorAll('input[type="radio"]');
            expect(radios.length).toBe(3);
        });

        it('all radios share same name', function() {
            var radios = field.element.querySelectorAll('input[type="radio"]');
            radios.forEach(function(radio) {
                expect(radio.name).toBe('size');
            });
        });

        it('setValue checks correct radio', function() {
            field.setValue('medium');

            var radios = field.element.querySelectorAll('input[type="radio"]');
            expect(radios[0].checked).toBe(false);
            expect(radios[1].checked).toBe(true);
            expect(radios[2].checked).toBe(false);
        });

    });

    // =========================================================================
    // ADVANCED FIELD TYPES (Phase 4)
    // =========================================================================

    describe('Advanced field types registration', function() {

        it('has combobox type registered', function() {
            expect(FieldRegistry.has('combobox')).toBe(true);
        });

        it('has date type registered', function() {
            expect(FieldRegistry.has('date')).toBe(true);
        });

        it('has datetime type registered', function() {
            expect(FieldRegistry.has('datetime')).toBe(true);
        });

        it('has file type registered', function() {
            expect(FieldRegistry.has('file')).toBe(true);
        });

    });

    describe('ComboBoxField (native fallback)', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: jasmine.createSpy('_onFieldChange'),
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('combobox', {
                name: 'country',
                placeholder: 'Select a country',
                options: [
                    { value: 'us', label: 'United States' },
                    { value: 'uk', label: 'United Kingdom' },
                    { value: 'ca', label: 'Canada' }
                ]
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('falls back to native select when ComboBox unavailable', function() {
            // When Funky.ComboBox is not available, should render as select
            expect(field.inputElement.tagName.toLowerCase()).toBe('select');
        });

        it('renders options in native fallback', function() {
            // +1 for placeholder
            expect(field.inputElement.options.length).toBe(4);
        });

        it('setValue works with native fallback', function() {
            field.setValue('uk');
            expect(field.getValue()).toBe('uk');
        });

        it('getValue returns correct value', function() {
            field.setValue('ca');
            expect(field.getValue()).toBe('ca');
        });

    });

    describe('DateField (native fallback)', function() {

        var mockForm;
        var field;
        var originalCreate;

        beforeEach(function() {
            // Store and mock DatePicker.create to force native fallback
            // Note: Funky.DatePicker itself is locked (non-writable via registry),
            // but we can mock its .create method to make _hasDatePicker() return false
            originalCreate = Funky.DatePicker.create;
            Funky.DatePicker.create = undefined;

            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: jasmine.createSpy('_onFieldChange'),
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('date', {
                name: 'birthdate',
                label: 'Birth Date'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            // Restore DatePicker.create
            Funky.DatePicker.create = originalCreate;
            if (field) {
                field.destroy();
            }
        });

        it('falls back to native date input when DatePicker unavailable', function() {
            expect(field.inputElement.type).toBe('date');
        });

        it('setValue updates input', function() {
            field.setValue('2024-01-15');
            expect(field.inputElement.value).toBe('2024-01-15');
        });

        it('getValue returns correct value', function() {
            field.setValue('2024-06-30');
            expect(field.getValue()).toBe('2024-06-30');
        });

    });

    describe('DateField with minDate/maxDate', function() {

        var mockForm;
        var field;
        var originalCreate;

        beforeEach(function() {
            // Store and mock DatePicker.create to test native input constraints
            originalCreate = Funky.DatePicker.create;
            Funky.DatePicker.create = undefined;

            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('date', {
                name: 'start_date',
                minDate: '2024-01-01',
                maxDate: '2024-12-31'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            Funky.DatePicker.create = originalCreate;
            if (field) {
                field.destroy();
            }
        });

        it('applies min constraint', function() {
            expect(field.inputElement.min).toBe('2024-01-01');
        });

        it('applies max constraint', function() {
            expect(field.inputElement.max).toBe('2024-12-31');
        });

    });

    describe('DateTimeField (native fallback)', function() {

        var mockForm;
        var field;
        var originalCreate;

        beforeEach(function() {
            // Store and mock DatePicker.create to force native fallback
            originalCreate = Funky.DatePicker.create;
            Funky.DatePicker.create = undefined;

            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('datetime', {
                name: 'appointment',
                label: 'Appointment'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            Funky.DatePicker.create = originalCreate;
            if (field) {
                field.destroy();
            }
        });

        it('falls back to native datetime-local input', function() {
            expect(field.inputElement.type).toBe('datetime-local');
        });

        it('includeTime is true', function() {
            expect(field.includeTime).toBe(true);
        });

    });

    describe('FileField', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: jasmine.createSpy('_onFieldChange'),
                _onFieldError: jasmine.createSpy('_onFieldError'),
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('file', {
                name: 'documents',
                label: 'Documents',
                accept: '.pdf,.doc,.docx',
                multiple: true
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('renders file input', function() {
            expect(field.inputElement.type).toBe('file');
        });

        it('applies accept attribute', function() {
            expect(field.inputElement.accept).toBe('.pdf,.doc,.docx');
        });

        it('applies multiple attribute', function() {
            expect(field.inputElement.multiple).toBe(true);
        });

        it('renders drop zone', function() {
            expect(field._dropZone).not.toBeNull();
            // _dropZone is a Funky.Dom wrapper, use .el for raw DOM or wrapper methods
            var dropEl = field._dropZone.el || field._dropZone;
            expect(dropEl.classList.contains('funky-form-file-dropzone')).toBe(true);
        });

        it('renders file list container', function() {
            expect(field._fileList).not.toBeNull();
            // _fileList is a Funky.Dom wrapper, use .el for raw DOM or wrapper methods
            var listEl = field._fileList.el || field._fileList;
            expect(listEl.classList.contains('funky-form-file-list')).toBe(true);
        });

        it('drop zone is keyboard accessible', function() {
            // _dropZone is a Funky.Dom wrapper, use .el for raw DOM
            var dropEl = field._dropZone.el || field._dropZone;
            expect(dropEl.getAttribute('tabindex')).toBe('0');
            expect(dropEl.getAttribute('role')).toBe('button');
        });

        it('starts with empty files', function() {
            expect(field.getValue()).toBeNull();
            expect(field.getFiles().length).toBe(0);
        });

        it('reset clears files', function() {
            // Manually add a mock file to test reset
            field._files = [{ name: 'test.pdf', size: 1024 }];
            field._value = field._files[0];

            field.reset();

            expect(field.getValue()).toBeNull();
            expect(field.getFiles().length).toBe(0);
        });

    });

    describe('FileField disabled state', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('file', {
                name: 'upload',
                disabled: true
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('disabled drop zone has disabled class', function() {
            // _dropZone is a Funky.Dom wrapper, use .el for raw DOM
            var dropEl = field._dropZone.el || field._dropZone;
            expect(dropEl.classList.contains('funky-form-file-dropzone--disabled')).toBe(true);
        });

    });

    describe('FileField size formatting', function() {

        var mockForm;
        var field;

        beforeEach(function() {
            mockForm = {
                id: 'test-form',
                options: {},
                _onFieldChange: function() {},
                _emit: function() {},
                validateField: function() { return { valid: true, errors: [] }; }
            };

            field = FieldRegistry.create('file', {
                name: 'upload'
            }, mockForm);

            field.render();
        });

        afterEach(function() {
            if (field) {
                field.destroy();
            }
        });

        it('formats bytes correctly', function() {
            expect(field._formatSize(500)).toBe('500 B');
        });

        it('formats kilobytes correctly', function() {
            expect(field._formatSize(2048)).toBe('2.0 KB');
        });

        it('formats megabytes correctly', function() {
            expect(field._formatSize(5 * 1024 * 1024)).toBe('5.0 MB');
        });

    });

});
