/**
 * Form + FormModal Integration Tests
 *
 * Tests the interaction between Funky.Form, FormModal, LiveBinding,
 * SchemaAdapter, and other components.
 */

describe('Funky.FormModal Integration', function() {

    var FormModal = Funky.FormModal;
    var Form = Funky.Form;
    var LiveBinding = Funky.LiveBinding;
    var Modal = Funky.Modal;
    var fixture;
    var initializedModals = [];

    beforeEach(function() {
        fixture = FunkyTests.fixture();
        fixture.html('<div id="integration-container"></div>');
        initializedModals = [];
    });

    afterEach(function() {
        // Clean up modals
        initializedModals.forEach(function(modalId) {
            var modal = document.getElementById(modalId);
            if (modal) {
                Modal.hide('#' + modalId);
                modal.remove();
            }
            // Clean up form instances
            if (FormModal._nativeFormInstances && FormModal._nativeFormInstances[modalId]) {
                var instance = FormModal._nativeFormInstances[modalId];
                if (instance.form && instance.form.destroy) {
                    instance.form.destroy();
                }
                delete FormModal._nativeFormInstances[modalId];
            }
            delete FormModal._instances[modalId];
        });
        fixture.cleanup();
    });

    // =========================================================================
    // Form + FormModal Integration
    // =========================================================================

    describe('Form creation in FormModal', function() {

        it('creates Funky.Form instance inside modal', function(done) {
            FormModal.init({
                modalId: 'form-in-modal',
                useNativeForm: true,
                title: 'Test Form',
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true },
                        email: { type: 'email', label: 'Email' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('form-in-modal');

                // Check form was created
                expect(instance.form).toBeDefined();
                expect(instance.form.getData).toBeDefined();

                // Check form elements are in modal
                var modal = document.getElementById('form-in-modal');
                var formEl = modal.querySelector('.funky-form');
                expect(formEl).not.toBeNull();

                var fields = modal.querySelectorAll('.funky-form-field');
                expect(fields.length).toBe(2);

                done();
            }).catch(done.fail);
        });

        it('form instance is accessible via getNativeForm', function(done) {
            FormModal.init({
                modalId: 'accessible-form',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('accessible-form');

                var form = FormModal.getNativeForm('accessible-form');
                expect(form).toBe(instance.form);

                done();
            }).catch(done.fail);
        });

        it('modal instance methods work with form', function(done) {
            FormModal.init({
                modalId: 'methods-test',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('methods-test');

                // Test setData
                instance.setData({ name: 'Test Name' });
                expect(instance.getData().name).toBe('Test Name');

                // Test validate
                var result = instance.validate();
                expect(result.valid).toBe(true);

                done();
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // Form Data Flow
    // =========================================================================

    describe('Form data flow', function() {

        it('initial data populates form fields', function(done) {
            FormModal.init({
                modalId: 'initial-data-flow',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        email: { type: 'email', label: 'Email' }
                    }
                },
                data: {
                    name: 'John Doe',
                    email: 'john@example.com'
                }
            }).then(function(instance) {
                initializedModals.push('initial-data-flow');

                var data = instance.getData();
                expect(data.name).toBe('John Doe');
                expect(data.email).toBe('john@example.com');

                // Check input values
                var modal = document.getElementById('initial-data-flow');
                var nameInput = modal.querySelector('[name="name"]');
                var emailInput = modal.querySelector('[name="email"]');

                expect(nameInput.value).toBe('John Doe');
                expect(emailInput.value).toBe('john@example.com');

                done();
            }).catch(done.fail);
        });

        it('setData updates form fields', function(done) {
            FormModal.init({
                modalId: 'setdata-flow',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('setdata-flow');

                instance.setData({ name: 'Updated Name' });

                var modal = document.getElementById('setdata-flow');
                var nameInput = modal.querySelector('[name="name"]');
                expect(nameInput.value).toBe('Updated Name');

                done();
            }).catch(done.fail);
        });

        it('form changes are reflected in getData', function(done) {
            FormModal.init({
                modalId: 'getdata-flow',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('getdata-flow');

                // Simulate user input
                var modal = document.getElementById('getdata-flow');
                var nameInput = modal.querySelector('[name="name"]');
                nameInput.value = 'User Input';
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));

                // Allow for async processing
                setTimeout(function() {
                    var data = instance.getData();
                    expect(data.name).toBe('User Input');
                    done();
                }, 50);
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // Validation Integration
    // =========================================================================

    describe('Validation integration', function() {

        it('validate returns form validation result', function(done) {
            FormModal.init({
                modalId: 'validate-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true },
                        email: { type: 'email', label: 'Email', required: true }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('validate-integration');

                // Empty form should fail validation
                var result = instance.validate();
                expect(result.valid).toBe(false);
                expect(result.errors.name).toBeDefined();
                expect(result.errors.email).toBeDefined();

                done();
            }).catch(done.fail);
        });

        it('valid form passes validation', function(done) {
            FormModal.init({
                modalId: 'valid-form-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true },
                        email: { type: 'email', label: 'Email', required: true }
                    }
                },
                data: {
                    name: 'John',
                    email: 'john@example.com'
                }
            }).then(function(instance) {
                initializedModals.push('valid-form-integration');

                var result = instance.validate();
                expect(result.valid).toBe(true);
                expect(Object.keys(result.errors).length).toBe(0);

                done();
            }).catch(done.fail);
        });

        it('validation errors show in form UI', function(done) {
            FormModal.init({
                modalId: 'validation-ui-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('validation-ui-integration');

                // Trigger validation
                instance.validate();

                // Check error is displayed
                var modal = document.getElementById('validation-ui-integration');
                var field = modal.querySelector('.funky-form-field');
                expect(field.classList.contains('funky-form-field--error')).toBe(true);

                var errorEl = modal.querySelector('.funky-form-errors');
                expect(errorEl.textContent).not.toBe('');

                done();
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // onChange Integration
    // =========================================================================

    describe('onChange callback integration', function() {

        it('onChange fires when form field changes', function(done) {
            var changeEvents = [];

            FormModal.init({
                modalId: 'onchange-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                },
                onChange: function(field, value, data) {
                    changeEvents.push({ field: field, value: value, data: data });
                }
            }).then(function(instance) {
                initializedModals.push('onchange-integration');

                // Simulate user input
                var modal = document.getElementById('onchange-integration');
                var nameInput = modal.querySelector('[name="name"]');
                nameInput.value = 'Changed';
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));

                setTimeout(function() {
                    expect(changeEvents.length).toBeGreaterThan(0);
                    var lastEvent = changeEvents[changeEvents.length - 1];
                    expect(lastEvent.field).toBe('name');
                    expect(lastEvent.value).toBe('Changed');
                    done();
                }, 100);
            }).catch(done.fail);
        });

        it('onFormChange (legacy) fires for native form', function(done) {
            var changeEvents = [];

            FormModal.init({
                modalId: 'onformchange-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        email: { type: 'email', label: 'Email' }
                    }
                },
                onFormChange: function(editor, path, newValue, oldValue) {
                    changeEvents.push({ path: path, newValue: newValue });
                }
            }).then(function(instance) {
                initializedModals.push('onformchange-integration');

                // Simulate user input
                var modal = document.getElementById('onformchange-integration');
                var emailInput = modal.querySelector('[name="email"]');
                emailInput.value = 'test@test.com';
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));

                setTimeout(function() {
                    expect(changeEvents.length).toBeGreaterThan(0);
                    done();
                }, 100);
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // Modal Show/Hide Integration
    // =========================================================================

    describe('Modal visibility integration', function() {

        it('show() displays the modal', function(done) {
            FormModal.init({
                modalId: 'show-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('show-integration');

                instance.show();

                setTimeout(function() {
                    var modal = document.getElementById('show-integration');
                    expect(modal.classList.contains('show')).toBe(true);
                    done();
                }, 100);
            }).catch(done.fail);
        });

        it('hide() hides the modal', function(done) {
            FormModal.init({
                modalId: 'hide-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('hide-integration');

                instance.show();

                // Wait for show animation to complete (Bootstrap modals use 300ms transition)
                setTimeout(function() {
                    instance.hide();

                    // Wait for hide animation to complete - use longer timeout to ensure
                    // the modal transition finishes (includes fade + backdrop removal)
                    setTimeout(function() {
                        var modal = document.getElementById('hide-integration');
                        expect(modal.classList.contains('show')).toBe(false);
                        done();
                    }, 600);
                }, 400);
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // Destroy Integration
    // =========================================================================

    describe('Destroy integration', function() {

        it('destroy cleans up form instance', function(done) {
            FormModal.init({
                modalId: 'destroy-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                // Don't add to cleanup list, we're manually destroying
                var modalId = 'destroy-integration';

                // Destroy
                instance.destroy();

                // Check instance is cleaned up
                expect(FormModal.getNativeForm(modalId)).toBeNull();
                expect(FormModal.isNativeForm(modalId)).toBe(false);
                expect(FormModal._nativeFormInstances[modalId]).toBeUndefined();

                // Clean up modal element
                var modal = document.getElementById(modalId);
                if (modal) modal.remove();

                done();
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // Field Types Integration
    // =========================================================================

    describe('Field types in modal', function() {

        it('renders all basic field types', function(done) {
            FormModal.init({
                modalId: 'field-types-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        text_field: { type: 'text', label: 'Text' },
                        email_field: { type: 'email', label: 'Email' },
                        number_field: { type: 'number', label: 'Number' },
                        textarea_field: { type: 'textarea', label: 'Textarea' },
                        checkbox_field: { type: 'checkbox', label: 'Checkbox' },
                        select_field: {
                            type: 'select',
                            label: 'Select',
                            options: [
                                { value: 'a', label: 'Option A' },
                                { value: 'b', label: 'Option B' }
                            ]
                        }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('field-types-integration');

                var modal = document.getElementById('field-types-integration');

                expect(modal.querySelector('input[type="text"]')).not.toBeNull();
                expect(modal.querySelector('input[type="email"]')).not.toBeNull();
                expect(modal.querySelector('input[type="number"]')).not.toBeNull();
                expect(modal.querySelector('textarea')).not.toBeNull();
                expect(modal.querySelector('input[type="checkbox"]')).not.toBeNull();
                expect(modal.querySelector('select')).not.toBeNull();

                done();
            }).catch(done.fail);
        });

        it('field values are included in getData', function(done) {
            FormModal.init({
                modalId: 'field-values-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        active: { type: 'checkbox', label: 'Active' },
                        count: { type: 'number', label: 'Count' }
                    }
                },
                data: {
                    name: 'Test',
                    active: true,
                    count: 42
                }
            }).then(function(instance) {
                initializedModals.push('field-values-integration');

                var data = instance.getData();
                expect(data.name).toBe('Test');
                expect(data.active).toBe(true);
                expect(data.count).toBe(42);

                done();
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // Layout Integration
    // =========================================================================

    describe('Layout in modal', function() {

        it('renders sections layout', function(done) {
            FormModal.init({
                modalId: 'sections-layout-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        email: { type: 'email', label: 'Email' }
                    },
                    layout: {
                        type: 'sections',
                        sections: [
                            { id: 'basic', title: 'Basic Info', fields: ['name'] },
                            { id: 'contact', title: 'Contact', fields: ['email'] }
                        ]
                    }
                }
            }).then(function(instance) {
                initializedModals.push('sections-layout-integration');

                var modal = document.getElementById('sections-layout-integration');
                var sections = modal.querySelectorAll('.funky-form-section');
                expect(sections.length).toBe(2);

                done();
            }).catch(done.fail);
        });

        it('renders grid layout', function(done) {
            FormModal.init({
                modalId: 'grid-layout-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        first: { type: 'text', label: 'First' },
                        last: { type: 'text', label: 'Last' }
                    },
                    layout: {
                        type: 'grid',
                        rows: [
                            { fields: ['first', 'last'] }
                        ]
                    }
                }
            }).then(function(instance) {
                initializedModals.push('grid-layout-integration');

                var modal = document.getElementById('grid-layout-integration');
                var rows = modal.querySelectorAll('.funky-form-row');
                expect(rows.length).toBe(1);

                var cols = modal.querySelectorAll('.funky-form-col');
                expect(cols.length).toBe(2);

                done();
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // LiveBinding Integration
    // =========================================================================

    if (LiveBinding) {

        describe('LiveBinding integration', function() {

            it('form instance is registered for LiveBinding', function(done) {
                FormModal.init({
                    modalId: 'livebinding-integration',
                    useNativeForm: true,
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        }
                    }
                }).then(function(instance) {
                    initializedModals.push('livebinding-integration');

                    // Check if registered in _instances
                    expect(FormModal._instances['livebinding-integration']).toBeDefined();
                    expect(FormModal._instances['livebinding-integration'].getData).toBeDefined();
                    expect(FormModal._instances['livebinding-integration'].setData).toBeDefined();

                    done();
                }).catch(done.fail);
            });

        });

    }

    // =========================================================================
    // Error Handling Integration
    // =========================================================================

    describe('Error handling', function() {

        it('displays form-level errors', function(done) {
            FormModal.init({
                modalId: 'form-error-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('form-error-integration');

                // Set server-side errors
                instance.form.setErrors({
                    name: ['Name is already taken'],
                    _form: ['Server error occurred']
                });

                var modal = document.getElementById('form-error-integration');
                var fieldError = modal.querySelector('.funky-form-field--error');
                expect(fieldError).not.toBeNull();

                done();
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // Config Options Integration
    // =========================================================================

    describe('Config options', function() {

        it('applies modal title', function(done) {
            FormModal.init({
                modalId: 'title-config-integration',
                useNativeForm: true,
                title: 'Custom Modal Title',
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('title-config-integration');

                var modal = document.getElementById('title-config-integration');
                var title = modal.querySelector('.title-text');
                expect(title.textContent).toBe('Custom Modal Title');

                done();
            }).catch(done.fail);
        });

        it('applies submit button text', function(done) {
            FormModal.init({
                modalId: 'submit-text-integration',
                useNativeForm: true,
                submitText: 'Create Item',
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('submit-text-integration');

                var modal = document.getElementById('submit-text-integration');
                var saveBtn = modal.querySelector('.form-modal-save');
                expect(saveBtn.textContent).toContain('Create Item');

                done();
            }).catch(done.fail);
        });

        it('applies cancel button text', function(done) {
            FormModal.init({
                modalId: 'cancel-text-integration',
                useNativeForm: true,
                cancelText: 'Discard',
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('cancel-text-integration');

                var modal = document.getElementById('cancel-text-integration');
                var cancelBtn = modal.querySelector('.modal-footer [data-funky-modal-close]');
                expect(cancelBtn.textContent).toContain('Discard');

                done();
            }).catch(done.fail);
        });

        it('applies modal size', function(done) {
            FormModal.init({
                modalId: 'size-config-integration',
                useNativeForm: true,
                size: 'modal-slide-panel-xl',
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('size-config-integration');

                var modal = document.getElementById('size-config-integration');
                expect(modal.classList.contains('modal-slide-panel-xl')).toBe(true);

                done();
            }).catch(done.fail);
        });

    });

    // =========================================================================
    // Static show() method
    // =========================================================================

    describe('FormModal.show() static method', function() {

        it('creates and shows modal in one call', function(done) {
            FormModal.show({
                modalId: 'show-method-integration',
                useNativeForm: true,
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            }).then(function(instance) {
                initializedModals.push('show-method-integration');

                // Modal should exist and be shown
                var modal = document.getElementById('show-method-integration');
                expect(modal).not.toBeNull();

                // Should have form
                expect(instance.getData).toBeDefined();

                done();
            }).catch(done.fail);
        });

    });

});
