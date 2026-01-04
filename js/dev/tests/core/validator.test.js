/**
 * Validator Unit Tests
 *
 * Tests for Funky.Validator - the generic validation engine.
 */

describe('Funky.Core.Validator', function() {

    var Validator = Funky.Validator;

    describe('Module registration', function() {

        it('is registered with Funky', function() {
            expect(Funky.Validator).toBeDefined();
        });

        it('has static methods', function() {
            expect(typeof Validator.register).toBe('function');
            expect(typeof Validator.unregister).toBe('function');
            expect(typeof Validator.get).toBe('function');
            expect(typeof Validator.has).toBe('function');
            expect(typeof Validator.list).toBe('function');
            expect(typeof Validator.validate).toBe('function');
            expect(typeof Validator.validateAsync).toBe('function');
            expect(typeof Validator.extractRules).toBe('function');
        });

    });

    describe('Built-in validators', function() {

        it('has required validator', function() {
            expect(Validator.has('required')).toBe(true);
        });

        it('has minLength validator', function() {
            expect(Validator.has('minLength')).toBe(true);
        });

        it('has maxLength validator', function() {
            expect(Validator.has('maxLength')).toBe(true);
        });

        it('has min validator', function() {
            expect(Validator.has('min')).toBe(true);
        });

        it('has max validator', function() {
            expect(Validator.has('max')).toBe(true);
        });

        it('has pattern validator', function() {
            expect(Validator.has('pattern')).toBe(true);
        });

        it('has email validator', function() {
            expect(Validator.has('email')).toBe(true);
        });

        it('has url validator', function() {
            expect(Validator.has('url')).toBe(true);
        });

        it('has numeric validator', function() {
            expect(Validator.has('numeric')).toBe(true);
        });

        it('has integer validator', function() {
            expect(Validator.has('integer')).toBe(true);
        });

        it('has phone validator', function() {
            expect(Validator.has('phone')).toBe(true);
        });

        it('has matches validator', function() {
            expect(Validator.has('matches')).toBe(true);
        });

        it('has different validator', function() {
            expect(Validator.has('different')).toBe(true);
        });

        it('has custom validator', function() {
            expect(Validator.has('custom')).toBe(true);
        });

        it('list() returns all validators', function() {
            var list = Validator.list();
            expect(list).toContain('required');
            expect(list).toContain('email');
            expect(list).toContain('min');
            expect(list).toContain('max');
        });

    });

    describe('Custom validator registration', function() {

        afterEach(function() {
            Validator.unregister('test-custom');
        });

        it('register adds a validator', function() {
            Validator.register('test-custom', function(value) {
                return value === 'test' ? true : 'Must be "test"';
            });

            expect(Validator.has('test-custom')).toBe(true);
        });

        it('unregister removes a validator', function() {
            Validator.register('test-custom', function() { return true; });
            expect(Validator.has('test-custom')).toBe(true);

            Validator.unregister('test-custom');
            expect(Validator.has('test-custom')).toBe(false);
        });

        it('get returns validator function', function() {
            Validator.register('test-custom', function() { return true; });

            var fn = Validator.get('test-custom');
            expect(typeof fn).toBe('function');
        });

        it('get returns null for unknown validator', function() {
            expect(Validator.get('unknown-validator')).toBeNull();
        });

    });

    describe('Required validator', function() {

        it('fails for null', function() {
            var result = Validator.validate(null, { required: true }, {});
            expect(result.valid).toBe(false);
        });

        it('fails for undefined', function() {
            var result = Validator.validate(undefined, { required: true }, {});
            expect(result.valid).toBe(false);
        });

        it('fails for empty string', function() {
            var result = Validator.validate('', { required: true }, {});
            expect(result.valid).toBe(false);
        });

        it('fails for empty array', function() {
            var result = Validator.validate([], { required: true }, {});
            expect(result.valid).toBe(false);
        });

        it('passes for non-empty string', function() {
            var result = Validator.validate('hello', { required: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for number zero', function() {
            var result = Validator.validate(0, { required: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for false', function() {
            var result = Validator.validate(false, { required: true }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('MinLength validator', function() {

        it('fails when string is too short', function() {
            var result = Validator.validate('ab', { minLength: 3 }, {});
            expect(result.valid).toBe(false);
        });

        it('passes when string meets minimum', function() {
            var result = Validator.validate('abc', { minLength: 3 }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for null value', function() {
            var result = Validator.validate(null, { minLength: 3 }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('MaxLength validator', function() {

        it('fails when string is too long', function() {
            var result = Validator.validate('abcdef', { maxLength: 5 }, {});
            expect(result.valid).toBe(false);
        });

        it('passes when string meets maximum', function() {
            var result = Validator.validate('abc', { maxLength: 5 }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Min validator', function() {

        it('fails when number is too low', function() {
            var result = Validator.validate(5, { min: 10 }, {});
            expect(result.valid).toBe(false);
        });

        it('passes when number meets minimum', function() {
            var result = Validator.validate(10, { min: 10 }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for null value', function() {
            var result = Validator.validate(null, { min: 10 }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Max validator', function() {

        it('fails when number is too high', function() {
            var result = Validator.validate(15, { max: 10 }, {});
            expect(result.valid).toBe(false);
        });

        it('passes when number meets maximum', function() {
            var result = Validator.validate(10, { max: 10 }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Pattern validator', function() {

        it('fails when pattern does not match', function() {
            var result = Validator.validate('abc123', { pattern: '^[a-z]+$' }, {});
            expect(result.valid).toBe(false);
        });

        it('passes when pattern matches', function() {
            var result = Validator.validate('abc', { pattern: '^[a-z]+$' }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Email validator', function() {

        it('fails for invalid email', function() {
            var result = Validator.validate('not-an-email', { email: true }, {});
            expect(result.valid).toBe(false);
        });

        it('fails for email without domain', function() {
            var result = Validator.validate('test@', { email: true }, {});
            expect(result.valid).toBe(false);
        });

        it('passes for valid email', function() {
            var result = Validator.validate('test@example.com', { email: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for email with subdomain', function() {
            var result = Validator.validate('test@mail.example.com', { email: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for empty value', function() {
            var result = Validator.validate('', { email: true }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('URL validator', function() {

        it('fails for invalid URL', function() {
            var result = Validator.validate('not-a-url', { url: true }, {});
            expect(result.valid).toBe(false);
        });

        it('passes for valid HTTP URL', function() {
            var result = Validator.validate('http://example.com', { url: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for valid HTTPS URL', function() {
            var result = Validator.validate('https://example.com/path?query=1', { url: true }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Numeric validator', function() {

        it('fails for non-numeric string', function() {
            var result = Validator.validate('abc', { numeric: true }, {});
            expect(result.valid).toBe(false);
        });

        it('passes for number', function() {
            var result = Validator.validate(42, { numeric: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for numeric string', function() {
            var result = Validator.validate('42', { numeric: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for decimal', function() {
            var result = Validator.validate(3.14, { numeric: true }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Integer validator', function() {

        it('fails for decimal', function() {
            var result = Validator.validate(3.14, { integer: true }, {});
            expect(result.valid).toBe(false);
        });

        it('passes for whole number', function() {
            var result = Validator.validate(42, { integer: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for negative integer', function() {
            var result = Validator.validate(-5, { integer: true }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Alpha validator', function() {

        it('fails for alphanumeric', function() {
            var result = Validator.validate('abc123', { alpha: true }, {});
            expect(result.valid).toBe(false);
        });

        it('passes for letters only', function() {
            var result = Validator.validate('AbcXyz', { alpha: true }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Alphanumeric validator', function() {

        it('fails for special characters', function() {
            var result = Validator.validate('abc-123', { alphanumeric: true }, {});
            expect(result.valid).toBe(false);
        });

        it('passes for letters and numbers', function() {
            var result = Validator.validate('Abc123', { alphanumeric: true }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Matches validator', function() {

        it('fails when values differ', function() {
            var context = { data: { password: 'secret123' } };
            var result = Validator.validate('secret456', { matches: 'password' }, context);
            expect(result.valid).toBe(false);
        });

        it('passes when values match', function() {
            var context = { data: { password: 'secret123' } };
            var result = Validator.validate('secret123', { matches: 'password' }, context);
            expect(result.valid).toBe(true);
        });

    });

    describe('Different validator', function() {

        it('fails when values are same', function() {
            var context = { data: { old_password: 'secret' } };
            var result = Validator.validate('secret', { different: 'old_password' }, context);
            expect(result.valid).toBe(false);
        });

        it('passes when values differ', function() {
            var context = { data: { old_password: 'secret' } };
            var result = Validator.validate('new_secret', { different: 'old_password' }, context);
            expect(result.valid).toBe(true);
        });

    });

    describe('In validator', function() {

        it('fails when value not in list', function() {
            var result = Validator.validate('yellow', { in: ['red', 'green', 'blue'] }, {});
            expect(result.valid).toBe(false);
        });

        it('passes when value in list', function() {
            var result = Validator.validate('green', { in: ['red', 'green', 'blue'] }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Between validator', function() {

        it('fails when below range', function() {
            var result = Validator.validate(5, { between: { min: 10, max: 20 } }, {});
            expect(result.valid).toBe(false);
        });

        it('fails when above range', function() {
            var result = Validator.validate(25, { between: { min: 10, max: 20 } }, {});
            expect(result.valid).toBe(false);
        });

        it('passes when within range', function() {
            var result = Validator.validate(15, { between: { min: 10, max: 20 } }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Phone validator', function() {

        it('fails for invalid phone', function() {
            var result = Validator.validate('123', { phone: true }, {});
            expect(result.valid).toBe(false);
        });

        it('passes for valid phone number', function() {
            var result = Validator.validate('1234567890', { phone: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for phone with formatting', function() {
            var result = Validator.validate('(123) 456-7890', { phone: true }, {});
            expect(result.valid).toBe(true);
        });

        it('passes for international format', function() {
            var result = Validator.validate('+1-123-456-7890', { phone: true }, {});
            expect(result.valid).toBe(true);
        });

    });

    describe('Custom validator', function() {

        it('runs custom function', function() {
            var customFn = function(value) {
                return value === 'special' ? true : 'Must be "special"';
            };

            var result = Validator.validate('wrong', { custom: customFn }, {});
            expect(result.valid).toBe(false);

            result = Validator.validate('special', { custom: customFn }, {});
            expect(result.valid).toBe(true);
        });

        it('receives context in custom function', function() {
            var receivedContext = null;
            var customFn = function(value, context) {
                receivedContext = context;
                return true;
            };

            var context = { field: { name: 'test' } };
            Validator.validate('value', { custom: customFn }, context);

            expect(receivedContext).toBe(context);
        });

    });

    describe('Multiple rules', function() {

        it('validates all rules', function() {
            var result = Validator.validate('ab', {
                required: true,
                minLength: 3
            }, {});

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBe(1); // minLength fails
        });

        it('collects all errors', function() {
            var result = Validator.validate('', {
                required: true,
                minLength: 3
            }, {});

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBe(1); // required fails first
        });

    });

    describe('extractRules', function() {

        it('extracts required rule', function() {
            var rules = Validator.extractRules({ required: true });
            expect(rules.required).toBe(true);
        });

        it('extracts minLength rule', function() {
            var rules = Validator.extractRules({ minLength: 5 });
            expect(rules.minLength).toBe(5);
        });

        it('extracts maxLength rule', function() {
            var rules = Validator.extractRules({ maxLength: 100 });
            expect(rules.maxLength).toBe(100);
        });

        it('extracts min rule', function() {
            var rules = Validator.extractRules({ min: 0 });
            expect(rules.min).toBe(0);
        });

        it('extracts max rule', function() {
            var rules = Validator.extractRules({ max: 100 });
            expect(rules.max).toBe(100);
        });

        it('adds email rule for email type', function() {
            var rules = Validator.extractRules({ type: 'email' });
            expect(rules.email).toBe(true);
        });

        it('adds url rule for url type', function() {
            var rules = Validator.extractRules({ type: 'url' });
            expect(rules.url).toBe(true);
        });

        it('extracts validators array', function() {
            var rules = Validator.extractRules({
                validators: [
                    'alpha',
                    { name: 'minLength', options: 3 }
                ]
            });

            expect(rules.alpha).toBe(true);
            expect(rules.minLength).toBe(3);
        });

    });

    describe('Async validation', function() {

        it('returns Promise', function() {
            var result = Validator.validateAsync('test', { required: true }, {});
            expect(result).toBeInstanceOf(Promise);
        });

        it('resolves with sync validation result', function(done) {
            Validator.validateAsync('', { required: true }, {})
                .then(function(result) {
                    expect(result.valid).toBe(false);
                    done();
                });
        });

        it('runs async validators', function(done) {
            var asyncValidator = function(value) {
                return new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve(value === 'valid' ? true : 'Invalid async');
                    }, 10);
                });
            };

            Validator.validateAsync('invalid', { async: asyncValidator }, {})
                .then(function(result) {
                    expect(result.valid).toBe(false);
                    expect(result.errors).toContain('Invalid async');
                    done();
                });
        });

        it('combines sync and async errors', function(done) {
            var asyncValidator = function() {
                return Promise.resolve('Async error');
            };

            Validator.validateAsync('ab', {
                minLength: 5,
                async: asyncValidator
            }, {})
                .then(function(result) {
                    expect(result.valid).toBe(false);
                    expect(result.errors.length).toBe(2);
                    done();
                });
        });

    });

    describe('Error messages', function() {

        it('uses field label in message', function() {
            var context = { field: { label: 'Username', name: 'username' } };
            var result = Validator.validate('', { required: true }, context);

            expect(result.errors[0]).toContain('Username');
        });

        it('uses custom message when provided', function() {
            var context = {
                field: {
                    label: 'Email',
                    messages: { required: 'Please provide your email' }
                }
            };
            var result = Validator.validate('', { required: true }, context);

            expect(result.errors[0]).toBe('Please provide your email');
        });

        it('interpolates {label} in custom message', function() {
            var context = {
                field: { label: 'Full Name' },
                messages: { required: '{label} cannot be blank' }
            };
            var result = Validator.validate('', { required: true }, context);

            expect(result.errors[0]).toBe('Full Name cannot be blank');
        });

    });

    describe('File validators', function() {

        it('fileSize fails for oversized file', function() {
            var file = { name: 'test.pdf', size: 5 * 1024 * 1024 }; // 5MB
            var result = Validator.validate(file, { fileSize: 1024 * 1024 }, {}); // 1MB limit

            expect(result.valid).toBe(false);
        });

        it('fileSize passes for file within limit', function() {
            var file = { name: 'test.pdf', size: 500 * 1024 }; // 500KB
            var result = Validator.validate(file, { fileSize: 1024 * 1024 }, {}); // 1MB limit

            expect(result.valid).toBe(true);
        });

        it('fileType fails for disallowed type', function() {
            var file = { name: 'test.exe', type: 'application/x-msdownload' };
            var result = Validator.validate(file, { fileType: ['.pdf', '.doc'] }, {});

            expect(result.valid).toBe(false);
        });

        it('fileType passes for allowed extension', function() {
            var file = { name: 'document.pdf', type: 'application/pdf' };
            var result = Validator.validate(file, { fileType: ['.pdf', '.doc'] }, {});

            expect(result.valid).toBe(true);
        });

    });

});
