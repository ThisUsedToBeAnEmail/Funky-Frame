/**
 * InlineEdit Unit Tests
 *
 * Tests for Funky.InlineEdit - click-to-edit functionality.
 */

describe('Funky.Component.InlineEdit', function() {

    var InlineEdit = Funky.InlineEdit;
    var fixture;
    var originalFetch;

    beforeEach(function() {
        fixture = FunkyTests.fixture();

        // Mock fetch for API calls
        originalFetch = window.fetch;
        window.fetch = function() {
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                text: function() {
                    return Promise.resolve(JSON.stringify({ success: true }));
                }
            });
        };

        // Set CSRF token
        document.cookie = 'csrf_token=test_token_123';
    });

    afterEach(function() {
        if (InlineEdit && typeof InlineEdit.destroyAll === 'function') {
            InlineEdit.destroyAll();
        }
        fixture.cleanup();
        window.fetch = originalFetch;
        document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    });

    describe('Module registration', function() {

        it('is registered with Funky', function() {
            expect(Funky.InlineEdit).toBeDefined();
        });

        it('has required methods', function() {
            expect(typeof InlineEdit.init).toBe('function');
            expect(typeof InlineEdit.getInstance).toBe('function');
            expect(typeof InlineEdit.destroyAll).toBe('function');
        });

    });

    describe('Initialization', function() {

        it('auto-initializes elements with .inline-edit class', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();

            var el = fixture.query('.inline-edit');
            expect(el._inlineEdit).toBeDefined();
        });

        it('getInstance returns the instance', function() {
            fixture.html(
                '<span class="inline-edit" id="editName" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();

            var instance = InlineEdit.getInstance('#editName');
            expect(instance).toBeDefined();
            expect(instance).toBeTruthy();
        });

    });

    describe('Edit mode activation', function() {

        it('click starts edit mode', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');

            el.click();

            expect(el._inlineEdit.isEditing).toBe(true);
        });

        it('creates input when edit starts', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');

            el.click();

            var input = fixture.container.querySelector('.inline-edit-input');
            expect(input).not.toBeNull();
        });

        it('input has original value', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John Smith</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');

            el.click();

            var input = fixture.container.querySelector('.inline-edit-input');
            expect(input.value).toBe('John Smith');
        });

        it('emits inlineedit:start event', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            var eventFired = false;

            el.addEventListener('funky.inline-edit.start', function() {
                eventFired = true;
            });

            el.click();

            expect(eventFired).toBe(true);
        });

    });

    describe('Edit cancellation', function() {

        it('Escape cancels edit', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            el.click();

            var input = fixture.container.querySelector('.inline-edit-input');
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

            expect(el._inlineEdit.isEditing).toBe(false);
        });

        it('cancelEdit restores original value', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            el.click();

            var input = fixture.container.querySelector('.inline-edit-input');
            input.value = 'Changed';
            el._inlineEdit.cancelEdit();

            expect(el.textContent).toBe('John');
        });

        it('emits inlineedit:cancel event', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            var eventFired = false;

            el.addEventListener('funky.inline-edit.cancel', function() {
                eventFired = true;
            });

            el.click();
            el._inlineEdit.cancelEdit();

            expect(eventFired).toBe(true);
        });

    });

    describe('Input types', function() {

        it('creates text input by default', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            fixture.query('.inline-edit').click();

            var input = fixture.container.querySelector('.inline-edit-input');
            expect(input.type).toBe('text');
        });

        it('creates number input for data-type="number"', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="age" data-type="number">25</span>'
            );

            InlineEdit.init();
            fixture.query('.inline-edit').click();

            var input = fixture.container.querySelector('.inline-edit-input');
            expect(input.type).toBe('number');
        });

        it('creates textarea for data-type="textarea"', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="notes" data-type="textarea">Notes here</span>'
            );

            InlineEdit.init();
            fixture.query('.inline-edit').click();

            var input = fixture.container.querySelector('.inline-edit-textarea');
            expect(input.tagName.toLowerCase()).toBe('textarea');
        });

        it('creates date input for data-type="date"', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="dob" data-type="date">2000-01-01</span>'
            );

            InlineEdit.init();
            fixture.query('.inline-edit').click();

            var input = fixture.container.querySelector('.inline-edit-input');
            expect(input.type).toBe('date');
        });

        it('creates select for data-type="select"', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="status" data-type="select" ' +
                    'data-options=\'[{"value":"active","label":"Active"},{"value":"inactive","label":"Inactive"}]\'>' +
                    'Active</span>'
            );

            InlineEdit.init();
            fixture.query('.inline-edit').click();

            var select = fixture.container.querySelector('.inline-edit-select');
            expect(select.tagName.toLowerCase()).toBe('select');
        });

    });

    describe('Validation', function() {

        it('validates required field', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name" data-required="true">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            el.click();

            var input = fixture.container.querySelector('.inline-edit-input');
            input.value = '';

            // Try to save
            el._inlineEdit.save();

            // Should still be editing (validation failed)
            expect(el._inlineEdit.isEditing).toBe(true);
        });

        it('validates number field range', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="age" data-type="number" data-min="18" data-max="100">25</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            el.click();

            var input = fixture.container.querySelector('.inline-edit-input');
            input.value = '10'; // Below min

            el._inlineEdit.save();

            // Should still be editing (validation failed)
            expect(el._inlineEdit.isEditing).toBe(true);
        });

        it('validates pattern', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="email" ' +
                    'data-pattern="^[a-z@.]+$" data-pattern-message="Invalid email">test@example.com</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            el.click();

            var input = fixture.container.querySelector('.inline-edit-input');
            input.value = 'INVALID';

            el._inlineEdit.save();

            expect(el._inlineEdit.isEditing).toBe(true);
        });

    });

    describe('Enable/disable', function() {

        it('setEnabled(false) disables editing', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            var instance = el._inlineEdit;

            instance.setEnabled(false);

            expect(instance.isEnabled()).toBe(false);
            expect(el.classList.contains('disabled')).toBe(true);
        });

        it('click does not start edit when disabled', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            var instance = el._inlineEdit;

            instance.setEnabled(false);
            el.click();

            expect(instance.isEditing).toBe(false);
        });

        it('setEnabled(true) re-enables editing', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            var instance = el._inlineEdit;

            instance.setEnabled(false);
            instance.setEnabled(true);

            expect(instance.isEnabled()).toBe(true);
        });

    });

    describe('Keyboard navigation', function() {

        it('Enter saves the edit', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            el.click();

            var input = fixture.container.querySelector('.inline-edit-input');
            input.value = 'Jane';
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

            // Save initiated (would need to mock API for full test)
            expect(el._inlineEdit.isSaving || !el._inlineEdit.isEditing).toBe(true);
        });

        it('Enter/Space on element starts edit', function() {
            fixture.html(
                '<span class="inline-edit" tabindex="0" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');

            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

            expect(el._inlineEdit.isEditing).toBe(true);
        });

    });

    describe('Data attributes', function() {

        it('reads entity from data-entity', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var instance = fixture.query('.inline-edit')._inlineEdit;

            expect(instance.entity).toBe('client');
        });

        it('reads id from data-id', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="456" data-field="name">John</span>'
            );

            InlineEdit.init();
            var instance = fixture.query('.inline-edit')._inlineEdit;

            expect(instance.id).toBe('456');
        });

        it('reads field from data-field', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="email">test@test.com</span>'
            );

            InlineEdit.init();
            var instance = fixture.query('.inline-edit')._inlineEdit;

            expect(instance.field).toBe('email');
        });

        it('builds API URL from entity and id', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name">John</span>'
            );

            InlineEdit.init();
            var instance = fixture.query('.inline-edit')._inlineEdit;

            expect(instance.api).toBe('/api/client/123');
        });

        it('uses custom API URL from data-api', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name" data-api="/custom/api/path">John</span>'
            );

            InlineEdit.init();
            var instance = fixture.query('.inline-edit')._inlineEdit;

            expect(instance.api).toBe('/custom/api/path');
        });

    });

    describe('destroyAll', function() {

        it('destroys all instances', function() {
            fixture.html(
                '<span class="inline-edit" id="edit1" data-entity="client" data-id="1" data-field="name">A</span>' +
                '<span class="inline-edit" id="edit2" data-entity="client" data-id="2" data-field="name">B</span>'
            );

            InlineEdit.init();

            // Verify instances were created
            expect(InlineEdit.getInstance('#edit1')).toBeTruthy();
            expect(InlineEdit.getInstance('#edit2')).toBeTruthy();

            InlineEdit.destroyAll();

            // After destroyAll, instances should be gone
            expect(InlineEdit.getInstance('#edit1')).toBeNull();
            expect(InlineEdit.getInstance('#edit2')).toBeNull();
        });

    });

    describe('Placeholder handling', function() {

        it('shows placeholder for empty values', function() {
            fixture.html(
                '<span class="inline-edit" data-entity="client" data-id="123" data-field="name" data-placeholder="Click to add"></span>'
            );

            InlineEdit.init();
            var el = fixture.query('.inline-edit');
            el.click();
            el._inlineEdit.cancelEdit();

            // After restoring empty value, should show placeholder
            var placeholder = el.querySelector('.inline-edit-placeholder');
            expect(placeholder).not.toBeNull();
        });

    });

});
