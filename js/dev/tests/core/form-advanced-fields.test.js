/**
 * Form Advanced Field Types Unit Tests
 *
 * Tests for new field types: time, range, color, search, currency, phone, tags, rating, signature, code
 */

describe('Funky.Core.Form.AdvancedFields', function() {

    var FieldRegistry = Funky.Form.FieldRegistry;
    var fixture;
    var mockForm;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
        fixture.html('<div id="field-container"></div>');

        mockForm = {
            id: 'test-form',
            options: {},
            _onFieldChange: function() {},
            _emit: function() {},
            validateField: function() { return { valid: true, errors: [] }; }
        };
    });

    afterEach(function() {
        fixture.cleanup();
    });

    // =========================================================================
    // TIME FIELD
    // =========================================================================

    describe('TimeField', function() {

        it('is registered', function() {
            expect(FieldRegistry.has('time')).toBe(true);
        });

        it('creates time input', function() {
            var field = FieldRegistry.create('time', {
                name: 'startTime'
            }, mockForm);

            field.render();
            expect(field.inputElement.type).toBe('time');
            field.destroy();
        });

        it('applies min/max constraints', function() {
            var field = FieldRegistry.create('time', {
                name: 'startTime',
                min: '09:00',
                max: '17:00'
            }, mockForm);

            field.render();
            expect(field.inputElement.min).toBe('09:00');
            expect(field.inputElement.max).toBe('17:00');
            field.destroy();
        });

        it('sets and gets value', function() {
            var field = FieldRegistry.create('time', {
                name: 'startTime'
            }, mockForm);

            field.render();
            field.setValue('14:30');
            expect(field.getValue()).toBe('14:30');
            field.destroy();
        });

        it('validates required', function() {
            var field = FieldRegistry.create('time', {
                name: 'startTime',
                required: true
            }, mockForm);

            field.render();
            var result = field.validate();
            expect(result.valid).toBe(false);
            field.destroy();
        });

    });

    // =========================================================================
    // RANGE / SLIDER FIELD
    // =========================================================================

    describe('RangeField', function() {

        it('is registered as range', function() {
            expect(FieldRegistry.has('range')).toBe(true);
        });

        it('is registered as slider', function() {
            expect(FieldRegistry.has('slider')).toBe(true);
        });

        it('creates range input', function() {
            var field = FieldRegistry.create('range', {
                name: 'volume',
                min: 0,
                max: 100
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var input = field.element.querySelector('input[type="range"]');
            expect(input).not.toBeNull();
            field.destroy();
        });

        it('applies min/max/step', function() {
            var field = FieldRegistry.create('range', {
                name: 'volume',
                min: 0,
                max: 100,
                step: 5
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var input = field.element.querySelector('input[type="range"]');
            expect(input.min).toBe('0');
            expect(input.max).toBe('100');
            expect(input.step).toBe('5');
            field.destroy();
        });

        it('displays value', function() {
            var field = FieldRegistry.create('range', {
                name: 'volume',
                min: 0,
                max: 100,
                showValue: true
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);
            field.setValue(50);

            var valueDisplay = field.element.querySelector('.funky-form-range-value');
            expect(valueDisplay).not.toBeNull();
            expect(valueDisplay.textContent).toBe('50');
            field.destroy();
        });

        it('getValue returns number', function() {
            var field = FieldRegistry.create('range', {
                name: 'volume',
                min: 0,
                max: 100
            }, mockForm);

            field.render();
            field.setValue(75);
            expect(field.getValue()).toBe(75);
            expect(typeof field.getValue()).toBe('number');
            field.destroy();
        });

    });

    // =========================================================================
    // COLOR FIELD
    // =========================================================================

    describe('ColorField', function() {

        it('is registered', function() {
            expect(FieldRegistry.has('color')).toBe(true);
        });

        it('creates color input', function() {
            var field = FieldRegistry.create('color', {
                name: 'bgColor'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var input = field.element.querySelector('input[type="color"]');
            expect(input).not.toBeNull();
            field.destroy();
        });

        it('defaults to black', function() {
            var field = FieldRegistry.create('color', {
                name: 'bgColor'
            }, mockForm);

            field.render();
            expect(field.getValue()).toBe('#000000');
            field.destroy();
        });

        it('sets and gets hex value', function() {
            var field = FieldRegistry.create('color', {
                name: 'bgColor'
            }, mockForm);

            field.render();
            field.setValue('#ff5500');
            expect(field.getValue()).toBe('#ff5500');
            field.destroy();
        });

        it('displays hex value when showHex is true', function() {
            var field = FieldRegistry.create('color', {
                name: 'bgColor',
                showHex: true
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var hexDisplay = field.element.querySelector('.funky-form-color-hex');
            expect(hexDisplay).not.toBeNull();
            field.destroy();
        });

        it('validates hex format', function() {
            var field = FieldRegistry.create('color', {
                name: 'bgColor'
            }, mockForm);

            field.render();
            field._value = 'invalid';
            var result = field.validate();
            expect(result.valid).toBe(false);
            field.destroy();
        });

    });

    // =========================================================================
    // SEARCH FIELD
    // =========================================================================

    describe('SearchField', function() {

        it('is registered', function() {
            expect(FieldRegistry.has('search')).toBe(true);
        });

        it('creates search input', function() {
            var field = FieldRegistry.create('search', {
                name: 'query'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var input = field.element.querySelector('input[type="search"]');
            expect(input).not.toBeNull();
            field.destroy();
        });

        it('has search icon', function() {
            var field = FieldRegistry.create('search', {
                name: 'query'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var icon = field.element.querySelector('.funky-form-search-icon');
            expect(icon).not.toBeNull();
            field.destroy();
        });

        it('has clear button', function() {
            var field = FieldRegistry.create('search', {
                name: 'query'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var clearBtn = field.element.querySelector('.funky-form-search-clear');
            expect(clearBtn).not.toBeNull();
            field.destroy();
        });

        it('applies default placeholder', function() {
            var field = FieldRegistry.create('search', {
                name: 'query'
            }, mockForm);

            field.render();
            expect(field.inputElement.placeholder).toBe('Search...');
            field.destroy();
        });

    });

    // =========================================================================
    // CURRENCY FIELD
    // =========================================================================

    describe('CurrencyField', function() {

        it('is registered as currency', function() {
            expect(FieldRegistry.has('currency')).toBe(true);
        });

        it('is registered as money', function() {
            expect(FieldRegistry.has('money')).toBe(true);
        });

        it('creates text input with decimal inputmode', function() {
            var field = FieldRegistry.create('currency', {
                name: 'price'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var input = field.element.querySelector('input');
            expect(input.inputMode).toBe('decimal');
            field.destroy();
        });

        it('displays currency symbol', function() {
            var field = FieldRegistry.create('currency', {
                name: 'price',
                currency: 'USD'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var symbol = field.element.querySelector('.funky-form-currency-symbol');
            expect(symbol).not.toBeNull();
            expect(symbol.textContent).toBe('$');
            field.destroy();
        });

        it('displays currency code', function() {
            var field = FieldRegistry.create('currency', {
                name: 'price',
                currency: 'EUR',
                showCurrencyCode: true
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var code = field.element.querySelector('.funky-form-currency-code');
            expect(code).not.toBeNull();
            expect(code.textContent).toBe('EUR');
            field.destroy();
        });

        it('getValue returns number', function() {
            var field = FieldRegistry.create('currency', {
                name: 'price'
            }, mockForm);

            field.render();
            field.setValue(99.99);
            expect(field.getValue()).toBe(99.99);
            expect(typeof field.getValue()).toBe('number');
            field.destroy();
        });

        it('validates min/max', function() {
            var field = FieldRegistry.create('currency', {
                name: 'price',
                min: 10,
                max: 1000
            }, mockForm);

            field.render();
            field.setValue(5);
            var result = field.validate();
            expect(result.valid).toBe(false);
            field.destroy();
        });

    });

    // =========================================================================
    // PHONE FIELD
    // =========================================================================

    describe('PhoneField', function() {

        it('is registered as phone', function() {
            expect(FieldRegistry.has('phone')).toBe(true);
        });

        it('creates tel input', function() {
            var field = FieldRegistry.create('phone', {
                name: 'mobile'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var input = field.element.querySelector('input[type="tel"]');
            expect(input).not.toBeNull();
            field.destroy();
        });

        it('displays country code selector', function() {
            var field = FieldRegistry.create('phone', {
                name: 'mobile',
                showCountryCode: true
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var select = field.element.querySelector('.funky-form-phone-country');
            expect(select).not.toBeNull();
            field.destroy();
        });

        it('formats phone number', function() {
            var field = FieldRegistry.create('phone', {
                name: 'mobile'
            }, mockForm);

            field.render();
            // Simulate input by calling the internal format method
            var formatted = field._formatPhoneNumber('5551234567');
            expect(formatted).toBe('(555) 123-4567');
            field.destroy();
        });

        it('validates phone number length', function() {
            var field = FieldRegistry.create('phone', {
                name: 'mobile',
                required: true
            }, mockForm);

            field.render();
            field._value = '123';
            var result = field.validate();
            expect(result.valid).toBe(false);
            field.destroy();
        });

    });

    // =========================================================================
    // TAGS FIELD
    // =========================================================================

    describe('TagsField', function() {

        it('is registered', function() {
            expect(FieldRegistry.has('tags')).toBe(true);
        });

        it('creates tags wrapper', function() {
            var field = FieldRegistry.create('tags', {
                name: 'keywords'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var wrapper = field.element.querySelector('.funky-form-tags-wrapper');
            expect(wrapper).not.toBeNull();
            field.destroy();
        });

        it('creates input for new tags', function() {
            var field = FieldRegistry.create('tags', {
                name: 'keywords'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var input = field.element.querySelector('.funky-form-tags-input');
            expect(input).not.toBeNull();
            field.destroy();
        });

        it('getValue returns array', function() {
            var field = FieldRegistry.create('tags', {
                name: 'keywords'
            }, mockForm);

            field.render();
            expect(Array.isArray(field.getValue())).toBe(true);
            field.destroy();
        });

        it('setValue with array', function() {
            var field = FieldRegistry.create('tags', {
                name: 'keywords'
            }, mockForm);

            field.render();
            field.setValue(['tag1', 'tag2', 'tag3']);
            expect(field.getValue()).toEqual(['tag1', 'tag2', 'tag3']);
            field.destroy();
        });

        it('setValue with comma-separated string', function() {
            var field = FieldRegistry.create('tags', {
                name: 'keywords'
            }, mockForm);

            field.render();
            field.setValue('tag1, tag2, tag3');
            expect(field.getValue()).toEqual(['tag1', 'tag2', 'tag3']);
            field.destroy();
        });

        it('validates required', function() {
            var field = FieldRegistry.create('tags', {
                name: 'keywords',
                required: true
            }, mockForm);

            field.render();
            var result = field.validate();
            expect(result.valid).toBe(false);
            field.destroy();
        });

        it('validates maxTags', function() {
            var field = FieldRegistry.create('tags', {
                name: 'keywords',
                maxTags: 2
            }, mockForm);

            field.render();
            field.setValue(['tag1', 'tag2', 'tag3']);
            var result = field.validate();
            expect(result.valid).toBe(false);
            field.destroy();
        });

    });

    // =========================================================================
    // RATING FIELD
    // =========================================================================

    describe('RatingField', function() {

        it('is registered', function() {
            expect(FieldRegistry.has('rating')).toBe(true);
        });

        it('creates stars container', function() {
            var field = FieldRegistry.create('rating', {
                name: 'stars'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var stars = field.element.querySelector('.funky-form-rating-stars');
            expect(stars).not.toBeNull();
            field.destroy();
        });

        it('creates 5 stars by default', function() {
            var field = FieldRegistry.create('rating', {
                name: 'stars'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var stars = field.element.querySelectorAll('.funky-form-rating-star');
            expect(stars.length).toBe(5);
            field.destroy();
        });

        it('creates custom number of stars', function() {
            var field = FieldRegistry.create('rating', {
                name: 'stars',
                max: 10
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var stars = field.element.querySelectorAll('.funky-form-rating-star');
            expect(stars.length).toBe(10);
            field.destroy();
        });

        it('getValue returns number', function() {
            var field = FieldRegistry.create('rating', {
                name: 'stars'
            }, mockForm);

            field.render();
            field.setValue(3);
            expect(field.getValue()).toBe(3);
            expect(typeof field.getValue()).toBe('number');
            field.destroy();
        });

        it('clamps value to max', function() {
            var field = FieldRegistry.create('rating', {
                name: 'stars',
                max: 5
            }, mockForm);

            field.render();
            field.setValue(10);
            expect(field.getValue()).toBe(5);
            field.destroy();
        });

        it('displays value when showValue is true', function() {
            var field = FieldRegistry.create('rating', {
                name: 'stars',
                showValue: true
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);
            field.setValue(4);

            var valueLabel = field.element.querySelector('.funky-form-rating-value');
            expect(valueLabel).not.toBeNull();
            expect(valueLabel.textContent).toBe('4/5');
            field.destroy();
        });

        it('validates required', function() {
            var field = FieldRegistry.create('rating', {
                name: 'stars',
                required: true
            }, mockForm);

            field.render();
            var result = field.validate();
            expect(result.valid).toBe(false);
            field.destroy();
        });

    });

    // =========================================================================
    // SIGNATURE FIELD
    // =========================================================================

    describe('SignatureField', function() {

        it('is registered', function() {
            expect(FieldRegistry.has('signature')).toBe(true);
        });

        it('creates signature wrapper', function() {
            var field = FieldRegistry.create('signature', {
                name: 'sig'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var wrapper = field.element.querySelector('.funky-form-signature-wrapper');
            expect(wrapper).not.toBeNull();
            field.destroy();
        });

        it('creates signature container', function() {
            var field = FieldRegistry.create('signature', {
                name: 'sig'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var container = field.element.querySelector('.funky-form-signature-container');
            expect(container).not.toBeNull();
            field.destroy();
        });

        it('creates clear button', function() {
            var field = FieldRegistry.create('signature', {
                name: 'sig'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var clearBtn = field.element.querySelector('.funky-form-signature-clear');
            expect(clearBtn).not.toBeNull();
            field.destroy();
        });

        it('creates hidden input', function() {
            var field = FieldRegistry.create('signature', {
                name: 'sig'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var hidden = field.element.querySelector('input[type="hidden"]');
            expect(hidden).not.toBeNull();
            expect(hidden.name).toBe('sig');
            field.destroy();
        });

        it('validates required when empty', function() {
            var field = FieldRegistry.create('signature', {
                name: 'sig',
                required: true
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            // Wait for async init
            return new Promise(function(resolve) {
                setTimeout(function() {
                    var result = field.validate();
                    expect(result.valid).toBe(false);
                    field.destroy();
                    resolve();
                }, 50);
            });
        });

    });

    // =========================================================================
    // CODE FIELD
    // =========================================================================

    describe('CodeField', function() {

        it('is registered', function() {
            expect(FieldRegistry.has('code')).toBe(true);
        });

        it('creates code wrapper', function() {
            var field = FieldRegistry.create('code', {
                name: 'snippet'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var wrapper = field.element.querySelector('.funky-form-code-wrapper');
            expect(wrapper).not.toBeNull();
            field.destroy();
        });

        it('creates code container', function() {
            var field = FieldRegistry.create('code', {
                name: 'snippet'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var container = field.element.querySelector('.funky-form-code-container');
            expect(container).not.toBeNull();
            field.destroy();
        });

        it('creates hidden input', function() {
            var field = FieldRegistry.create('code', {
                name: 'snippet'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            var hidden = field.element.querySelector('input[type="hidden"]');
            expect(hidden).not.toBeNull();
            expect(hidden.name).toBe('snippet');
            field.destroy();
        });

        it('setValue and getValue', function() {
            var field = FieldRegistry.create('code', {
                name: 'snippet',
                defaultValue: 'console.log("hello");'
            }, mockForm);

            field.render();
            fixture.el.appendChild(field.element);

            expect(field.getValue()).toBe('console.log("hello");');

            field.setValue('function test() {}');
            expect(field.getValue()).toBe('function test() {}');
            field.destroy();
        });

        it('validates required', function() {
            var field = FieldRegistry.create('code', {
                name: 'snippet',
                required: true
            }, mockForm);

            field.render();
            var result = field.validate();
            expect(result.valid).toBe(false);
            field.destroy();
        });

    });

});
