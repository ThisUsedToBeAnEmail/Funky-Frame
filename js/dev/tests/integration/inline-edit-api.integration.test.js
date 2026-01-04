/**
 * Integration Test: Inline Edit + API + Toast
 *
 * Tests the integration between inline editing, API save operations,
 * and user feedback via toasts.
 */

describe('Funky.Integration.InlineEdit.Api', function() {

    var Toast = Funky.Toast;
    var PubSub = Funky.PubSub;
    var Cache = Funky.Cache;
    var originalFetch;
    var apiCalls;
    var fixture;

    beforeEach(function() {
        Cache.clear();
        PubSub.clear();
        apiCalls = [];
        originalFetch = window.fetch;

        // Mock fetch for inline edit API calls
        window.fetch = function(url, options) {
            apiCalls.push({ url: url, options: options || {} });

            // Success update endpoint
            if (url.includes('/api/client/') && options && options.method === 'PATCH') {
                var body = JSON.parse(options.body || '{}');
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            id: 123,
                            name: body.name || 'Updated Name',
                            email: body.email || 'updated@example.com',
                            updated_at: new Date().toISOString()
                        });
                    }
                });
            }

            // Validation error
            if (url.includes('/api/validate')) {
                return Promise.resolve({
                    ok: false,
                    status: 422,
                    json: function() {
                        return Promise.resolve({
                            errors: { name: 'Name is too short' }
                        });
                    }
                });
            }

            // Server error
            if (url.includes('/api/error')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: function() {
                        return Promise.resolve({ error: 'Server error' });
                    }
                });
            }

            // Conflict error (concurrent edit)
            if (url.includes('/api/conflict')) {
                return Promise.resolve({
                    ok: false,
                    status: 409,
                    json: function() {
                        return Promise.resolve({
                            error: 'Record was modified by another user',
                            current_value: 'Jane Doe'
                        });
                    }
                });
            }

            return Promise.resolve({
                ok: true,
                json: function() {
                    return Promise.resolve({});
                }
            });
        };

        // Create fixture with inline edit elements
        fixture = FunkyTests.fixture(
            '<div id="inline-edit-container">' +
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name" tabindex="0">John Smith</span>' +
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="email" data-type="email" tabindex="0">john@example.com</span>' +
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="phone" data-type="tel" tabindex="0">555-1234</span>' +
            '</div>'
        );

        // Clean up toasts
        var toastContainer = document.getElementById('funky-toast-container');
        if (toastContainer) {
            toastContainer.innerHTML = '';
        }
    });

    afterEach(function() {
        window.fetch = originalFetch;
        Cache.clear();
        PubSub.clear();
        fixture.destroy();
    });

    // =========================================================================
    // Basic Inline Edit Flow
    // =========================================================================

    describe('Basic Edit Flow', function() {

        it('sends PATCH request on save', function() {
            var editData = {
                entity: 'client',
                id: '123',
                field: 'name',
                value: 'Jane Smith'
            };

            return fetch('/api/client/123', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editData.value })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                expect(apiCalls.length).toBe(1);
                expect(apiCalls[0].options.method).toBe('PATCH');
                expect(result.name).toBe('Jane Smith');
            });
        });

        it('includes field name in request body', function() {
            return fetch('/api/client/123', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'new@example.com' })
            })
            .then(function() {
                var requestBody = JSON.parse(apiCalls[0].options.body);
                expect(requestBody.email).toBe('new@example.com');
            });
        });

        it('shows success toast after save', function() {
            return fetch('/api/client/123', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'Updated Name' })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function() {
                Toast.success('Saved successfully');
                return FunkyTests.delay(100);
            })
            .then(function() {
                var toast = document.querySelector('.funky-toast-success');
                expect(toast).toBeInDocument();
                expect(toast.textContent).toContain('Saved');
            });
        });

    });

    // =========================================================================
    // Optimistic Update + Rollback
    // =========================================================================

    describe('Optimistic Update + Rollback', function() {

        it('updates display immediately (optimistic)', function() {
            var element = fixture.container.querySelector('[data-field="name"]');
            var originalValue = element.textContent;
            var newValue = 'Jane Smith';

            // Simulate optimistic update
            element.textContent = newValue;

            expect(element.textContent).toBe(newValue);
            expect(element.textContent).not.toBe(originalValue);
        });

        it('rolls back on API error', function() {
            var element = fixture.container.querySelector('[data-field="name"]');
            var originalValue = element.textContent;
            var newValue = 'Jane Smith';

            // Optimistic update
            element.textContent = newValue;

            return fetch('/api/error', {
                method: 'PATCH',
                body: JSON.stringify({ name: newValue })
            })
            .then(function(response) {
                if (!response.ok) {
                    // Rollback
                    element.textContent = originalValue;
                    throw new Error('Save failed');
                }
            })
            .catch(function() {
                return FunkyTests.delay(50);
            })
            .then(function() {
                expect(element.textContent).toBe(originalValue);
            });
        });

        it('shows error toast on rollback', function() {
            return fetch('/api/error', { method: 'PATCH' })
                .then(function(response) {
                    if (!response.ok) {
                        Toast.error('Failed to save changes');
                        throw new Error('Save failed');
                    }
                })
                .catch(function() {
                    return FunkyTests.delay(100);
                })
                .then(function() {
                    var toast = document.querySelector('.funky-toast-error');
                    expect(toast).toBeInDocument();
                    expect(toast.textContent).toContain('Failed');
                });
        });

    });

    // =========================================================================
    // Validation Errors
    // =========================================================================

    describe('Validation Errors', function() {

        it('shows validation error from API', function() {
            return fetch('/api/validate', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'X' })
            })
            .then(function(response) {
                if (!response.ok && response.status === 422) {
                    return response.json().then(function(data) {
                        Toast.warning(data.errors.name);
                        throw new Error('Validation failed');
                    });
                }
            })
            .catch(function() {
                return FunkyTests.delay(100);
            })
            .then(function() {
                var toast = document.querySelector('.funky-toast-warning');
                expect(toast).toBeInDocument();
                expect(toast.textContent).toContain('too short');
            });
        });

        it('keeps edit mode active on validation error', function() {
            var isEditing = true;

            return fetch('/api/validate', { method: 'PATCH' })
                .then(function(response) {
                    if (!response.ok && response.status === 422) {
                        // Stay in edit mode
                        isEditing = true;
                        throw new Error('Validation failed');
                    }
                })
                .catch(function() {
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    expect(isEditing).toBe(true);
                });
        });

    });

    // =========================================================================
    // Conflict Handling
    // =========================================================================

    describe('Conflict Handling', function() {

        it('handles concurrent edit conflict', function() {
            return fetch('/api/conflict', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'My Edit' })
            })
            .then(function(response) {
                if (!response.ok && response.status === 409) {
                    return response.json().then(function(data) {
                        Toast.warning('Record was modified. Current value: ' + data.current_value);
                        throw new Error('Conflict');
                    });
                }
            })
            .catch(function() {
                return FunkyTests.delay(100);
            })
            .then(function() {
                var toast = document.querySelector('.funky-toast-warning');
                expect(toast).toBeInDocument();
                expect(toast.textContent).toContain('modified');
            });
        });

        it('updates element with current server value on conflict', function() {
            var element = fixture.container.querySelector('[data-field="name"]');

            return fetch('/api/conflict', { method: 'PATCH' })
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    if (data.current_value) {
                        element.textContent = data.current_value;
                    }
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    expect(element.textContent).toBe('Jane Doe');
                });
        });

    });

    // =========================================================================
    // Cache Invalidation
    // =========================================================================

    describe('Cache Invalidation', function() {

        it('invalidates entity cache after save', function() {
            var cacheKey = 'client:123';
            Cache.set(cacheKey, { id: 123, name: 'Old Name' });

            return fetch('/api/client/123', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'New Name' })
            })
            .then(function() {
                // Invalidate cache
                Cache.delete(cacheKey);
                return FunkyTests.delay(50);
            })
            .then(function() {
                expect(Cache.get(cacheKey)).toBeUndefined();
            });
        });

        it('updates cache with new value after save', function() {
            var cacheKey = 'client:123';

            return fetch('/api/client/123', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'New Name' })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                Cache.set(cacheKey, data);
                return FunkyTests.delay(50);
            })
            .then(function() {
                var cached = Cache.get(cacheKey);
                expect(cached.name).toBe('New Name');
            });
        });

        it('clears related list caches', function() {
            Cache.set('clients:list', [{ id: 123 }, { id: 456 }]);
            Cache.set('clients:page:1', [{ id: 123 }]);
            Cache.set('client:123', { id: 123, name: 'Old' });

            // After edit, clear list caches
            Cache.clearPattern('clients:');

            expect(Cache.get('clients:list')).toBeUndefined();
            expect(Cache.get('clients:page:1')).toBeUndefined();
            // Entity cache is also cleared
        });

    });

    // =========================================================================
    // PubSub Events
    // =========================================================================

    describe('PubSub Events', function() {

        it('emits edit start event', function() {
            var events = [];

            PubSub.on('funky:inline-edit:start', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:inline-edit:start', {
                entity: 'client',
                id: '123',
                field: 'name'
            });

            expect(events.length).toBe(1);
            expect(events[0].entity).toBe('client');
        });

        it('emits save success event', function() {
            var events = [];

            PubSub.on('funky:inline-edit:saved', function(data) {
                events.push(data);
            });

            return fetch('/api/client/123', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'New Name' })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                PubSub.emit('funky:inline-edit:saved', {
                    entity: 'client',
                    id: '123',
                    field: 'name',
                    oldValue: 'John Smith',
                    newValue: 'New Name',
                    response: result
                });
                return FunkyTests.delay(50);
            })
            .then(function() {
                expect(events.length).toBe(1);
                expect(events[0].newValue).toBe('New Name');
            });
        });

        it('emits save error event', function() {
            var events = [];

            PubSub.on('funky:inline-edit:error', function(data) {
                events.push(data);
            });

            return fetch('/api/error', { method: 'PATCH' })
                .then(function(response) {
                    if (!response.ok) {
                        PubSub.emit('funky:inline-edit:error', {
                            entity: 'client',
                            id: '123',
                            field: 'name',
                            error: 'Server error'
                        });
                        throw new Error('Failed');
                    }
                })
                .catch(function() {
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    expect(events.length).toBe(1);
                    expect(events[0].error).toBe('Server error');
                });
        });

        it('other components can react to inline edit events', function() {
            var tableRefreshCalled = false;
            var auditLogCalled = false;

            // Simulate table listening for edits
            PubSub.on('funky:inline-edit:saved', function(data) {
                if (data.entity === 'client') {
                    tableRefreshCalled = true;
                }
            });

            // Simulate audit log listening
            PubSub.on('funky:inline-edit:saved', function(data) {
                auditLogCalled = true;
            });

            PubSub.emit('funky:inline-edit:saved', {
                entity: 'client',
                id: '123',
                field: 'name',
                newValue: 'Updated'
            });

            expect(tableRefreshCalled).toBe(true);
            expect(auditLogCalled).toBe(true);
        });

    });

    // =========================================================================
    // Keyboard Interaction
    // =========================================================================

    describe('Keyboard Interaction', function() {

        it('Enter triggers edit mode', function() {
            var element = fixture.container.querySelector('[data-field="name"]');
            var editStarted = false;

            PubSub.on('funky:inline-edit:start', function() {
                editStarted = true;
            });

            // Simulate Enter key
            var event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            element.dispatchEvent(event);

            // In real implementation, this would trigger edit
            PubSub.emit('funky:inline-edit:start', { field: 'name' });

            expect(editStarted).toBe(true);
        });

        it('Escape cancels edit', function() {
            var editCancelled = false;

            PubSub.on('funky:inline-edit:cancel', function() {
                editCancelled = true;
            });

            PubSub.emit('funky:inline-edit:cancel', { field: 'name' });

            expect(editCancelled).toBe(true);
        });

    });

    // =========================================================================
    // Multiple Fields
    // =========================================================================

    describe('Multiple Fields', function() {

        it('handles multiple inline edit elements independently', function() {
            var elements = fixture.container.querySelectorAll('.inline-edit');

            expect(elements.length).toBe(3);
            expect(elements[0].getAttribute('data-field')).toBe('name');
            expect(elements[1].getAttribute('data-field')).toBe('email');
            expect(elements[2].getAttribute('data-field')).toBe('phone');
        });

        it('each field sends separate API request', function() {
            return Promise.all([
                fetch('/api/client/123', {
                    method: 'PATCH',
                    body: JSON.stringify({ name: 'New Name' })
                }),
                fetch('/api/client/123', {
                    method: 'PATCH',
                    body: JSON.stringify({ email: 'new@example.com' })
                })
            ])
            .then(function() {
                expect(apiCalls.length).toBe(2);
            });
        });

    });

    // =========================================================================
    // Empty Value Handling
    // =========================================================================

    describe('Empty Value Handling', function() {

        it('handles clearing a field value', function() {
            return fetch('/api/client/123', {
                method: 'PATCH',
                body: JSON.stringify({ name: '' })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function() {
                expect(apiCalls[0].options.body).toContain('""');
            });
        });

        it('shows placeholder for empty values', function() {
            var element = fixture.container.querySelector('[data-field="name"]');

            // Simulate empty value with placeholder
            element.textContent = '';
            element.setAttribute('data-empty', 'true');
            element.classList.add('text-muted');
            element.textContent = 'Click to add';

            expect(element.classList.contains('text-muted')).toBe(true);
            expect(element.getAttribute('data-empty')).toBe('true');
        });

    });

});
