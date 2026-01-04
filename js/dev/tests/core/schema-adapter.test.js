/**
 * Funky.SchemaAdapter Tests
 *
 * Tests for the generic schema conversion system that transforms
 * external formats (OpenAPI, GraphQL, Array) to native Funky format.
 */
describe('Funky.SchemaAdapter', function() {

    var SchemaAdapter;

    beforeAll(function() {
        SchemaAdapter = window.Funky && window.Funky.SchemaAdapter;
    });

    // =========================================================================
    // CORE API
    // =========================================================================

    describe('Core API', function() {

        it('exists on Funky namespace', function() {
            expect(SchemaAdapter).toBeDefined();
        });

        it('has register method', function() {
            expect(typeof SchemaAdapter.register).toBe('function');
        });

        it('has unregister method', function() {
            expect(typeof SchemaAdapter.unregister).toBe('function');
        });

        it('has get method', function() {
            expect(typeof SchemaAdapter.get).toBe('function');
        });

        it('has has method', function() {
            expect(typeof SchemaAdapter.has).toBe('function');
        });

        it('has list method', function() {
            expect(typeof SchemaAdapter.list).toBe('function');
        });

        it('has detect method', function() {
            expect(typeof SchemaAdapter.detect).toBe('function');
        });

        it('has convert method', function() {
            expect(typeof SchemaAdapter.convert).toBe('function');
        });

        it('has convertWith method', function() {
            expect(typeof SchemaAdapter.convertWith).toBe('function');
        });

    });

    // =========================================================================
    // ADAPTER REGISTRATION
    // =========================================================================

    describe('Adapter registration', function() {

        afterEach(function() {
            // Clean up test adapter
            SchemaAdapter.unregister('test-adapter');
        });

        it('can register custom adapter', function() {
            var adapter = {
                convert: function(schema) {
                    return { fields: { test: { type: 'text' } } };
                }
            };

            SchemaAdapter.register('test-adapter', adapter);

            expect(SchemaAdapter.has('test-adapter')).toBe(true);
        });

        it('rejects adapter without convert method', function() {
            spyOn(console, 'warn');

            SchemaAdapter.register('test-adapter', { foo: 'bar' });

            expect(console.warn).toHaveBeenCalled();
            expect(SchemaAdapter.has('test-adapter')).toBe(false);
        });

        it('can unregister adapter', function() {
            SchemaAdapter.register('test-adapter', {
                convert: function() { return { fields: {} }; }
            });

            expect(SchemaAdapter.has('test-adapter')).toBe(true);

            SchemaAdapter.unregister('test-adapter');

            expect(SchemaAdapter.has('test-adapter')).toBe(false);
        });

        it('get returns adapter by name', function() {
            var adapter = {
                convert: function() { return { fields: {} }; }
            };

            SchemaAdapter.register('test-adapter', adapter);

            expect(SchemaAdapter.get('test-adapter')).toBe(adapter);
        });

        it('get returns null for unknown adapter', function() {
            expect(SchemaAdapter.get('nonexistent')).toBeNull();
        });

        it('list returns all registered adapters', function() {
            var adapters = SchemaAdapter.list();

            expect(Array.isArray(adapters)).toBe(true);
            expect(adapters).toContain('openapi');
            expect(adapters).toContain('array');
            expect(adapters).toContain('graphql');
        });

    });

    // =========================================================================
    // BUILT-IN ADAPTERS
    // =========================================================================

    describe('Built-in adapters', function() {

        it('has openapi adapter registered', function() {
            expect(SchemaAdapter.has('openapi')).toBe(true);
        });

        it('has jsonschema adapter registered', function() {
            expect(SchemaAdapter.has('jsonschema')).toBe(true);
        });

        it('has array adapter registered', function() {
            expect(SchemaAdapter.has('array')).toBe(true);
        });

        it('has shorthand adapter registered', function() {
            expect(SchemaAdapter.has('shorthand')).toBe(true);
        });

        it('has graphql adapter registered', function() {
            expect(SchemaAdapter.has('graphql')).toBe(true);
        });

    });

    // =========================================================================
    // SCHEMA DETECTION
    // =========================================================================

    describe('Schema detection', function() {

        it('detects native schema format', function() {
            var schema = {
                fields: {
                    name: { type: 'text' }
                }
            };

            expect(SchemaAdapter.detect(schema)).toBe('native');
        });

        it('detects OpenAPI/JSON Schema format', function() {
            var schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };

            expect(SchemaAdapter.detect(schema)).toBe('openapi');
        });

        it('detects JSON Schema with $schema', function() {
            var schema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object'
            };

            expect(SchemaAdapter.detect(schema)).toBe('jsonschema');
        });

        it('detects JSON Schema with definitions', function() {
            var schema = {
                definitions: {},
                type: 'object'
            };

            expect(SchemaAdapter.detect(schema)).toBe('jsonschema');
        });

        it('detects array format', function() {
            var schema = [
                { name: 'field1', type: 'text' },
                { name: 'field2', type: 'number' }
            ];

            expect(SchemaAdapter.detect(schema)).toBe('array');
        });

        it('detects GraphQL format with inputFields', function() {
            var schema = {
                inputFields: [
                    { name: 'id', type: { name: 'String' } }
                ]
            };

            expect(SchemaAdapter.detect(schema)).toBe('graphql');
        });

        it('detects shorthand format', function() {
            var schema = {
                name: { type: 'text', required: true },
                email: { type: 'email' }
            };

            expect(SchemaAdapter.detect(schema)).toBe('shorthand');
        });

        it('returns unknown for null', function() {
            expect(SchemaAdapter.detect(null)).toBe('unknown');
        });

        it('returns unknown for undefined', function() {
            expect(SchemaAdapter.detect(undefined)).toBe('unknown');
        });

    });

    // =========================================================================
    // OPENAPI ADAPTER
    // =========================================================================

    describe('OpenAPI adapter', function() {

        it('converts basic properties', function() {
            var schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'integer' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.name).toBeDefined();
            expect(result.fields.name.type).toBe('text');
            expect(result.fields.age).toBeDefined();
            expect(result.fields.age.type).toBe('number');
        });

        it('handles required fields', function() {
            var schema = {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.name.required).toBe(true);
            expect(result.fields.email.required).toBe(false);
        });

        it('maps string type to text', function() {
            var schema = {
                type: 'object',
                properties: {
                    field: { type: 'string' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field.type).toBe('text');
        });

        it('maps integer type to number', function() {
            var schema = {
                type: 'object',
                properties: {
                    field: { type: 'integer' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field.type).toBe('number');
        });

        it('maps boolean type to checkbox', function() {
            var schema = {
                type: 'object',
                properties: {
                    active: { type: 'boolean' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.active.type).toBe('checkbox');
        });

        it('handles email format', function() {
            var schema = {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.email.type).toBe('email');
        });

        it('handles date format', function() {
            var schema = {
                type: 'object',
                properties: {
                    birthdate: { type: 'string', format: 'date' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.birthdate.type).toBe('date');
        });

        it('handles date-time format', function() {
            var schema = {
                type: 'object',
                properties: {
                    created_at: { type: 'string', format: 'date-time' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.created_at.type).toBe('datetime');
        });

        it('handles password format', function() {
            var schema = {
                type: 'object',
                properties: {
                    password: { type: 'string', format: 'password' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.password.type).toBe('password');
        });

        it('handles uri format', function() {
            var schema = {
                type: 'object',
                properties: {
                    website: { type: 'string', format: 'uri' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.website.type).toBe('url');
        });

        it('converts enum to select options', function() {
            var schema = {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['active', 'inactive', 'pending']
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.status.type).toBe('select');
            expect(result.fields.status.options).toEqual([
                { value: 'active', label: 'active' },
                { value: 'inactive', label: 'inactive' },
                { value: 'pending', label: 'pending' }
            ]);
        });

        it('handles x-enum-descriptions', function() {
            var schema = {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['active', 'inactive'],
                        'x-enum-descriptions': ['Active status', 'Inactive status']
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.status.options).toEqual([
                { value: 'active', label: 'Active status' },
                { value: 'inactive', label: 'Inactive status' }
            ]);
        });

        it('converts title to label', function() {
            var schema = {
                type: 'object',
                properties: {
                    full_name: {
                        type: 'string',
                        title: 'Full Name'
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.full_name.label).toBe('Full Name');
        });

        it('humanizes field name when no title', function() {
            var schema = {
                type: 'object',
                properties: {
                    first_name: { type: 'string' },
                    lastName: { type: 'string' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.first_name.label).toBe('First name');
            expect(result.fields.lastName.label).toBe('Last Name');
        });

        it('converts description to help', function() {
            var schema = {
                type: 'object',
                properties: {
                    email: {
                        type: 'string',
                        description: 'Your contact email address'
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.email.help).toBe('Your contact email address');
        });

        it('handles minLength constraint', function() {
            var schema = {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 2 }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.name.minLength).toBe(2);
        });

        it('handles maxLength constraint', function() {
            var schema = {
                type: 'object',
                properties: {
                    name: { type: 'string', maxLength: 100 }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.name.maxLength).toBe(100);
        });

        it('handles pattern constraint', function() {
            var schema = {
                type: 'object',
                properties: {
                    code: { type: 'string', pattern: '^[A-Z]{3}$' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.code.pattern).toBe('^[A-Z]{3}$');
        });

        it('handles minimum constraint', function() {
            var schema = {
                type: 'object',
                properties: {
                    age: { type: 'integer', minimum: 0 }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.age.min).toBe(0);
        });

        it('handles maximum constraint', function() {
            var schema = {
                type: 'object',
                properties: {
                    age: { type: 'integer', maximum: 150 }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.age.max).toBe(150);
        });

        it('handles multipleOf as step', function() {
            var schema = {
                type: 'object',
                properties: {
                    quantity: { type: 'integer', multipleOf: 5 }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.quantity.step).toBe(5);
        });

        it('handles default value', function() {
            var schema = {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        default: 'pending'
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.status.defaultValue).toBe('pending');
        });

        it('handles readOnly', function() {
            var schema = {
                type: 'object',
                properties: {
                    id: { type: 'string', readOnly: true }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.id.readonly).toBe(true);
        });

        it('handles nullable (OpenAPI 3.0)', function() {
            var schema = {
                type: 'object',
                properties: {
                    middle_name: { type: 'string', nullable: true }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.middle_name.nullable).toBe(true);
        });

        it('handles anyOf for nullable (OpenAPI 3.1)', function() {
            var schema = {
                type: 'object',
                properties: {
                    nickname: {
                        anyOf: [
                            { type: 'string' },
                            { type: 'null' }
                        ]
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.nickname.type).toBe('text');
        });

        it('handles x-funky-field extension', function() {
            var schema = {
                type: 'object',
                properties: {
                    parent_id: {
                        type: 'string',
                        'x-funky-field': {
                            type: 'combobox',
                            remote: { url: '/api/parents' }
                        }
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.parent_id.type).toBe('combobox');
            expect(result.fields.parent_id.remote).toEqual({ url: '/api/parents' });
        });

        it('handles x-funky-type extension', function() {
            var schema = {
                type: 'object',
                properties: {
                    avatar: {
                        type: 'string',
                        'x-funky-type': 'file'
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.avatar.type).toBe('file');
        });

        it('handles x-funky-dependsOn extension', function() {
            var schema = {
                type: 'object',
                properties: {
                    has_children: { type: 'boolean' },
                    num_children: {
                        type: 'integer',
                        'x-funky-dependsOn': {
                            field: 'has_children',
                            equals: true
                        }
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.num_children.dependsOn).toEqual({
                field: 'has_children',
                equals: true
            });
        });

        it('handles array type with items enum', function() {
            var schema = {
                type: 'object',
                properties: {
                    tags: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['tag1', 'tag2', 'tag3']
                        }
                    }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.tags.multiple).toBe(true);
            expect(result.fields.tags.options).toBeDefined();
        });

        it('returns empty fields for empty properties', function() {
            var schema = {
                type: 'object',
                properties: {}
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields).toEqual({});
        });

    });

    // =========================================================================
    // ARRAY ADAPTER
    // =========================================================================

    describe('Array adapter', function() {

        it('converts array of field definitions', function() {
            var schema = [
                { name: 'name', type: 'text', required: true },
                { name: 'email', type: 'email' }
            ];

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.name).toBeDefined();
            expect(result.fields.name.type).toBe('text');
            expect(result.fields.name.required).toBe(true);
            expect(result.fields.email).toBeDefined();
            expect(result.fields.email.type).toBe('email');
        });

        it('uses id as fallback for name', function() {
            var schema = [
                { id: 'field1', type: 'text' }
            ];

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field1).toBeDefined();
        });

        it('generates name from index if missing', function() {
            var schema = [
                { type: 'text' }
            ];

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field_0).toBeDefined();
        });

        it('defaults type to text', function() {
            var schema = [
                { name: 'field1' }
            ];

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field1.type).toBe('text');
        });

        it('auto-generates label from name', function() {
            var schema = [
                { name: 'first_name', type: 'text' }
            ];

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.first_name.label).toBe('First name');
        });

        it('normalizes string options to objects', function() {
            var schema = [
                {
                    name: 'country',
                    type: 'select',
                    options: ['US', 'UK', 'CA']
                }
            ];

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.country.options).toEqual([
                { value: 'US', label: 'US' },
                { value: 'UK', label: 'UK' },
                { value: 'CA', label: 'CA' }
            ]);
        });

        it('preserves object options', function() {
            var schema = [
                {
                    name: 'country',
                    type: 'select',
                    options: [
                        { value: 'us', label: 'United States' },
                        { value: 'uk', label: 'United Kingdom' }
                    ]
                }
            ];

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.country.options).toEqual([
                { value: 'us', label: 'United States' },
                { value: 'uk', label: 'United Kingdom' }
            ]);
        });

        it('returns empty fields for empty array', function() {
            var schema = [];

            var result = SchemaAdapter.convert(schema);

            expect(result.fields).toEqual({});
        });

        it('returns empty fields for non-array', function() {
            var result = SchemaAdapter.convertWith('array', 'not an array');

            expect(result.fields).toEqual({});
        });

    });

    // =========================================================================
    // SHORTHAND ADAPTER
    // =========================================================================

    describe('Shorthand adapter', function() {

        it('converts shorthand object format', function() {
            var schema = {
                name: { type: 'text', required: true },
                email: { type: 'email' }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.name).toBeDefined();
            expect(result.fields.name.type).toBe('text');
            expect(result.fields.name.required).toBe(true);
            expect(result.fields.email.type).toBe('email');
        });

        it('handles string shorthand (just type)', function() {
            var schema = {
                name: 'text',
                age: 'number'
            };

            var result = SchemaAdapter.convertWith('shorthand', schema);

            expect(result.fields.name.type).toBe('text');
            expect(result.fields.age.type).toBe('number');
        });

        it('auto-generates label from name', function() {
            var schema = {
                first_name: { type: 'text' }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.first_name.label).toBe('First name');
        });

        it('normalizes string options', function() {
            var schema = {
                country: {
                    type: 'select',
                    options: ['US', 'UK']
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.country.options).toEqual([
                { value: 'US', label: 'US' },
                { value: 'UK', label: 'UK' }
            ]);
        });

    });

    // =========================================================================
    // GRAPHQL ADAPTER
    // =========================================================================

    describe('GraphQL adapter', function() {

        it('converts inputFields array', function() {
            var schema = {
                inputFields: [
                    {
                        name: 'title',
                        type: { kind: 'SCALAR', name: 'String' }
                    },
                    {
                        name: 'count',
                        type: { kind: 'SCALAR', name: 'Int' }
                    }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.title).toBeDefined();
            expect(result.fields.title.type).toBe('text');
            expect(result.fields.count.type).toBe('number');
        });

        it('handles NON_NULL wrapper for required', function() {
            var schema = {
                inputFields: [
                    {
                        name: 'name',
                        type: {
                            kind: 'NON_NULL',
                            ofType: { kind: 'SCALAR', name: 'String' }
                        }
                    }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.name.required).toBe(true);
        });

        it('maps GraphQL String to text', function() {
            var schema = {
                inputFields: [
                    { name: 'field', type: { name: 'String' } }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field.type).toBe('text');
        });

        it('maps GraphQL Int to number', function() {
            var schema = {
                inputFields: [
                    { name: 'field', type: { name: 'Int' } }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field.type).toBe('number');
        });

        it('maps GraphQL Float to number', function() {
            var schema = {
                inputFields: [
                    { name: 'field', type: { name: 'Float' } }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field.type).toBe('number');
        });

        it('maps GraphQL Boolean to checkbox', function() {
            var schema = {
                inputFields: [
                    { name: 'field', type: { name: 'Boolean' } }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field.type).toBe('checkbox');
        });

        it('maps GraphQL ID to hidden', function() {
            var schema = {
                inputFields: [
                    { name: 'id', type: { name: 'ID' } }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.id.type).toBe('hidden');
        });

        it('handles LIST type for multiple', function() {
            var schema = {
                inputFields: [
                    {
                        name: 'tags',
                        type: {
                            kind: 'LIST',
                            ofType: { kind: 'SCALAR', name: 'String' }
                        }
                    }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.tags.multiple).toBe(true);
        });

        it('converts description to help', function() {
            var schema = {
                inputFields: [
                    {
                        name: 'email',
                        description: 'Your email address',
                        type: { name: 'String' }
                    }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.email.help).toBe('Your email address');
        });

        it('humanizes field name for label', function() {
            var schema = {
                inputFields: [
                    { name: 'first_name', type: { name: 'String' } }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.first_name.label).toBe('First name');
        });

        it('handles ENUM type', function() {
            var schema = {
                inputFields: [
                    {
                        name: 'status',
                        type: {
                            kind: 'ENUM',
                            name: 'Status',
                            enumValues: [
                                { name: 'ACTIVE', description: 'Active' },
                                { name: 'INACTIVE', description: 'Inactive' }
                            ]
                        }
                    }
                ]
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.status.type).toBe('select');
            expect(result.fields.status.options).toEqual([
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
            ]);
        });

    });

    // =========================================================================
    // CONVERT METHOD
    // =========================================================================

    describe('convert method', function() {

        it('auto-detects and converts OpenAPI schema', function() {
            var schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.name).toBeDefined();
        });

        it('auto-detects and converts array schema', function() {
            var schema = [
                { name: 'field1', type: 'text' }
            ];

            var result = SchemaAdapter.convert(schema);

            expect(result.fields.field1).toBeDefined();
        });

        it('passes through native schema unchanged', function() {
            var schema = {
                fields: {
                    name: { type: 'text', label: 'Name' }
                }
            };

            var result = SchemaAdapter.convert(schema);

            expect(result).toBe(schema);
        });

        it('returns empty fields for null', function() {
            var result = SchemaAdapter.convert(null);

            expect(result.fields).toEqual({});
        });

        it('warns and returns empty for unknown schema', function() {
            spyOn(console, 'warn');

            var result = SchemaAdapter.convert({ unknown: 'format' });

            expect(console.warn).toHaveBeenCalled();
            expect(result.fields).toEqual({});
        });

    });

    // =========================================================================
    // CONVERT WITH METHOD
    // =========================================================================

    describe('convertWith method', function() {

        it('converts using specified adapter', function() {
            var schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };

            var result = SchemaAdapter.convertWith('openapi', schema);

            expect(result.fields.name).toBeDefined();
        });

        it('warns and returns empty for unknown adapter', function() {
            spyOn(console, 'warn');

            var result = SchemaAdapter.convertWith('nonexistent', {});

            expect(console.warn).toHaveBeenCalled();
            expect(result.fields).toEqual({});
        });

    });

    // =========================================================================
    // INTEGRATION WITH FORM
    // =========================================================================

    describe('Integration with Form', function() {

        var Form;
        var container;

        beforeEach(function() {
            Form = window.Funky && window.Funky.Form;

            container = document.createElement('div');
            container.id = 'schema-adapter-form-container';
            document.body.appendChild(container);
        });

        afterEach(function() {
            if (Form) {
                Form.destroy('#schema-adapter-form-container');
            }
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });

        it('Form.create accepts OpenAPI schema', function() {
            if (!Form) {
                pending('Funky.Form not available');
                return;
            }

            var form = Form.create('#schema-adapter-form-container', {
                schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', title: 'Name' }
                    }
                }
            });

            expect(form).toBeDefined();
            expect(container.querySelector('[data-field="name"]')).not.toBeNull();
        });

        it('Form.create accepts array schema', function() {
            if (!Form) {
                pending('Funky.Form not available');
                return;
            }

            var form = Form.create('#schema-adapter-form-container', {
                schema: [
                    { name: 'username', type: 'text' }
                ]
            });

            expect(form).toBeDefined();
            expect(container.querySelector('[data-field="username"]')).not.toBeNull();
        });

        it('Form.create accepts shorthand schema', function() {
            if (!Form) {
                pending('Funky.Form not available');
                return;
            }

            var form = Form.create('#schema-adapter-form-container', {
                schema: {
                    email: { type: 'email', required: true }
                }
            });

            expect(form).toBeDefined();
            expect(container.querySelector('[data-field="email"]')).not.toBeNull();
        });

    });

});
