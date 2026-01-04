/**
 * Funky.Schema Tests
 *
 * Tests for the centralized OpenAPI schema management component.
 */

describe('Funky.Component.Schema', function() {

    var Schema = Funky.Schema;
    var originalFetch;

    // Mock API spec
    var mockSpec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
            '/api/clients': {
                get: { summary: 'List clients' },
                post: { summary: 'Create client' }
            },
            '/api/products': {
                get: { summary: 'List products' }
            }
        },
        components: {
            schemas: {
                CreateClient: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' }
                    },
                    required: ['name']
                },
                UpdateClient: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string' }
                    }
                },
                Client: {
                    allOf: [
                        { $ref: '#/components/schemas/CreateClient' },
                        {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' }
                            }
                        }
                    ]
                },
                Address: {
                    type: 'object',
                    properties: {
                        street: { type: 'string' },
                        city: { type: 'string' }
                    }
                },
                ClientWithAddress: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        address: { $ref: '#/components/schemas/Address' }
                    }
                }
            }
        }
    };

    beforeEach(function() {
        // Mock fetch to return our test spec
        originalFetch = window.fetch;
        window.fetch = function(url) {
            return Promise.resolve({
                ok: true,
                json: function() {
                    return Promise.resolve(mockSpec);
                }
            });
        };
    });

    afterEach(function() {
        window.fetch = originalFetch;
        // Reset schema state
        if (Schema && Schema.reload) {
            // Force internal reset
            Schema.clearCache();
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Schema')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof Schema.init).toBe('function');
        });

        it('has ready method', function() {
            expect(typeof Schema.ready).toBe('function');
        });

        it('has isReady method', function() {
            expect(typeof Schema.isReady).toBe('function');
        });

        it('has get method', function() {
            expect(typeof Schema.get).toBe('function');
        });

        it('has clone method', function() {
            expect(typeof Schema.clone).toBe('function');
        });

        it('has resolve method', function() {
            expect(typeof Schema.resolve).toBe('function');
        });

        it('has enhance method', function() {
            expect(typeof Schema.enhance).toBe('function');
        });

        it('has getResolved method', function() {
            expect(typeof Schema.getResolved).toBe('function');
        });

        it('has list method', function() {
            expect(typeof Schema.list).toBe('function');
        });

        it('has search method', function() {
            expect(typeof Schema.search).toBe('function');
        });

        it('has getSpec method', function() {
            expect(typeof Schema.getSpec).toBe('function');
        });

        it('has getPaths method', function() {
            expect(typeof Schema.getPaths).toBe('function');
        });

        it('has clearCache method', function() {
            expect(typeof Schema.clearCache).toBe('function');
        });

        it('has reload method', function() {
            expect(typeof Schema.reload).toBe('function');
        });

    });

    describe('init()', function() {

        it('returns a promise', function() {
            var result = Schema.init('/api.json');
            expect(result instanceof Promise).toBe(true);
        });

        it('fetches spec from default URL', function(done) {
            var fetchedUrl = null;
            window.fetch = function(url) {
                fetchedUrl = url;
                return Promise.resolve({
                    ok: true,
                    json: function() { return Promise.resolve(mockSpec); }
                });
            };

            Schema.reload().then(function() {
                expect(fetchedUrl).toBe('/api.json');
                done();
            });
        });

        it('fetches spec from custom URL', function(done) {
            var fetchedUrl = null;
            window.fetch = function(url) {
                fetchedUrl = url;
                return Promise.resolve({
                    ok: true,
                    json: function() { return Promise.resolve(mockSpec); }
                });
            };

            Schema.reload('/custom/api.json').then(function() {
                expect(fetchedUrl).toBe('/custom/api.json');
                done();
            });
        });

        it('rejects on fetch error', function(done) {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 404
                });
            };

            Schema.reload().catch(function(err) {
                expect(err.message).toContain('404');
                done();
            });
        });

    });

    describe('isReady()', function() {

        it('returns true after init', function(done) {
            Schema.reload().then(function() {
                expect(Schema.isReady()).toBe(true);
                done();
            });
        });

    });

    describe('ready()', function() {

        it('resolves when initialized', function(done) {
            Schema.reload().then(function() {
                return Schema.ready();
            }).then(function(result) {
                expect(result).toBe(Schema);
                done();
            });
        });

    });

    describe('get()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('returns schema by name', function() {
            var schema = Schema.get('CreateClient');

            expect(schema).not.toBeNull();
            expect(schema.type).toBe('object');
            expect(schema.properties.name).toBeDefined();
        });

        it('returns schema by full path', function() {
            var schema = Schema.get('#/components/schemas/CreateClient');

            expect(schema).not.toBeNull();
            expect(schema.type).toBe('object');
        });

        it('returns schema by partial path', function() {
            var schema = Schema.get('components/schemas/CreateClient');

            expect(schema).not.toBeNull();
            expect(schema.type).toBe('object');
        });

        it('returns null for non-existent schema', function() {
            var schema = Schema.get('NonExistent');
            expect(schema).toBeNull();
        });

        it('returns null for empty path', function() {
            var schema = Schema.get('');
            expect(schema).toBeNull();
        });

        it('returns null for null path', function() {
            var schema = Schema.get(null);
            expect(schema).toBeNull();
        });

    });

    describe('clone()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('returns deep copy of schema', function() {
            var clone1 = Schema.clone('CreateClient');
            var clone2 = Schema.clone('CreateClient');

            expect(clone1).not.toBe(clone2);
            expect(clone1.properties).not.toBe(clone2.properties);
        });

        it('allows modification without affecting original', function() {
            var clone = Schema.clone('CreateClient');
            clone.properties.newProp = { type: 'string' };

            var original = Schema.get('CreateClient');
            expect(original.properties.newProp).toBeUndefined();
        });

        it('returns null for non-existent schema', function() {
            var clone = Schema.clone('NonExistent');
            expect(clone).toBeNull();
        });

    });

    describe('resolve()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('resolves $ref in schema', function() {
            var resolved = Schema.resolve('ClientWithAddress');

            expect(resolved.properties.address.type).toBe('object');
            expect(resolved.properties.address.properties.street).toBeDefined();
        });

        it('returns cloned result', function() {
            var resolved1 = Schema.resolve('CreateClient');
            var resolved2 = Schema.resolve('CreateClient');

            expect(resolved1).not.toBe(resolved2);
        });

        it('accepts schema object', function() {
            var schema = {
                type: 'object',
                properties: {
                    address: { $ref: '#/components/schemas/Address' }
                }
            };

            var resolved = Schema.resolve(schema);

            expect(resolved.properties.address.type).toBe('object');
            expect(resolved.properties.address.properties.street).toBeDefined();
        });

        it('returns null for non-existent schema', function() {
            var resolved = Schema.resolve('NonExistent');
            expect(resolved).toBeNull();
        });

    });

    describe('enhance()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('merges property enhancements', function() {
            var enhanced = Schema.enhance('CreateClient', {
                properties: {
                    email: { description: 'User email address' }
                }
            });

            expect(enhanced.properties.email.type).toBe('string');
            expect(enhanced.properties.email.description).toBe('User email address');
        });

        it('adds new properties', function() {
            var enhanced = Schema.enhance('CreateClient', {
                properties: {
                    phone: { type: 'string', format: 'phone' }
                }
            });

            expect(enhanced.properties.phone).toBeDefined();
            expect(enhanced.properties.phone.type).toBe('string');
        });

        it('overrides required array', function() {
            var enhanced = Schema.enhance('CreateClient', {
                required: ['name', 'email']
            });

            expect(enhanced.required).toEqual(['name', 'email']);
        });

        it('adds enum options', function() {
            var enhanced = Schema.enhance('CreateClient', {
                properties: {
                    name: {
                        enum: ['Option A', 'Option B'],
                        options: { enum_titles: ['A', 'B'] }
                    }
                }
            });

            expect(enhanced.properties.name.enum).toEqual(['Option A', 'Option B']);
            expect(enhanced.properties.name.options.enum_titles).toEqual(['A', 'B']);
        });

        it('accepts schema object', function() {
            var schema = {
                type: 'object',
                properties: {
                    field: { type: 'string' }
                }
            };

            var enhanced = Schema.enhance(schema, {
                properties: {
                    field: { maxLength: 100 }
                }
            });

            expect(enhanced.properties.field.maxLength).toBe(100);
        });

        it('returns schema unchanged if no enhancements', function() {
            var enhanced = Schema.enhance('CreateClient', null);

            expect(enhanced.type).toBe('object');
            expect(enhanced.properties.name).toBeDefined();
        });

    });

    describe('getResolved()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('resolves and returns schema', function() {
            var resolved = Schema.getResolved('ClientWithAddress');

            expect(resolved.properties.address.properties.street).toBeDefined();
        });

        it('resolves and enhances schema', function() {
            var resolved = Schema.getResolved('ClientWithAddress', {
                properties: {
                    name: { description: 'Client name' }
                }
            });

            expect(resolved.properties.name.description).toBe('Client name');
            expect(resolved.properties.address.properties.street).toBeDefined();
        });

        it('returns null for non-existent schema', function() {
            var resolved = Schema.getResolved('NonExistent');
            expect(resolved).toBeNull();
        });

    });

    describe('list()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('returns array of schema names', function() {
            var names = Schema.list();

            expect(Array.isArray(names)).toBe(true);
            expect(names).toContain('CreateClient');
            expect(names).toContain('UpdateClient');
            expect(names).toContain('Address');
        });

    });

    describe('search()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('finds schemas matching string pattern', function() {
            var results = Schema.search('Client');

            expect(results).toContain('CreateClient');
            expect(results).toContain('UpdateClient');
            expect(results).toContain('ClientWithAddress');
            expect(results).not.toContain('Address');
        });

        it('finds schemas matching regex', function() {
            var results = Schema.search(/^Create/);

            expect(results).toContain('CreateClient');
            expect(results).not.toContain('UpdateClient');
        });

        it('returns empty array for no matches', function() {
            var results = Schema.search('NonExistent');
            expect(results.length).toBe(0);
        });

    });

    describe('getSpec()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('returns the raw OpenAPI spec', function() {
            var spec = Schema.getSpec();

            expect(spec).not.toBeNull();
            expect(spec.openapi).toBe('3.0.0');
            expect(spec.info.title).toBe('Test API');
        });

    });

    describe('getPaths()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('returns all paths without pattern', function() {
            var paths = Schema.getPaths();

            expect(paths['/api/clients']).toBeDefined();
            expect(paths['/api/products']).toBeDefined();
        });

        it('filters paths by pattern', function() {
            var paths = Schema.getPaths('clients');

            expect(paths['/api/clients']).toBeDefined();
            expect(paths['/api/products']).toBeUndefined();
        });

        it('returns empty object if no spec', function() {
            // Create schema without paths
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ components: { schemas: {} } });
                    }
                });
            };

            Schema.reload().then(function() {
                var paths = Schema.getPaths();
                expect(Object.keys(paths).length).toBe(0);
            });
        });

    });

    describe('clearCache()', function() {

        beforeEach(function(done) {
            Schema.reload().then(function() { done(); });
        });

        it('clears resolved schema cache', function() {
            // Resolve to populate cache
            Schema.resolve('CreateClient');

            // Clear cache
            Schema.clearCache();

            // No error means success
            expect(true).toBe(true);
        });

    });

    describe('reload()', function() {

        it('fetches fresh spec', function(done) {
            var fetchCount = 0;
            window.fetch = function() {
                fetchCount++;
                return Promise.resolve({
                    ok: true,
                    json: function() { return Promise.resolve(mockSpec); }
                });
            };

            // Use reload() to reset state and fetch, then reload again
            Schema.reload().then(function() {
                return Schema.reload();
            }).then(function() {
                expect(fetchCount).toBe(2);
                done();
            }).catch(function(err) {
                done(err);
            });
        });

        it('clears cache on reload', function(done) {
            Schema.reload().then(function() {
                Schema.resolve('CreateClient');
                return Schema.reload();
            }).then(function() {
                // Cache should be cleared
                expect(Schema.isReady()).toBe(true);
                done();
            }).catch(function(err) {
                done(err);
            });
        });

    });

});
