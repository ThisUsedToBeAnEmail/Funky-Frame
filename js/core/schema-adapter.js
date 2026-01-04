/**
 * Funky.SchemaAdapter - Generic schema conversion
 *
 * Converts external schemas (OpenAPI, GraphQL, etc.) to native Funky format.
 * Used by Form, Table, API validation, and other consumers.
 *
 * This module is NOT form-specific and can be reused by:
 * - Funky.Form - Convert OpenAPI to form field definitions
 * - Funky.Table - Convert OpenAPI to column definitions
 * - API validation - Validate request/response data
 * - Code generation - Generate TypeScript interfaces, mock data
 *
 * @module Funky.SchemaAdapter
 */
(function(global) {
	'use strict';

	// =========================================================================
	// ADAPTER REGISTRY
	// =========================================================================

	var _adapters = {};

	var SchemaAdapter = {
		/**
		 * Register a schema adapter
		 * @param {string} name - Adapter name (e.g., 'openapi', 'graphql')
		 * @param {Object} adapter - Adapter implementation with convert() method
		 */
		register: function(name, adapter) {
			if (!name || typeof name !== 'string') {
				console.warn('Funky.SchemaAdapter: Invalid adapter name');
				return;
			}
			if (!adapter || typeof adapter.convert !== 'function') {
				console.warn('Funky.SchemaAdapter: Adapter must have convert() method');
				return;
			}
			_adapters[name] = adapter;
		},

		/**
		 * Unregister a schema adapter
		 * @param {string} name - Adapter name
		 */
		unregister: function(name) {
			delete _adapters[name];
		},

		/**
		 * Get adapter by name
		 * @param {string} name - Adapter name
		 * @returns {Object|null} Adapter or null if not found
		 */
		get: function(name) {
			return _adapters[name] || null;
		},

		/**
		 * Check if adapter exists
		 * @param {string} name - Adapter name
		 * @returns {boolean}
		 */
		has: function(name) {
			return !!_adapters[name];
		},

		/**
		 * List all registered adapter names
		 * @returns {string[]}
		 */
		list: function() {
			return Object.keys(_adapters);
		},

		/**
		 * Detect schema type automatically
		 * @param {Object|Array} schema - Input schema
		 * @returns {string} Schema type name
		 */
		detect: function(schema) {
			if (!schema) {
				return 'unknown';
			}

			// Simple array of fields
			if (Array.isArray(schema)) {
				return 'array';
			}

			// Native format (has fields object)
			if (schema.fields && typeof schema.fields === 'object') {
				return 'native';
			}

			// OpenAPI/JSON Schema indicators
			if (schema.type === 'object' && schema.properties) {
				return 'openapi';
			}
			if (schema.$schema || schema.definitions || schema.$defs) {
				return 'jsonschema';
			}

			// GraphQL indicators
			if (schema.__typename || schema.kind === 'INPUT_OBJECT') {
				return 'graphql';
			}
			if (schema.inputFields && Array.isArray(schema.inputFields)) {
				return 'graphql';
			}

			// Single-level object with type properties (shorthand format)
			if (typeof schema === 'object' && !schema.type && !schema.properties) {
				var keys = Object.keys(schema);
				if (keys.length > 0 && typeof schema[keys[0]] === 'object') {
					return 'shorthand';
				}
			}

			return 'unknown';
		},

		/**
		 * Convert schema to native format
		 * @param {Object|Array} schema - Input schema
		 * @param {Object} [options] - Conversion options
		 * @returns {Object} Native schema { fields: {...} }
		 */
		convert: function(schema, options) {
			if (!schema) {
				return { fields: {} };
			}

			var type = this.detect(schema);

			// Native format passes through unchanged
			if (type === 'native') {
				return schema;
			}

			var adapter = this.get(type);
			if (adapter) {
				return adapter.convert(schema, options);
			}

			// Unknown type - return empty schema
			console.warn('Funky.SchemaAdapter: Unknown schema type, cannot convert');
			return { fields: {} };
		},

		/**
		 * Convert schema to native format with specific adapter
		 * @param {string} adapterName - Adapter name to use
		 * @param {Object|Array} schema - Input schema
		 * @param {Object} [options] - Conversion options
		 * @returns {Object} Native schema
		 */
		convertWith: function(adapterName, schema, options) {
			var adapter = this.get(adapterName);
			if (!adapter) {
				console.warn('Funky.SchemaAdapter: Adapter "' + adapterName + '" not found');
				return { fields: {} };
			}
			return adapter.convert(schema, options);
		}
	};

	// =========================================================================
	// UTILITY FUNCTIONS
	// =========================================================================

	/**
	 * Convert field name to human-readable label
	 * @param {string} str - Field name (snake_case or camelCase)
	 * @returns {string} Human label
	 */
	function humanize(str) {
		if (!str) return '';
		return str
			.replace(/_/g, ' ')
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/^./, function(c) { return c.toUpperCase(); });
	}

	/**
	 * Deep merge objects
	 * @param {Object} target
	 * @param {Object} source
	 * @returns {Object}
	 */
	function deepMerge(target, source) {
		var result = Object.assign({}, target);
		for (var key in source) {
			if (source.hasOwnProperty(key)) {
				if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
					result[key] = deepMerge(result[key] || {}, source[key]);
				} else {
					result[key] = source[key];
				}
			}
		}
		return result;
	}

	// =========================================================================
	// OPENAPI / JSON SCHEMA ADAPTER
	// =========================================================================

	/**
	 * OpenAPI/JSON Schema Adapter
	 *
	 * Converts JSON Schema format (used in OpenAPI specs) to native Funky schema.
	 * Handles both OpenAPI 3.0 and 3.1 formats.
	 */
	var OpenAPIAdapter = {
		/**
		 * Convert OpenAPI/JSON Schema to native format
		 * @param {Object} schema - JSON Schema object
		 * @param {Object} [options] - Conversion options
		 * @returns {Object} Native schema
		 */
		convert: function(schema, options) {
			options = options || {};
			var native = { fields: {} };

			if (!schema || !schema.properties) {
				return native;
			}

			var required = schema.required || [];

			for (var propName in schema.properties) {
				if (schema.properties.hasOwnProperty(propName)) {
					var prop = schema.properties[propName];
					var isRequired = required.indexOf(propName) > -1;
					native.fields[propName] = this.convertProperty(propName, prop, isRequired, options);
				}
			}

			return native;
		},

		/**
		 * Convert a single JSON Schema property to native field
		 * @param {string} name - Property name
		 * @param {Object} prop - Property schema
		 * @param {boolean} isRequired - Is field required
		 * @param {Object} [options] - Conversion options
		 * @returns {Object} Native field definition
		 */
		convertProperty: function(name, prop, isRequired, options) {
			options = options || {};

			var field = {
				name: name,
				type: this.mapType(prop),
				label: prop.title || humanize(name),
				required: isRequired
			};

			// Description → help text
			if (prop.description) {
				field.help = prop.description;
			}

			// String constraints
			if (prop.minLength !== undefined) {
				field.minLength = prop.minLength;
			}
			if (prop.maxLength !== undefined) {
				field.maxLength = prop.maxLength;
			}
			if (prop.pattern) {
				field.pattern = prop.pattern;
			}

			// Number constraints
			if (prop.minimum !== undefined) {
				field.min = prop.minimum;
			}
			if (prop.maximum !== undefined) {
				field.max = prop.maximum;
			}
			if (prop.exclusiveMinimum !== undefined) {
				// JSON Schema draft-07+
				field.min = prop.exclusiveMinimum;
				field.exclusiveMin = true;
			}
			if (prop.exclusiveMaximum !== undefined) {
				field.max = prop.exclusiveMaximum;
				field.exclusiveMax = true;
			}
			if (prop.multipleOf !== undefined) {
				field.step = prop.multipleOf;
			}

			// Enum → select options
			if (prop.enum) {
				field.type = 'select';
				field.options = this.convertEnumOptions(prop);
			}

			// Default value
			if (prop.default !== undefined) {
				field.defaultValue = prop.default;
			}

			// Format-specific handling
			if (prop.format) {
				var mappedType = this.mapFormat(prop.format);
				if (mappedType) {
					field.type = mappedType;
				}
			}

			// readOnly
			if (prop.readOnly) {
				field.readonly = true;
			}

			// writeOnly (e.g., passwords)
			if (prop.writeOnly) {
				field.writeOnly = true;
			}

			// Nullable (OpenAPI 3.0)
			if (prop.nullable) {
				field.nullable = true;
			}

			// Deprecated
			if (prop.deprecated) {
				field.deprecated = true;
			}

			// Examples
			if (prop.example !== undefined) {
				field.example = prop.example;
			}
			if (prop.examples && Array.isArray(prop.examples)) {
				field.examples = prop.examples;
			}

			// x-funky extensions (custom metadata)
			if (prop['x-funky-field']) {
				field = deepMerge(field, prop['x-funky-field']);
			}

			// x-funky-type (override type detection)
			if (prop['x-funky-type']) {
				field.type = prop['x-funky-type'];
			}

			// x-funky-options (remote data source)
			if (prop['x-funky-remote']) {
				field.remote = prop['x-funky-remote'];
				if (field.type === 'select') {
					field.type = 'combobox';
				}
			}

			// x-funky-dependsOn (field dependencies)
			if (prop['x-funky-dependsOn']) {
				field.dependsOn = prop['x-funky-dependsOn'];
			}

			// Array items (for multi-select)
			if (prop.type === 'array' && prop.items) {
				field.multiple = true;
				if (prop.items.enum) {
					field.options = this.convertEnumOptions(prop.items);
				}
				if (prop.minItems !== undefined) {
					field.minItems = prop.minItems;
				}
				if (prop.maxItems !== undefined) {
					field.maxItems = prop.maxItems;
				}
			}

			return field;
		},

		/**
		 * Convert enum to options array
		 * @param {Object} prop - Property with enum
		 * @returns {Array} Options array
		 */
		convertEnumOptions: function(prop) {
			var enumValues = prop.enum || [];

			// x-enum-descriptions extension
			if (prop['x-enum-descriptions'] && Array.isArray(prop['x-enum-descriptions'])) {
				return enumValues.map(function(val, i) {
					return {
						value: val,
						label: prop['x-enum-descriptions'][i] || String(val)
					};
				});
			}

			// x-enumNames extension (used by some generators)
			if (prop['x-enumNames'] && Array.isArray(prop['x-enumNames'])) {
				return enumValues.map(function(val, i) {
					return {
						value: val,
						label: prop['x-enumNames'][i] || String(val)
					};
				});
			}

			// Default: value as label
			return enumValues.map(function(val) {
				return { value: val, label: String(val) };
			});
		},

		/**
		 * Map JSON Schema type to native field type
		 * @param {Object} prop - Property schema
		 * @returns {string} Native field type
		 */
		mapType: function(prop) {
			var type = prop.type;

			// Handle anyOf/oneOf for nullable types (OpenAPI 3.1)
			if (prop.anyOf || prop.oneOf) {
				var types = (prop.anyOf || prop.oneOf)
					.filter(function(t) { return t.type !== 'null'; });
				if (types.length === 1) {
					type = types[0].type;
					// Check for format in the non-null type
					if (types[0].format) {
						var mappedFormat = this.mapFormat(types[0].format);
						if (mappedFormat) {
							return mappedFormat;
						}
					}
				}
			}

			// Handle allOf (composition)
			if (prop.allOf && prop.allOf.length > 0) {
				// Merge all schemas and use first type found
				for (var i = 0; i < prop.allOf.length; i++) {
					if (prop.allOf[i].type) {
						type = prop.allOf[i].type;
						break;
					}
				}
			}

			var typeMap = {
				'string': 'text',
				'integer': 'number',
				'number': 'number',
				'boolean': 'checkbox',
				'array': 'select',
				'object': 'text'  // Fallback, may need nested form
			};

			return typeMap[type] || 'text';
		},

		/**
		 * Map JSON Schema format to native field type
		 * @param {string} format - Format string
		 * @returns {string|null} Native field type or null
		 */
		mapFormat: function(format) {
			var formatMap = {
				'email': 'email',
				'uri': 'url',
				'url': 'url',
				'date': 'date',
				'date-time': 'datetime',
				'time': 'time',
				'password': 'password',
				'binary': 'file',
				'byte': 'file',
				'uuid': 'text',
				'hostname': 'text',
				'ipv4': 'text',
				'ipv6': 'text',
				'phone': 'tel',
				'tel': 'tel'
			};
			return formatMap[format] || null;
		}
	};

	// Register OpenAPI adapter
	SchemaAdapter.register('openapi', OpenAPIAdapter);

	// Alias for jsonschema (same format)
	SchemaAdapter.register('jsonschema', OpenAPIAdapter);

	// =========================================================================
	// ARRAY ADAPTER
	// =========================================================================

	/**
	 * Array Adapter
	 *
	 * Converts simple array of field definitions to native schema.
	 * Useful for quick form definitions without full schema overhead.
	 */
	var ArrayAdapter = {
		/**
		 * Convert array of fields to native format
		 * @param {Array} fieldsArray - Array of field definitions
		 * @param {Object} [options] - Conversion options
		 * @returns {Object} Native schema
		 */
		convert: function(fieldsArray, options) {
			options = options || {};
			var native = { fields: {} };

			if (!Array.isArray(fieldsArray)) {
				return native;
			}

			fieldsArray.forEach(function(field, index) {
				var name = field.name || field.id || ('field_' + index);

				// Normalize options if they're simple strings
				var normalizedField = Object.assign({}, field, {
					name: name,
					type: field.type || 'text'
				});

				// Auto-generate label if not provided
				if (!normalizedField.label) {
					normalizedField.label = humanize(name);
				}

				// Normalize simple string options
				if (normalizedField.options && Array.isArray(normalizedField.options)) {
					normalizedField.options = normalizedField.options.map(function(opt) {
						if (typeof opt === 'string' || typeof opt === 'number') {
							return { value: opt, label: String(opt) };
						}
						return opt;
					});
				}

				native.fields[name] = normalizedField;
			});

			return native;
		}
	};

	// Register Array adapter
	SchemaAdapter.register('array', ArrayAdapter);

	// =========================================================================
	// SHORTHAND ADAPTER
	// =========================================================================

	/**
	 * Shorthand Adapter
	 *
	 * Converts shorthand object format where keys are field names
	 * and values are field configurations (without explicit 'fields' wrapper).
	 *
	 * Example:
	 * {
	 *   name: { type: 'text', required: true },
	 *   email: { type: 'email' }
	 * }
	 */
	var ShorthandAdapter = {
		/**
		 * Convert shorthand object to native format
		 * @param {Object} schema - Shorthand schema
		 * @param {Object} [options] - Conversion options
		 * @returns {Object} Native schema
		 */
		convert: function(schema, options) {
			options = options || {};
			var native = { fields: {} };

			if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
				return native;
			}

			for (var name in schema) {
				if (schema.hasOwnProperty(name)) {
					var fieldConfig = schema[name];

					// Handle string shorthand (just type)
					if (typeof fieldConfig === 'string') {
						fieldConfig = { type: fieldConfig };
					}

					// Skip non-object values
					if (typeof fieldConfig !== 'object') {
						continue;
					}

					native.fields[name] = Object.assign({
						name: name,
						type: 'text',
						label: humanize(name)
					}, fieldConfig);

					// Normalize simple string options
					if (native.fields[name].options && Array.isArray(native.fields[name].options)) {
						native.fields[name].options = native.fields[name].options.map(function(opt) {
							if (typeof opt === 'string' || typeof opt === 'number') {
								return { value: opt, label: String(opt) };
							}
							return opt;
						});
					}
				}
			}

			return native;
		}
	};

	// Register Shorthand adapter
	SchemaAdapter.register('shorthand', ShorthandAdapter);

	// =========================================================================
	// GRAPHQL ADAPTER
	// =========================================================================

	/**
	 * GraphQL Adapter
	 *
	 * Converts GraphQL Input types (from introspection) to native schema.
	 * Handles GraphQL type system including NonNull, List, and scalar types.
	 */
	var GraphQLAdapter = {
		/**
		 * Convert GraphQL schema to native format
		 * @param {Object} schema - GraphQL type (from introspection)
		 * @param {Object} [options] - Conversion options
		 * @returns {Object} Native schema
		 */
		convert: function(schema, options) {
			options = options || {};
			var native = { fields: {} };

			if (!schema) {
				return native;
			}

			// Handle introspection __Type format
			if (schema.inputFields && Array.isArray(schema.inputFields)) {
				var self = this;
				schema.inputFields.forEach(function(field) {
					native.fields[field.name] = self.convertField(field);
				});
			}

			// Handle fields array (alternative format)
			if (schema.fields && Array.isArray(schema.fields)) {
				var self = this;
				schema.fields.forEach(function(field) {
					native.fields[field.name] = self.convertField(field);
				});
			}

			return native;
		},

		/**
		 * Convert a GraphQL field to native format
		 * @param {Object} field - GraphQL field definition
		 * @returns {Object} Native field definition
		 */
		convertField: function(field) {
			var nativeField = {
				name: field.name,
				type: this.mapType(field.type),
				label: humanize(field.name),
				required: this.isNonNull(field.type)
			};

			if (field.description) {
				nativeField.help = field.description;
			}

			if (field.defaultValue !== undefined && field.defaultValue !== null) {
				// GraphQL returns defaultValue as string, try to parse
				try {
					nativeField.defaultValue = JSON.parse(field.defaultValue);
				} catch (e) {
					nativeField.defaultValue = field.defaultValue;
				}
			}

			// Handle List type for multi-select
			if (this.isList(field.type)) {
				nativeField.multiple = true;
			}

			// Handle Enum type
			var enumValues = this.getEnumValues(field.type);
			if (enumValues) {
				nativeField.type = 'select';
				nativeField.options = enumValues.map(function(ev) {
					return {
						value: ev.name,
						label: ev.description || ev.name
					};
				});
			}

			return nativeField;
		},

		/**
		 * Map GraphQL type to native field type
		 * @param {Object} gqlType - GraphQL type
		 * @returns {string} Native field type
		 */
		mapType: function(gqlType) {
			// Unwrap NonNull and List wrappers
			var type = this.unwrapType(gqlType);
			var typeName = type.name || type.kind;

			var typeMap = {
				'String': 'text',
				'Int': 'number',
				'Float': 'number',
				'Boolean': 'checkbox',
				'ID': 'hidden',
				'Date': 'date',
				'DateTime': 'datetime',
				'Time': 'time',
				'Email': 'email',
				'URL': 'url',
				'Phone': 'tel',
				'JSON': 'textarea'
			};

			return typeMap[typeName] || 'text';
		},

		/**
		 * Check if type is NonNull
		 * @param {Object} gqlType - GraphQL type
		 * @returns {boolean}
		 */
		isNonNull: function(gqlType) {
			return gqlType && gqlType.kind === 'NON_NULL';
		},

		/**
		 * Check if type is List
		 * @param {Object} gqlType - GraphQL type
		 * @returns {boolean}
		 */
		isList: function(gqlType) {
			var type = gqlType;
			while (type) {
				if (type.kind === 'LIST') {
					return true;
				}
				type = type.ofType;
			}
			return false;
		},

		/**
		 * Unwrap type wrappers (NonNull, List)
		 * @param {Object} gqlType - GraphQL type
		 * @returns {Object} Base type
		 */
		unwrapType: function(gqlType) {
			var type = gqlType;
			while (type && type.ofType) {
				type = type.ofType;
			}
			return type || {};
		},

		/**
		 * Get enum values if type is Enum
		 * @param {Object} gqlType - GraphQL type
		 * @returns {Array|null} Enum values or null
		 */
		getEnumValues: function(gqlType) {
			var type = this.unwrapType(gqlType);
			if (type.kind === 'ENUM' && type.enumValues) {
				return type.enumValues;
			}
			return null;
		}
	};

	// Register GraphQL adapter
	SchemaAdapter.register('graphql', GraphQLAdapter);

	// =========================================================================
	// EXPOSE API
	// =========================================================================

	// Register component using Funky registry
	if (global.Funky && global.Funky.register) {
		global.Funky.register('SchemaAdapter', SchemaAdapter);
	}

})(typeof window !== 'undefined' ? window : this);
