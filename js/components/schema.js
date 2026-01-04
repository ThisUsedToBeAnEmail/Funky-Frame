/**
 * Funky Schema - Centralized OpenAPI Schema Management
 * 
 * Fetches, caches, and provides access to JSON schemas from the OpenAPI spec.
 * Supports $ref resolution, cloning for safe modification, and runtime enhancement.
 * 
 * Usage:
 *   // Initialize on app load
 *   Funky.Schema.init();
 *   
 *   // Get schema (returns reference - do not modify)
 *   var schema = Funky.Schema.get('CreateClient');
 *   
 *   // Clone for modification
 *   var mySchema = Funky.Schema.clone('CreateClient');
 *   
 *   // Enhance with dynamic data
 *   var enhanced = Funky.Schema.enhance('CreateClient', {
 *     properties: {
 *       parent_id: { enum: [1, 2, 3], options: { enum_titles: ['A', 'B', 'C'] } }
 *     }
 *   });
 * 
 * @version 1.0.1
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Schema] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('Schema')) {
		return;
	}

	var spec = null;           // Full OpenAPI spec
	var schemas = null;        // Shortcut to components.schemas
	var resolved = {};         // Cache of resolved schemas
	var initPromise = null;    // Promise for async initialization
	var API_JSON_PATH = '/api.json';

	/**
	 * Deep clone an object
	 */
	function deepClone(obj) {
		if (obj === null || typeof obj !== 'object') return obj;
		return JSON.parse(JSON.stringify(obj));
	}

	/**
	 * Deep merge source into target
	 */
	function deepMerge(target, source) {
		if (!source || typeof source !== 'object') return target;
		
		Object.keys(source).forEach(function(key) {
			if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
				if (!target[key] || typeof target[key] !== 'object') {
					target[key] = {};
				}
				deepMerge(target[key], source[key]);
			} else {
				target[key] = source[key];
			}
		});
		
		return target;
	}

	/**
	 * Normalize a schema path to just the schema name
	 */
	function normalizePath(path) {
		if (!path) return null;
		return path
			.replace(/^#\//, '')
			.replace(/^components\/schemas\//, '')
			.replace(/\//g, '');
	}

	/**
	 * Resolve $ref values recursively
	 */
	function resolveRefs(obj, visited, getter) {
		if (!obj || typeof obj !== 'object') return obj;
		
		// Circular reference protection
		var objId = JSON.stringify(obj);
		if (visited[objId]) return obj;
		visited[objId] = true;

		// Handle $ref
		if (obj.$ref && typeof obj.$ref === 'string') {
			var refSchema = getter(obj.$ref);
			if (refSchema) {
				// Remove $ref and merge in resolved schema
				delete obj.$ref;
				var resolvedCopy = deepClone(refSchema);
				Object.keys(resolvedCopy).forEach(function(key) {
					if (!(key in obj)) {
						obj[key] = resolvedCopy[key];
					}
				});
				// Recursively resolve the merged schema
				resolveRefs(obj, visited, getter);
			}
		}

		// Recurse into nested objects and arrays
		Object.keys(obj).forEach(function(key) {
			if (obj[key] && typeof obj[key] === 'object') {
				if (Array.isArray(obj[key])) {
					obj[key].forEach(function(item, idx) {
						if (item && typeof item === 'object') {
							resolveRefs(item, visited, getter);
						}
					});
				} else {
					resolveRefs(obj[key], visited, getter);
				}
			}
		});

		return obj;
	}

	var FunkySchema = {
		/**
		 * Initialize by fetching the OpenAPI spec
		 * @param {string} [url] - Optional custom URL for api.json
		 * @returns {Promise} Resolves when spec is loaded
		 */
		init: function(url) {
			if (initPromise) return initPromise;

			var apiUrl = url || API_JSON_PATH;

			initPromise = fetch(apiUrl)
				.then(function(response) {
					if (!response.ok) {
						throw new Error('Failed to fetch ' + apiUrl + ': ' + response.status);
					}
					return response.json();
				})
				.then(function(data) {
					spec = data;
					schemas = (data.components && data.components.schemas) || {};
					console.log('[Funky.Schema] Loaded', Object.keys(schemas).length, 'schemas from', apiUrl);
					return FunkySchema;
				})
				.catch(function(err) {
					console.error('[Funky.Schema] Init failed:', err);
					// Reset promise to allow retry
					initPromise = null;
					throw err;
				});

			return initPromise;
		},

		/**
		 * Wait for schema to be ready
		 * @returns {Promise}
		 */
		ready: function() {
			if (initPromise) return initPromise;
			if (schemas) return Promise.resolve(FunkySchema);
			return Promise.reject(new Error('Schema not initialized. Call Funky.Schema.init() first.'));
		},

		/**
		 * Check if schemas are loaded
		 * @returns {boolean}
		 */
		isReady: function() {
			return schemas !== null;
		},

		/**
		 * Get a schema by name or path (returns reference - do not modify)
		 * @param {string} path - Schema name or path (e.g., 'CreateClient', '#/components/schemas/CreateClient')
		 * @returns {Object|null}
		 */
		get: function(path) {
			if (!schemas) {
				console.warn('[Funky.Schema] Not initialized. Call init() first.');
				return null;
			}

			var schemaName = normalizePath(path);
			if (!schemaName) return null;

			var schema = schemas[schemaName];
			if (!schema) {
				console.warn('[Funky.Schema] Schema not found:', schemaName);
				return null;
			}

			return schema;
		},

		/**
		 * Get a deep clone of a schema (safe to modify)
		 * @param {string} path - Schema name or path
		 * @returns {Object|null}
		 */
		clone: function(path) {
			var schema = this.get(path);
			if (!schema) return null;
			return deepClone(schema);
		},

		/**
		 * Resolve all $ref values in a schema
		 * @param {string|Object} schemaOrPath - Schema name or schema object
		 * @returns {Object|null} Fully resolved schema (cloned)
		 */
		resolve: function(schemaOrPath) {
			var schema;
			var cacheKey = null;

			if (typeof schemaOrPath === 'string') {
				cacheKey = normalizePath(schemaOrPath);
				
				// Check cache
				if (cacheKey && resolved[cacheKey]) {
					return deepClone(resolved[cacheKey]);
				}
				
				schema = this.clone(schemaOrPath);
			} else {
				schema = deepClone(schemaOrPath);
			}

			if (!schema) return null;

			var self = this;
			var result = resolveRefs(schema, {}, function(ref) {
				return self.get(ref);
			});

			// Cache if from named schema
			if (cacheKey) {
				resolved[cacheKey] = deepClone(result);
			}

			return result;
		},

		/**
		 * Clone and enhance a schema with runtime data
		 * @param {string|Object} schemaOrPath - Schema name or schema object
		 * @param {Object} enhancements - Properties to merge/enhance
		 * @returns {Object|null} Enhanced schema copy
		 */
		enhance: function(schemaOrPath, enhancements) {
			var schema;
			
			if (typeof schemaOrPath === 'string') {
				schema = this.clone(schemaOrPath);
			} else {
				schema = deepClone(schemaOrPath);
			}

			if (!schema || !enhancements) return schema;

			// Merge property enhancements (deep merge into existing properties)
			if (enhancements.properties && schema.properties) {
				Object.keys(enhancements.properties).forEach(function(prop) {
					if (schema.properties[prop]) {
						deepMerge(schema.properties[prop], enhancements.properties[prop]);
					} else {
						// Add new property
						schema.properties[prop] = deepClone(enhancements.properties[prop]);
					}
				});
			}

			// Override required array if provided
			if (enhancements.required !== undefined) {
				schema.required = enhancements.required;
			}

			// Merge any other top-level properties
			Object.keys(enhancements).forEach(function(key) {
				if (key !== 'properties' && key !== 'required') {
					if (typeof enhancements[key] === 'object' && !Array.isArray(enhancements[key])) {
						schema[key] = deepMerge(schema[key] || {}, enhancements[key]);
					} else {
						schema[key] = enhancements[key];
					}
				}
			});

			return schema;
		},

		/**
		 * Clone, resolve refs, and enhance in one call
		 * @param {string} path - Schema name or path
		 * @param {Object} [enhancements] - Optional enhancements
		 * @returns {Object|null} Fully processed schema
		 */
		getResolved: function(path, enhancements) {
			var schema = this.resolve(path);
			if (!schema) return null;
			if (enhancements) {
				return this.enhance(schema, enhancements);
			}
			return schema;
		},

		/**
		 * Get all available schema names
		 * @returns {string[]}
		 */
		list: function() {
			return schemas ? Object.keys(schemas) : [];
		},

		/**
		 * Search for schemas matching a pattern
		 * @param {string|RegExp} pattern - Name pattern to match
		 * @returns {string[]} Matching schema names
		 */
		search: function(pattern) {
			if (!schemas) return [];
			
			var regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
			return Object.keys(schemas).filter(function(name) {
				return regex.test(name);
			});
		},

		/**
		 * Get the raw OpenAPI spec (for advanced usage)
		 * @returns {Object|null}
		 */
		getSpec: function() {
			return spec;
		},

		/**
		 * Get API paths from the spec
		 * @param {string} [pathPattern] - Optional path pattern to filter
		 * @returns {Object} Matching paths
		 */
		getPaths: function(pathPattern) {
			if (!spec || !spec.paths) return {};
			if (!pathPattern) return spec.paths;

			var regex = new RegExp(pathPattern);
			var result = {};
			Object.keys(spec.paths).forEach(function(path) {
				if (regex.test(path)) {
					result[path] = spec.paths[path];
				}
			});
			return result;
		},

		/**
		 * Clear resolved schema cache
		 */
		clearCache: function() {
			resolved = {};
		},

		/**
		 * Re-initialize (fetch fresh spec)
		 * @param {string} [url] - Optional custom URL
		 * @returns {Promise}
		 */
		reload: function(url) {
			initPromise = null;
			spec = null;
			schemas = null;
			resolved = {};
			return this.init(url);
		}
	};

	// Register with Funky namespace
	Funky.register('Schema', FunkySchema);

})(window);
