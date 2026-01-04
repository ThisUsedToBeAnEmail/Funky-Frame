/**
 * Funky.Validator - Generic validation engine
 *
 * Reusable validation system for forms, tables, API data, etc.
 * Not form-specific - can be used independently.
 *
 * @module Funky.Validator
 */
(function(global) {
	'use strict';

	// Built-in validators registry
	var _validators = {};

	var Validator = {
		/**
		 * Register a validator
		 * @param {string} name - Validator name
		 * @param {Function} fn - Validator function (value, options, context) => true|string|Promise
		 */
		register: function(name, fn) {
			if (typeof fn !== 'function') {
				console.warn('Funky.Validator: Validator must be a function');
				return;
			}
			_validators[name] = fn;
		},

		/**
		 * Unregister a validator
		 * @param {string} name - Validator name
		 */
		unregister: function(name) {
			delete _validators[name];
		},

		/**
		 * Get validator by name
		 * @param {string} name
		 * @returns {Function|null}
		 */
		get: function(name) {
			return _validators[name] || null;
		},

		/**
		 * Check if validator exists
		 * @param {string} name
		 * @returns {boolean}
		 */
		has: function(name) {
			return name in _validators;
		},

		/**
		 * List all registered validators
		 * @returns {string[]}
		 */
		list: function() {
			return Object.keys(_validators);
		},

		/**
		 * Validate a single value against rules
		 * @param {*} value - Value to validate
		 * @param {Object} rules - Validation rules { ruleName: ruleValue }
		 * @param {Object} context - Context object { field, data, form }
		 * @returns {Object} { valid: boolean, errors: string[] }
		 */
		validate: function(value, rules, context) {
			var errors = [];
			context = context || {};

			for (var ruleName in rules) {
				if (!rules.hasOwnProperty(ruleName)) continue;
				if (ruleName === 'async') continue; // Handle async separately

				var ruleValue = rules[ruleName];
				var validator = this.get(ruleName);

				if (!validator) {
					console.warn('Funky.Validator: Unknown validator "' + ruleName + '"');
					continue;
				}

				var result = validator(value, ruleValue, context);

				if (result !== true) {
					errors.push(typeof result === 'string' ? result : 'Invalid value');
				}
			}

			return {
				valid: errors.length === 0,
				errors: errors
			};
		},

		/**
		 * Validate a single value with async support
		 * @param {*} value - Value to validate
		 * @param {Object} rules - Validation rules
		 * @param {Object} context - Context object
		 * @returns {Promise<Object>} { valid: boolean, errors: string[] }
		 */
		validateAsync: function(value, rules, context) {
			var self = this;
			context = context || {};

			// Run sync validation first
			var syncResult = this.validate(value, rules, context);

			// Check for async validators
			var asyncPromises = [];

			if (rules.async) {
				var asyncRules = Array.isArray(rules.async) ? rules.async : [rules.async];

				asyncRules.forEach(function(asyncRule) {
					var promise;

					if (typeof asyncRule === 'function') {
						promise = asyncRule(value, context);
					} else if (typeof asyncRule === 'object' && asyncRule.validator) {
						promise = asyncRule.validator(value, asyncRule.options, context);
					} else if (typeof asyncRule === 'string') {
						// Named async validator
						var validator = self.get(asyncRule);
						if (validator) {
							promise = validator(value, true, context);
						}
					}

					if (promise && typeof promise.then === 'function') {
						asyncPromises.push(promise);
					}
				});
			}

			if (asyncPromises.length === 0) {
				return Promise.resolve(syncResult);
			}

			return Promise.all(asyncPromises).then(function(results) {
				var asyncErrors = results.filter(function(r) {
					return r !== true;
				}).map(function(r) {
					return typeof r === 'string' ? r : 'Validation failed';
				});

				return {
					valid: syncResult.valid && asyncErrors.length === 0,
					errors: syncResult.errors.concat(asyncErrors)
				};
			}).catch(function(err) {
				// On error, fail open but log
				console.error('Funky.Validator: Async validation error:', err);
				return syncResult;
			});
		},

		/**
		 * Extract validation rules from a field definition
		 * @param {Object} fieldDef - Field definition object
		 * @returns {Object} Rules object
		 */
		extractRules: function(fieldDef) {
			var rules = {};

			if (!fieldDef) return rules;

			// Standard rules from field config
			if (fieldDef.required) rules.required = true;
			if (fieldDef.minLength !== undefined) rules.minLength = fieldDef.minLength;
			if (fieldDef.maxLength !== undefined) rules.maxLength = fieldDef.maxLength;
			if (fieldDef.min !== undefined) rules.min = fieldDef.min;
			if (fieldDef.max !== undefined) rules.max = fieldDef.max;
			if (fieldDef.pattern) rules.pattern = fieldDef.pattern;

			// Type-based validators
			if (fieldDef.type === 'email') rules.email = true;
			if (fieldDef.type === 'url') rules.url = true;
			if (fieldDef.type === 'number' || fieldDef.type === 'integer') rules.numeric = true;

			// Explicit validators array
			if (fieldDef.validators && Array.isArray(fieldDef.validators)) {
				fieldDef.validators.forEach(function(v) {
					if (typeof v === 'string') {
						rules[v] = true;
					} else if (typeof v === 'object' && v.name) {
						rules[v.name] = v.options !== undefined ? v.options : true;
					} else if (typeof v === 'function') {
						// Custom function validator
						if (!rules.async) rules.async = [];
						rules.async.push(v);
					}
				});
			}

			// Custom error messages
			if (fieldDef.messages) {
				rules._messages = fieldDef.messages;
			}

			return rules;
		},

		/**
		 * Get error message for a rule
		 * @param {string} ruleName - Rule name
		 * @param {Object} context - Context with field, value, etc.
		 * @returns {string}
		 */
		getMessage: function(ruleName, context) {
			context = context || {};
			var field = context.field || {};
			var messages = context.messages || {};

			// Check field-level custom message
			if (field.messages && field.messages[ruleName]) {
				return this._interpolateMessage(field.messages[ruleName], context);
			}

			// Check form-level custom message
			if (messages[ruleName]) {
				return this._interpolateMessage(messages[ruleName], context);
			}

			// Default message
			var defaults = {
				required: '{label} is required',
				minLength: '{label} must be at least {value} characters',
				maxLength: '{label} must be no more than {value} characters',
				min: '{label} must be at least {value}',
				max: '{label} must be no more than {value}',
				pattern: '{label} format is invalid',
				email: 'Please enter a valid email address',
				url: 'Please enter a valid URL',
				numeric: '{label} must be a number',
				integer: '{label} must be a whole number',
				alpha: '{label} must contain only letters',
				alphanumeric: '{label} must contain only letters and numbers',
				matches: '{label} must match {value}',
				different: '{label} must be different from {value}'
			};

			if (defaults[ruleName]) {
				return this._interpolateMessage(defaults[ruleName], context);
			}

			return 'Invalid value';
		},

		/**
		 * Interpolate message template
		 * @private
		 */
		_interpolateMessage: function(template, context) {
			var field = context.field || {};
			var label = field.label || field.name || 'This field';
			var value = context.ruleValue !== undefined ? context.ruleValue : '';

			return template
				.replace(/{label}/g, label)
				.replace(/{value}/g, value)
				.replace(/{name}/g, field.name || '');
		}
	};

	// =========================================================================
	// BUILT-IN VALIDATORS
	// =========================================================================

	/**
	 * Required - value must not be empty
	 */
	Validator.register('required', function(value, options, context) {
		var isEmpty = value === null ||
			value === undefined ||
			value === '' ||
			(Array.isArray(value) && value.length === 0);

		if (isEmpty) {
			return Validator.getMessage('required', context);
		}
		return true;
	});

	/**
	 * Min length - string must be at least N characters
	 */
	Validator.register('minLength', function(value, minLen, context) {
		if (value && typeof value === 'string' && value.length < minLen) {
			return Validator.getMessage('minLength', Object.assign({}, context, { ruleValue: minLen }));
		}
		return true;
	});

	/**
	 * Max length - string must be no more than N characters
	 */
	Validator.register('maxLength', function(value, maxLen, context) {
		if (value && typeof value === 'string' && value.length > maxLen) {
			return Validator.getMessage('maxLength', Object.assign({}, context, { ruleValue: maxLen }));
		}
		return true;
	});

	/**
	 * Min value - number must be at least N
	 */
	Validator.register('min', function(value, min, context) {
		if (value !== null && value !== undefined && value !== '' && Number(value) < min) {
			return Validator.getMessage('min', Object.assign({}, context, { ruleValue: min }));
		}
		return true;
	});

	/**
	 * Max value - number must be no more than N
	 */
	Validator.register('max', function(value, max, context) {
		if (value !== null && value !== undefined && value !== '' && Number(value) > max) {
			return Validator.getMessage('max', Object.assign({}, context, { ruleValue: max }));
		}
		return true;
	});

	/**
	 * Pattern - value must match regex
	 */
	Validator.register('pattern', function(value, pattern, context) {
		if (value && !new RegExp(pattern).test(value)) {
			var field = context.field || {};
			return field.patternMessage || Validator.getMessage('pattern', context);
		}
		return true;
	});

	/**
	 * Email - value must be valid email format
	 */
	Validator.register('email', function(value, options, context) {
		// More comprehensive email regex
		var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

		if (value && !emailRegex.test(value)) {
			return Validator.getMessage('email', context);
		}
		return true;
	});

	/**
	 * URL - value must be valid URL
	 */
	Validator.register('url', function(value, options, context) {
		if (value) {
			try {
				new URL(value);
			} catch (e) {
				return Validator.getMessage('url', context);
			}
		}
		return true;
	});

	/**
	 * Numeric - value must be a number
	 */
	Validator.register('numeric', function(value, options, context) {
		if (value !== null && value !== undefined && value !== '' && isNaN(Number(value))) {
			return Validator.getMessage('numeric', context);
		}
		return true;
	});

	/**
	 * Integer - value must be a whole number
	 */
	Validator.register('integer', function(value, options, context) {
		if (value !== null && value !== undefined && value !== '') {
			var num = Number(value);
			if (isNaN(num) || !Number.isInteger(num)) {
				return Validator.getMessage('integer', context);
			}
		}
		return true;
	});

	/**
	 * Alpha - value must contain only letters
	 */
	Validator.register('alpha', function(value, options, context) {
		if (value && !/^[a-zA-Z]+$/.test(value)) {
			return Validator.getMessage('alpha', context);
		}
		return true;
	});

	/**
	 * Alphanumeric - value must contain only letters and numbers
	 */
	Validator.register('alphanumeric', function(value, options, context) {
		if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
			return Validator.getMessage('alphanumeric', context);
		}
		return true;
	});

	/**
	 * Date range - date must be within range
	 */
	Validator.register('dateRange', function(value, options, context) {
		if (!value) return true;

		var date = new Date(value);
		if (isNaN(date.getTime())) return true; // Invalid date, let other validators handle

		if (options.min) {
			var min = options.min === 'today' ? new Date() : new Date(options.min);
			min.setHours(0, 0, 0, 0);
			if (date < min) {
				var field = context.field || {};
				return (field.label || 'Date') + ' must be on or after ' + min.toLocaleDateString();
			}
		}

		if (options.max) {
			var max = options.max === 'today' ? new Date() : new Date(options.max);
			max.setHours(23, 59, 59, 999);
			if (date > max) {
				var field2 = context.field || {};
				return (field2.label || 'Date') + ' must be on or before ' + max.toLocaleDateString();
			}
		}

		return true;
	});

	/**
	 * File size - file(s) must be within size limit
	 */
	Validator.register('fileSize', function(value, maxSize, context) {
		if (!value) return true;

		var files = Array.isArray(value) ? value : [value];

		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			if (file && file.size && file.size > maxSize) {
				return 'File "' + (file.name || 'file') + '" exceeds maximum size';
			}
		}

		return true;
	});

	/**
	 * File type - file(s) must be of allowed type
	 */
	Validator.register('fileType', function(value, allowedTypes, context) {
		if (!value) return true;

		var files = Array.isArray(value) ? value : [value];
		var types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			if (!file || !file.name) continue;

			var ext = '.' + file.name.split('.').pop().toLowerCase();
			var mime = file.type || '';

			var valid = types.some(function(t) {
				if (t.startsWith('.')) return ext === t.toLowerCase();
				if (t.endsWith('/*')) return mime.startsWith(t.replace('/*', '/'));
				return mime === t;
			});

			if (!valid) {
				return 'File "' + file.name + '" type is not allowed';
			}
		}

		return true;
	});

	/**
	 * Matches - value must match another field
	 */
	Validator.register('matches', function(value, otherFieldName, context) {
		var data = context.data || {};
		var otherValue = data[otherFieldName];

		if (value !== otherValue) {
			return Validator.getMessage('matches', Object.assign({}, context, { ruleValue: otherFieldName }));
		}
		return true;
	});

	/**
	 * Different - value must be different from another field
	 */
	Validator.register('different', function(value, otherFieldName, context) {
		var data = context.data || {};
		var otherValue = data[otherFieldName];

		if (value === otherValue && value !== null && value !== undefined && value !== '') {
			return Validator.getMessage('different', Object.assign({}, context, { ruleValue: otherFieldName }));
		}
		return true;
	});

	/**
	 * Custom - run custom validation function
	 */
	Validator.register('custom', function(value, fn, context) {
		if (typeof fn === 'function') {
			return fn(value, context);
		}
		return true;
	});

	/**
	 * In - value must be one of the allowed values
	 */
	Validator.register('in', function(value, allowedValues, context) {
		if (value !== null && value !== undefined && value !== '') {
			var values = Array.isArray(allowedValues) ? allowedValues : [allowedValues];
			if (values.indexOf(value) === -1) {
				var field = context.field || {};
				return (field.label || 'Value') + ' must be one of: ' + values.join(', ');
			}
		}
		return true;
	});

	/**
	 * Not in - value must not be one of the disallowed values
	 */
	Validator.register('notIn', function(value, disallowedValues, context) {
		if (value !== null && value !== undefined && value !== '') {
			var values = Array.isArray(disallowedValues) ? disallowedValues : [disallowedValues];
			if (values.indexOf(value) !== -1) {
				var field = context.field || {};
				return (field.label || 'Value') + ' cannot be: ' + values.join(', ');
			}
		}
		return true;
	});

	/**
	 * Between - number must be between min and max (inclusive)
	 */
	Validator.register('between', function(value, options, context) {
		if (value !== null && value !== undefined && value !== '') {
			var num = Number(value);
			if (!isNaN(num)) {
				if (num < options.min || num > options.max) {
					var field = context.field || {};
					return (field.label || 'Value') + ' must be between ' + options.min + ' and ' + options.max;
				}
			}
		}
		return true;
	});

	/**
	 * Length - string/array must be exactly N items
	 */
	Validator.register('length', function(value, len, context) {
		if (value && value.length !== len) {
			var field = context.field || {};
			return (field.label || 'Value') + ' must be exactly ' + len + ' characters';
		}
		return true;
	});

	/**
	 * Phone - basic phone number format
	 */
	Validator.register('phone', function(value, options, context) {
		if (value) {
			// Allow digits, spaces, dashes, parentheses, plus sign
			var cleaned = value.replace(/[\s\-\(\)\+]/g, '');
			if (!/^\d{7,15}$/.test(cleaned)) {
				return 'Please enter a valid phone number';
			}
		}
		return true;
	});

	/**
	 * Credit card - basic credit card number validation (Luhn algorithm)
	 */
	Validator.register('creditCard', function(value, options, context) {
		if (value) {
			var cleaned = value.replace(/[\s\-]/g, '');
			if (!/^\d{13,19}$/.test(cleaned)) {
				return 'Please enter a valid credit card number';
			}

			// Luhn algorithm
			var sum = 0;
			var isEven = false;
			for (var i = cleaned.length - 1; i >= 0; i--) {
				var digit = parseInt(cleaned[i], 10);
				if (isEven) {
					digit *= 2;
					if (digit > 9) digit -= 9;
				}
				sum += digit;
				isEven = !isEven;
			}

			if (sum % 10 !== 0) {
				return 'Please enter a valid credit card number';
			}
		}
		return true;
	});

	// =========================================================================
	// EXPOSE API
	// =========================================================================

	// Register component using Funky registry
	if (global.Funky && global.Funky.register) {
		global.Funky.register('Validator', Validator);
	}

})(typeof window !== 'undefined' ? window : this);
