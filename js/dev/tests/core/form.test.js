/**
 * Form Unit Tests
 *
 * Tests for Funky.Form - the native form component.
 */

describe('Funky.Core.Form', function() {

    var Form = Funky.Form;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
        fixture.html('<div id="form-container"></div>');
    });

    afterEach(function() {
        // Destroy any form instances
        Form.destroyAll();
        fixture.cleanup();
    });

    describe('Module registration', function() {

        it('is registered with Funky', function() {
            expect(Funky.Form).toBeDefined();
            expect(typeof Funky.Form.create).toBe('function');
        });

        it('has static methods', function() {
            expect(typeof Form.create).toBe('function');
            expect(typeof Form.getInstance).toBe('function');
            expect(typeof Form.setData).toBe('function');
            expect(typeof Form.getData).toBe('function');
            expect(typeof Form.destroy).toBe('function');
            expect(typeof Form.destroyAll).toBe('function');
        });

    });

    describe('Form creation', function() {

        it('creates form with native schema', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });

            expect(form).toBeDefined();
            expect(form.id).toMatch(/^funky-form-/);
        });

        it('creates form with fields array', function() {
            var form = Form.create('#form-container', {
                fields: [
                    { name: 'name', type: 'text', label: 'Name' },
                    { name: 'email', type: 'email', label: 'Email' }
                ]
            });

            expect(form).toBeDefined();
        });

        it('renders form element', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                }
            });

            var formEl = fixture.el.querySelector('.funky-form');
            expect(formEl).not.toBeNull();
        });

        it('renders fields', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });

            var fields = fixture.el.querySelectorAll('.funky-form-field');
            expect(fields.length).toBe(2);
        });

        it('renders labels', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Full Name' }
                    }
                }
            });

            var label = fixture.el.querySelector('.funky-form-label');
            expect(label.textContent).toContain('Full Name');
        });

        it('renders required indicator', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true }
                    }
                }
            });

            var required = fixture.el.querySelector('.funky-form-required');
            expect(required).not.toBeNull();
        });

        it('sets initial data', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' }
                    }
                },
                data: { name: 'John Doe' }
            });

            expect(form.getData().name).toBe('John Doe');
        });

        it('returns existing instance', function() {
            var form1 = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            var form2 = Form.create('#form-container', {
                schema: { fields: { email: { type: 'email' } } }
            });

            expect(form1).toBe(form2);
        });

        it('returns null for missing container', function() {
            var form = Form.create('#non-existent', {
                schema: { fields: { name: { type: 'text' } } }
            });

            expect(form).toBeNull();
        });

    });

    describe('Bindable interface', function() {

        var form;

        beforeEach(function() {
            form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        email: { type: 'email', label: 'Email' }
                    }
                },
                data: { name: 'Initial' }
            });
        });

        it('getData returns all values', function() {
            var data = form.getData();
            expect(data.name).toBe('Initial');
        });

        it('setData updates values', function() {
            form.setData({ name: 'Updated', email: 'test@example.com' });

            expect(form.getData().name).toBe('Updated');
            expect(form.getData().email).toBe('test@example.com');
        });

        it('addData adds new values', function() {
            form.addData({ email: 'new@example.com' });

            expect(form.getData().name).toBe('Initial');
            expect(form.getData().email).toBe('new@example.com');
        });

        it('removeData removes value', function() {
            form.removeData('name');

            expect(form.getData().name).toBeUndefined();
        });

    });

    describe('Field operations', function() {

        var form;

        beforeEach(function() {
            form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });
        });

        it('setFieldValue updates field', function() {
            form.setFieldValue('name', 'Test Value');
            expect(form.getFieldValue('name')).toBe('Test Value');
        });

        it('getFieldValue returns current value', function() {
            form.setFieldValue('email', 'test@test.com');
            expect(form.getFieldValue('email')).toBe('test@test.com');
        });

        it('hideField hides field element', function() {
            form.hideField('email');

            var field = fixture.el.querySelector('[data-field="email"]');
            expect(field.style.display).toBe('none');
        });

        it('showField shows hidden field', function() {
            form.hideField('email');
            form.showField('email');

            var field = fixture.el.querySelector('[data-field="email"]');
            expect(field.style.display).toBe('');
        });

        it('disableField disables field', function() {
            form.disableField('name');

            var field = fixture.el.querySelector('[data-field="name"]');
            expect(field.classList.contains('funky-form-field--disabled')).toBe(true);
        });

        it('enableField enables disabled field', function() {
            form.disableField('name');
            form.enableField('name');

            var field = fixture.el.querySelector('[data-field="name"]');
            expect(field.classList.contains('funky-form-field--disabled')).toBe(false);
        });

        it('getField returns field config', function() {
            var field = form.getField('name');
            expect(field).toBeDefined();
            expect(field.config.type).toBe('text');
        });

    });

    describe('Validation', function() {

        it('validates required fields', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true }
                    }
                }
            });

            var result = form.validate();
            expect(result.valid).toBe(false);
            expect(result.errors.name).toBeDefined();
        });

        it('passes validation with valid data', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true }
                    }
                },
                data: { name: 'John' }
            });

            var result = form.validate();
            expect(result.valid).toBe(true);
        });

        it('validateField validates single field', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true },
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });

            var result = form.validateField('name');
            expect(result.valid).toBe(false);
        });

        it('setFieldError shows error', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });

            form.setFieldError('email', 'Email already exists');

            var field = fixture.el.querySelector('[data-field="email"]');
            expect(field.classList.contains('funky-form-field--error')).toBe(true);
        });

        it('clearFieldError removes error', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });

            form.setFieldError('email', 'Error');
            form.clearFieldError('email');

            var field = fixture.el.querySelector('[data-field="email"]');
            expect(field.classList.contains('funky-form-field--error')).toBe(false);
        });

        it('setErrors sets multiple errors', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });

            form.setErrors({
                name: 'Name is invalid',
                email: 'Email is invalid'
            });

            var nameField = fixture.el.querySelector('[data-field="name"]');
            var emailField = fixture.el.querySelector('[data-field="email"]');
            expect(nameField.classList.contains('funky-form-field--error')).toBe(true);
            expect(emailField.classList.contains('funky-form-field--error')).toBe(true);
        });

        it('clearErrors clears all errors', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });

            form.setErrors({ name: 'Error', email: 'Error' });
            form.clearErrors();

            var errors = fixture.el.querySelectorAll('.funky-form-field--error');
            expect(errors.length).toBe(0);
        });

    });

    describe('Events', function() {

        it('emits init event', function() {
            var initCalled = false;

            Form.create('#form-container', {
                schema: {
                    fields: { name: { type: 'text' } }
                },
                onInit: function() {
                    initCalled = true;
                }
            });

            expect(initCalled).toBe(true);
        });

        it('emits change event on field change', function() {
            var changeEvent = null;

            var form = Form.create('#form-container', {
                schema: {
                    fields: { name: { type: 'text' } }
                },
                onChange: function(evt) {
                    changeEvent = evt;
                }
            });

            form.setFieldValue('name', 'New Value');

            expect(changeEvent).not.toBeNull();
            expect(changeEvent.field).toBe('name');
            expect(changeEvent.value).toBe('New Value');
        });

        it('emits submit event', function() {
            var submitCalled = false;

            var form = Form.create('#form-container', {
                schema: {
                    fields: { name: { type: 'text' } }
                },
                data: { name: 'Test' },
                onSubmit: function() {
                    submitCalled = true;
                }
            });

            form.submit();

            expect(submitCalled).toBe(true);
        });

        it('emits reset event', function() {
            var resetCalled = false;

            var form = Form.create('#form-container', {
                schema: {
                    fields: { name: { type: 'text' } }
                },
                onReset: function() {
                    resetCalled = true;
                }
            });

            form.reset();

            expect(resetCalled).toBe(true);
        });

        it('emits DOM events', function() {
            var eventReceived = false;

            // fixture.el IS the #form-container (firstElementChild), use it directly
            var container = fixture.el;
            container.addEventListener('funky-form:init', function() {
                eventReceived = true;
            });

            Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            expect(eventReceived).toBe(true);
        });

    });

    describe('Lifecycle', function() {

        it('reset restores initial values', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: { name: { type: 'text' } }
                },
                data: { name: 'Initial' }
            });

            form.setFieldValue('name', 'Changed');
            expect(form.getFieldValue('name')).toBe('Changed');

            form.reset();
            expect(form.getFieldValue('name')).toBe('Initial');
        });

        it('destroy removes from DOM', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            form.destroy();

            var formEl = fixture.el.querySelector('.funky-form');
            expect(formEl).toBeNull();
        });

        it('destroy removes from registry', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            var id = form.id;
            form.destroy();

            expect(Form.getInstance('#form-container')).toBeNull();
        });

        it('submit validates before calling onSubmit', function() {
            var submitCalled = false;

            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', required: true }
                    }
                },
                onSubmit: function() {
                    submitCalled = true;
                }
            });

            form.submit();

            expect(submitCalled).toBe(false);
        });

    });

    describe('Static methods', function() {

        it('getInstance returns form by selector', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            var retrieved = Form.getInstance('#form-container');
            expect(retrieved).toBe(form);
        });

        it('setData sets data via selector', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            Form.setData('#form-container', { name: 'Static Set' });

            expect(form.getData().name).toBe('Static Set');
        });

        it('getData gets data via selector', function() {
            Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } },
                data: { name: 'Test Data' }
            });

            var data = Form.getData('#form-container');
            expect(data.name).toBe('Test Data');
        });

        it('destroy destroys form by selector', function() {
            Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            Form.destroy('#form-container');

            expect(Form.getInstance('#form-container')).toBeNull();
        });

        it('destroyAll destroys all instances', function() {
            fixture.html(
                '<div id="form1"></div>' +
                '<div id="form2"></div>'
            );

            Form.create('#form1', {
                schema: { fields: { name: { type: 'text' } } }
            });

            Form.create('#form2', {
                schema: { fields: { email: { type: 'email' } } }
            });

            Form.destroyAll();

            expect(Form.getInstance('#form1')).toBeNull();
            expect(Form.getInstance('#form2')).toBeNull();
        });

    });

    describe('Field types', function() {

        it('renders text field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text' }
                    }
                }
            });

            var input = fixture.el.querySelector('input[type="text"]');
            expect(input).not.toBeNull();
        });

        it('renders email field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        email: { type: 'email' }
                    }
                }
            });

            var input = fixture.el.querySelector('input[type="email"]');
            expect(input).not.toBeNull();
        });

        it('renders password field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        password: { type: 'password' }
                    }
                }
            });

            var input = fixture.el.querySelector('input[type="password"]');
            expect(input).not.toBeNull();
        });

        it('renders number field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        age: { type: 'number' }
                    }
                }
            });

            var input = fixture.el.querySelector('input[type="number"]');
            expect(input).not.toBeNull();
        });

        it('renders textarea field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        bio: { type: 'textarea' }
                    }
                }
            });

            var textarea = fixture.el.querySelector('textarea');
            expect(textarea).not.toBeNull();
        });

        it('renders checkbox field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        agree: { type: 'checkbox' }
                    }
                }
            });

            var checkbox = fixture.el.querySelector('input[type="checkbox"]');
            expect(checkbox).not.toBeNull();
        });

        it('renders select field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        country: {
                            type: 'select',
                            options: [
                                { value: 'us', label: 'United States' },
                                { value: 'uk', label: 'United Kingdom' }
                            ]
                        }
                    }
                }
            });

            var select = fixture.el.querySelector('select');
            expect(select).not.toBeNull();
            expect(select.options.length).toBeGreaterThan(0);
        });

        it('renders hidden field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        token: { type: 'hidden' }
                    }
                }
            });

            var hidden = fixture.el.querySelector('input[type="hidden"]');
            expect(hidden).not.toBeNull();
        });

    });

    describe('Dirty state', function() {

        it('starts clean', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            expect(form.isDirty()).toBe(false);
        });

        it('becomes dirty after change', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            form.setFieldValue('name', 'Changed');

            expect(form.isDirty()).toBe(true);
        });

        it('becomes clean after reset', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } }
            });

            form.setFieldValue('name', 'Changed');
            form.reset();

            expect(form.isDirty()).toBe(false);
        });

    });

    describe('Mode support', function() {

        it('supports create mode', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } },
                mode: 'create'
            });

            expect(form.options.mode).toBe('create');
        });

        it('supports edit mode', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } },
                mode: 'edit'
            });

            expect(form.options.mode).toBe('edit');
        });

        it('supports view mode', function() {
            var form = Form.create('#form-container', {
                schema: { fields: { name: { type: 'text' } } },
                mode: 'view'
            });

            expect(form.options.mode).toBe('view');
        });

    });

    describe('Field dependencies (dependsOn)', function() {

        it('hides dependent field when condition not met', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        has_children: { type: 'checkbox', label: 'Has Children' },
                        num_children: {
                            type: 'number',
                            label: 'Number of Children',
                            dependsOn: { field: 'has_children', equals: true }
                        }
                    }
                },
                data: { has_children: false }
            });

            var numChildrenField = fixture.el.querySelector('[data-field="num_children"]');
            expect(numChildrenField.style.display).toBe('none');
        });

        it('shows dependent field when condition met', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        has_children: { type: 'checkbox', label: 'Has Children' },
                        num_children: {
                            type: 'number',
                            label: 'Number of Children',
                            dependsOn: { field: 'has_children', equals: true }
                        }
                    }
                },
                data: { has_children: true }
            });

            var numChildrenField = fixture.el.querySelector('[data-field="num_children"]');
            expect(numChildrenField.style.display).not.toBe('none');
        });

        it('updates visibility when dependent field changes', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        has_children: { type: 'checkbox', label: 'Has Children' },
                        num_children: {
                            type: 'number',
                            label: 'Number of Children',
                            dependsOn: { field: 'has_children', equals: true }
                        }
                    }
                },
                data: { has_children: false }
            });

            var numChildrenField = fixture.el.querySelector('[data-field="num_children"]');
            expect(numChildrenField.style.display).toBe('none');

            // Change the checkbox
            form.setFieldValue('has_children', true);

            expect(numChildrenField.style.display).not.toBe('none');
        });

        it('supports notEquals condition', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        status: { type: 'text', label: 'Status' },
                        reason: {
                            type: 'textarea',
                            label: 'Reason',
                            dependsOn: { field: 'status', notEquals: 'active' }
                        }
                    }
                },
                data: { status: 'active' }
            });

            var reasonField = fixture.el.querySelector('[data-field="reason"]');
            expect(reasonField.style.display).toBe('none');

            form.setFieldValue('status', 'inactive');
            expect(reasonField.style.display).not.toBe('none');
        });

        it('supports in condition', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        role: { type: 'select', label: 'Role', options: ['user', 'admin', 'superadmin'] },
                        permissions: {
                            type: 'text',
                            label: 'Permissions',
                            dependsOn: { field: 'role', in: ['admin', 'superadmin'] }
                        }
                    }
                },
                data: { role: 'user' }
            });

            var permissionsField = fixture.el.querySelector('[data-field="permissions"]');
            expect(permissionsField.style.display).toBe('none');

            form.setFieldValue('role', 'admin');
            expect(permissionsField.style.display).not.toBe('none');
        });

        it('supports truthy condition', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        greeting: {
                            type: 'text',
                            label: 'Greeting',
                            dependsOn: { field: 'name', truthy: true }
                        }
                    }
                },
                data: { name: '' }
            });

            var greetingField = fixture.el.querySelector('[data-field="greeting"]');
            expect(greetingField.style.display).toBe('none');

            form.setFieldValue('name', 'John');
            expect(greetingField.style.display).not.toBe('none');
        });

        it('supports falsy condition', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        has_discount: { type: 'checkbox', label: 'Has Discount' },
                        full_price: {
                            type: 'number',
                            label: 'Full Price',
                            dependsOn: { field: 'has_discount', falsy: true }
                        }
                    }
                },
                data: { has_discount: true }
            });

            var fullPriceField = fixture.el.querySelector('[data-field="full_price"]');
            expect(fullPriceField.style.display).toBe('none');

            form.setFieldValue('has_discount', false);
            expect(fullPriceField.style.display).not.toBe('none');
        });

    });

    describe('Advanced field types', function() {

        it('renders date field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        birthdate: { type: 'date', label: 'Birth Date' }
                    }
                }
            });

            // Check that some input element was rendered for the date field
            // Could be native date input, datetime-local input, text input, or DatePicker container
            var nativeDate = fixture.el.querySelector('input[type="date"]');
            var nativeDatetime = fixture.el.querySelector('input[type="datetime-local"]');
            var textInput = fixture.el.querySelector('input[name="birthdate"]');
            var datePickerContainer = fixture.el.querySelector('.funky-form-datepicker-container');
            expect(nativeDate || nativeDatetime || textInput || datePickerContainer).not.toBeNull();
        });

        it('renders datetime field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        appointment: { type: 'datetime', label: 'Appointment' }
                    }
                }
            });

            // Check that some input element was rendered for the datetime field
            var nativeDate = fixture.el.querySelector('input[type="date"]');
            var nativeDatetime = fixture.el.querySelector('input[type="datetime-local"]');
            var textInput = fixture.el.querySelector('input[name="appointment"]');
            var datePickerContainer = fixture.el.querySelector('.funky-form-datepicker-container');
            expect(nativeDate || nativeDatetime || textInput || datePickerContainer).not.toBeNull();
        });

        it('renders combobox field (native fallback)', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        country: {
                            type: 'combobox',
                            label: 'Country',
                            options: [
                                { value: 'us', label: 'United States' },
                                { value: 'uk', label: 'United Kingdom' }
                            ]
                        }
                    }
                }
            });

            // Falls back to native select when ComboBox not available
            var select = fixture.el.querySelector('select');
            expect(select).not.toBeNull();
        });

        it('renders file field', function() {
            Form.create('#form-container', {
                schema: {
                    fields: {
                        upload: { type: 'file', label: 'Upload' }
                    }
                }
            });

            var input = fixture.el.querySelector('input[type="file"]');
            expect(input).not.toBeNull();
            var dropzone = fixture.el.querySelector('.funky-form-file-dropzone');
            expect(dropzone).not.toBeNull();
        });

    });

    describe('Validation with Funky.Validator', function() {

        it('validates required field', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true }
                    }
                }
            });

            var result = form.validate();

            expect(result.valid).toBe(false);
            expect(result.errors.name).toBeDefined();
        });

        it('validates minLength', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', minLength: 3 }
                    }
                },
                data: { name: 'ab' }
            });

            var result = form.validate();

            expect(result.valid).toBe(false);
            expect(result.errors.name).toBeDefined();
        });

        it('validates maxLength', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', maxLength: 5 }
                    }
                },
                data: { name: 'toolongname' }
            });

            var result = form.validate();

            expect(result.valid).toBe(false);
        });

        it('validates min/max for numbers', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        age: { type: 'number', label: 'Age', min: 0, max: 120 }
                    }
                },
                data: { age: 150 }
            });

            var result = form.validate();

            expect(result.valid).toBe(false);
        });

        it('validates email format', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        email: { type: 'email', label: 'Email' }
                    }
                },
                data: { email: 'not-an-email' }
            });

            var result = form.validate();

            expect(result.valid).toBe(false);
        });

        it('passes validation for valid data', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name', required: true, minLength: 2 },
                        email: { type: 'email', label: 'Email' }
                    }
                },
                data: {
                    name: 'John Doe',
                    email: 'john@example.com'
                }
            });

            var result = form.validate();

            expect(result.valid).toBe(true);
            expect(Object.keys(result.errors).length).toBe(0);
        });

        it('skips validation for hidden fields', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        type: { type: 'select', label: 'Type', options: ['a', 'b'] },
                        detail: {
                            type: 'text',
                            label: 'Detail',
                            required: true,
                            dependsOn: { field: 'type', equals: 'b' }
                        }
                    }
                },
                data: { type: 'a', detail: '' }
            });

            // detail should be hidden (type='a', not 'b')
            var result = form.validate();

            // Since detail is hidden, it should pass validation
            expect(result.valid).toBe(true);
        });

        it('setErrors displays server errors', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });

            form.setErrors({
                email: ['Email already exists']
            });

            var fieldEl = fixture.el.querySelector('[data-field="email"]');
            expect(fieldEl.classList.contains('funky-form-field--error')).toBe(true);
        });

        it('clearErrors removes all errors', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', label: 'Name' },
                        email: { type: 'email', label: 'Email' }
                    }
                }
            });

            form.setErrors({
                name: ['Name is required'],
                email: ['Invalid email']
            });

            form.clearErrors();

            var errorFields = fixture.el.querySelectorAll('.funky-form-field--error');
            expect(errorFields.length).toBe(0);
        });

        it('validateAsync returns Promise', function() {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', required: true }
                    }
                }
            });

            var result = form.validateAsync();

            expect(result).toBeInstanceOf(Promise);
        });

        it('validateAsync resolves with validation result', function(done) {
            var form = Form.create('#form-container', {
                schema: {
                    fields: {
                        name: { type: 'text', required: true }
                    }
                },
                data: { name: '' }
            });

            form.validateAsync().then(function(result) {
                expect(result.valid).toBe(false);
                expect(result.errors.name).toBeDefined();
                done();
            });
        });

    });

    describe('Layout system', function() {

        describe('Linear layout (default)', function() {

            it('renders fields in linear layout by default', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' },
                            email: { type: 'email', label: 'Email' },
                            phone: { type: 'text', label: 'Phone' }
                        }
                    }
                });

                var body = fixture.el.querySelector('.funky-form-body');
                expect(body).not.toBeNull();
                expect(body.classList.contains('funky-form-sections')).toBe(false);
                expect(body.classList.contains('funky-form-columns')).toBe(false);
            });

            it('respects fieldOrder in linear layout', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' },
                            email: { type: 'email', label: 'Email' },
                            phone: { type: 'text', label: 'Phone' }
                        },
                        fieldOrder: ['phone', 'name', 'email']
                    }
                });

                var fields = fixture.el.querySelectorAll('.funky-form-field');
                expect(fields[0].getAttribute('data-field')).toBe('phone');
                expect(fields[1].getAttribute('data-field')).toBe('name');
                expect(fields[2].getAttribute('data-field')).toBe('email');
            });

        });

        describe('Sections layout', function() {

            it('renders sections container', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' },
                            email: { type: 'email', label: 'Email' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic Info', fields: ['name', 'email'] }
                            ]
                        }
                    }
                });

                var body = fixture.el.querySelector('.funky-form-body.funky-form-sections');
                expect(body).not.toBeNull();
            });

            it('renders section elements', function() {
                Form.create('#form-container', {
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
                });

                var sections = fixture.el.querySelectorAll('.funky-form-section');
                expect(sections.length).toBe(2);
            });

            it('renders section titles', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic Information', fields: ['name'] }
                            ]
                        }
                    }
                });

                var title = fixture.el.querySelector('.funky-form-section-title');
                expect(title.textContent).toBe('Basic Information');
            });

            it('renders section icons', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic', icon: 'fa-user', fields: ['name'] }
                            ]
                        }
                    }
                });

                var icon = fixture.el.querySelector('.funky-form-section-icon');
                expect(icon).not.toBeNull();
                expect(icon.classList.contains('fa-user')).toBe(true);
            });

            it('sets data-section-id attribute', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'my-section', title: 'Section', fields: ['name'] }
                            ]
                        }
                    }
                });

                var section = fixture.el.querySelector('.funky-form-section');
                expect(section.getAttribute('data-section-id')).toBe('my-section');
            });

            it('renders collapsible sections by default', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic', fields: ['name'] }
                            ]
                        }
                    }
                });

                var header = fixture.el.querySelector('.funky-form-section-header');
                expect(header.classList.contains('funky-form-section-header--collapsible')).toBe(true);

                var toggle = fixture.el.querySelector('.funky-form-section-toggle');
                expect(toggle).not.toBeNull();
            });

            it('supports non-collapsible sections', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic', collapsible: false, fields: ['name'] }
                            ]
                        }
                    }
                });

                var header = fixture.el.querySelector('.funky-form-section-header');
                expect(header.classList.contains('funky-form-section-header--collapsible')).toBe(false);

                var toggle = fixture.el.querySelector('.funky-form-section-toggle');
                expect(toggle).toBeNull();
            });

            it('starts collapsed when specified', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic', collapsed: true, fields: ['name'] }
                            ]
                        }
                    }
                });

                var section = fixture.el.querySelector('.funky-form-section');
                expect(section.classList.contains('funky-form-section--collapsed')).toBe(true);

                var content = fixture.el.querySelector('.funky-form-section-content');
                expect(content.style.display).toBe('none');
            });

            it('toggles section on click', function() {
                var form = Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic', fields: ['name'] }
                            ]
                        }
                    }
                });

                var header = fixture.el.querySelector('.funky-form-section-header');
                var section = fixture.el.querySelector('.funky-form-section');

                // Initially expanded
                expect(section.classList.contains('funky-form-section--collapsed')).toBe(false);

                // Click to collapse
                header.click();
                expect(section.classList.contains('funky-form-section--collapsed')).toBe(true);

                // Click to expand
                header.click();
                expect(section.classList.contains('funky-form-section--collapsed')).toBe(false);
            });

            it('has correct ARIA attributes', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic', fields: ['name'] }
                            ]
                        }
                    }
                });

                var header = fixture.el.querySelector('.funky-form-section-header');
                expect(header.getAttribute('role')).toBe('button');
                expect(header.getAttribute('tabindex')).toBe('0');
                expect(header.getAttribute('aria-expanded')).toBe('true');
                expect(header.getAttribute('aria-controls')).toBe('basic-content');

                var content = fixture.el.querySelector('.funky-form-section-content');
                expect(content.id).toBe('basic-content');
            });

            it('expands section via expandSection method', function() {
                var form = Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic', collapsed: true, fields: ['name'] }
                            ]
                        }
                    }
                });

                var section = fixture.el.querySelector('.funky-form-section');
                expect(section.classList.contains('funky-form-section--collapsed')).toBe(true);

                form.expandSection('basic');
                expect(section.classList.contains('funky-form-section--collapsed')).toBe(false);
            });

            it('collapses section via collapseSection method', function() {
                var form = Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                { id: 'basic', title: 'Basic', fields: ['name'] }
                            ]
                        }
                    }
                });

                var section = fixture.el.querySelector('.funky-form-section');
                expect(section.classList.contains('funky-form-section--collapsed')).toBe(false);

                form.collapseSection('basic');
                expect(section.classList.contains('funky-form-section--collapsed')).toBe(true);
            });

        });

        describe('Columns layout', function() {

            it('renders columns container with grid', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            first_name: { type: 'text', label: 'First Name' },
                            last_name: { type: 'text', label: 'Last Name' }
                        },
                        layout: {
                            type: 'columns',
                            columns: 2,
                            fields: ['first_name', 'last_name']
                        }
                    }
                });

                var body = fixture.el.querySelector('.funky-form-body.funky-form-columns');
                expect(body).not.toBeNull();
                expect(body.style.display).toBe('grid');
            });

            it('sets correct grid columns', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            a: { type: 'text', label: 'A' },
                            b: { type: 'text', label: 'B' },
                            c: { type: 'text', label: 'C' }
                        },
                        layout: {
                            type: 'columns',
                            columns: 3,
                            fields: ['a', 'b', 'c']
                        }
                    }
                });

                var body = fixture.el.querySelector('.funky-form-columns');
                expect(body.style.gridTemplateColumns).toContain('repeat(3');
            });

            it('renders fields in column order', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            a: { type: 'text', label: 'A' },
                            b: { type: 'text', label: 'B' },
                            c: { type: 'text', label: 'C' }
                        },
                        layout: {
                            type: 'columns',
                            columns: 2,
                            fields: ['b', 'c', 'a']
                        }
                    }
                });

                var fields = fixture.el.querySelectorAll('.funky-form-field');
                expect(fields[0].getAttribute('data-field')).toBe('b');
                expect(fields[1].getAttribute('data-field')).toBe('c');
                expect(fields[2].getAttribute('data-field')).toBe('a');
            });

        });

        describe('Grid layout', function() {

            it('renders grid container', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            first_name: { type: 'text', label: 'First Name' },
                            last_name: { type: 'text', label: 'Last Name' }
                        },
                        layout: {
                            type: 'grid',
                            rows: [
                                { fields: ['first_name', 'last_name'] }
                            ]
                        }
                    }
                });

                var body = fixture.el.querySelector('.funky-form-body.funky-form-grid');
                expect(body).not.toBeNull();
            });

            it('renders rows', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            a: { type: 'text', label: 'A' },
                            b: { type: 'text', label: 'B' },
                            c: { type: 'text', label: 'C' }
                        },
                        layout: {
                            type: 'grid',
                            rows: [
                                { fields: ['a', 'b'] },
                                { fields: ['c'] }
                            ]
                        }
                    }
                });

                var rows = fixture.el.querySelectorAll('.funky-form-row');
                expect(rows.length).toBe(2);
            });

            it('renders columns in rows', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            a: { type: 'text', label: 'A' },
                            b: { type: 'text', label: 'B' }
                        },
                        layout: {
                            type: 'grid',
                            rows: [
                                { fields: ['a', 'b'] }
                            ]
                        }
                    }
                });

                var cols = fixture.el.querySelectorAll('.funky-form-col');
                expect(cols.length).toBe(2);
            });

            it('calculates equal widths by default', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            a: { type: 'text', label: 'A' },
                            b: { type: 'text', label: 'B' }
                        },
                        layout: {
                            type: 'grid',
                            rows: [
                                { fields: ['a', 'b'] }
                            ]
                        }
                    }
                });

                var cols = fixture.el.querySelectorAll('.funky-form-col');
                expect(cols[0].classList.contains('col-md-6')).toBe(true);
                expect(cols[1].classList.contains('col-md-6')).toBe(true);
            });

            it('respects custom widths', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            city: { type: 'text', label: 'City' },
                            state: { type: 'text', label: 'State' },
                            zip: { type: 'text', label: 'Zip' }
                        },
                        layout: {
                            type: 'grid',
                            rows: [
                                { fields: ['city', 'state', 'zip'], widths: [6, 3, 3] }
                            ]
                        }
                    }
                });

                var cols = fixture.el.querySelectorAll('.funky-form-col');
                expect(cols[0].classList.contains('col-md-6')).toBe(true);
                expect(cols[1].classList.contains('col-md-3')).toBe(true);
                expect(cols[2].classList.contains('col-md-3')).toBe(true);
            });

            it('handles full-width single field', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            email: { type: 'email', label: 'Email' }
                        },
                        layout: {
                            type: 'grid',
                            rows: [
                                { fields: ['email'] }
                            ]
                        }
                    }
                });

                var col = fixture.el.querySelector('.funky-form-col');
                expect(col.classList.contains('col-md-12')).toBe(true);
            });

        });

        describe('Fieldsets layout', function() {

            it('renders fieldsets container', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'fieldsets',
                            fieldsets: [
                                { legend: 'Personal', fields: ['name'] }
                            ]
                        }
                    }
                });

                var body = fixture.el.querySelector('.funky-form-body.funky-form-fieldsets');
                expect(body).not.toBeNull();
            });

            it('renders fieldset elements', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' },
                            email: { type: 'email', label: 'Email' }
                        },
                        layout: {
                            type: 'fieldsets',
                            fieldsets: [
                                { legend: 'Personal', fields: ['name'] },
                                { legend: 'Contact', fields: ['email'] }
                            ]
                        }
                    }
                });

                var fieldsets = fixture.el.querySelectorAll('.funky-form-fieldset');
                expect(fieldsets.length).toBe(2);
            });

            it('renders legend elements', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'fieldsets',
                            fieldsets: [
                                { legend: 'Personal Details', fields: ['name'] }
                            ]
                        }
                    }
                });

                var legend = fixture.el.querySelector('.funky-form-legend');
                expect(legend).not.toBeNull();
                expect(legend.textContent).toBe('Personal Details');
            });

            it('groups fields within fieldsets', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            first: { type: 'text', label: 'First' },
                            last: { type: 'text', label: 'Last' },
                            email: { type: 'email', label: 'Email' }
                        },
                        layout: {
                            type: 'fieldsets',
                            fieldsets: [
                                { legend: 'Name', fields: ['first', 'last'] },
                                { legend: 'Contact', fields: ['email'] }
                            ]
                        }
                    }
                });

                var fieldsets = fixture.el.querySelectorAll('.funky-form-fieldset');

                var nameFields = fieldsets[0].querySelectorAll('.funky-form-field');
                expect(nameFields.length).toBe(2);

                var contactFields = fieldsets[1].querySelectorAll('.funky-form-field');
                expect(contactFields.length).toBe(1);
            });

        });

        describe('Tabs layout', function() {

            it('renders tabs container', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' },
                            email: { type: 'email', label: 'Email' }
                        },
                        layout: {
                            type: 'tabs',
                            tabs: [
                                { id: 'general', label: 'General', fields: ['name'] },
                                { id: 'contact', label: 'Contact', fields: ['email'] }
                            ]
                        }
                    }
                });

                var body = fixture.el.querySelector('.funky-form-body.funky-form-tabs');
                expect(body).not.toBeNull();
            });

            it('renders tab navigation', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' },
                            email: { type: 'email', label: 'Email' }
                        },
                        layout: {
                            type: 'tabs',
                            tabs: [
                                { id: 'general', label: 'General', fields: ['name'] },
                                { id: 'contact', label: 'Contact', fields: ['email'] }
                            ]
                        }
                    }
                });

                var navTabs = fixture.el.querySelector('.nav-tabs');
                expect(navTabs).not.toBeNull();

                var navLinks = fixture.el.querySelectorAll('.nav-link');
                expect(navLinks.length).toBe(2);
            });

            it('renders tab labels', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'tabs',
                            tabs: [
                                { id: 'general', label: 'General Info', fields: ['name'] }
                            ]
                        }
                    }
                });

                var navLink = fixture.el.querySelector('.nav-link');
                expect(navLink.textContent).toBe('General Info');
            });

            it('renders tab content panes', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' },
                            email: { type: 'email', label: 'Email' }
                        },
                        layout: {
                            type: 'tabs',
                            tabs: [
                                { id: 'general', label: 'General', fields: ['name'] },
                                { id: 'contact', label: 'Contact', fields: ['email'] }
                            ]
                        }
                    }
                });

                var tabContent = fixture.el.querySelector('.tab-content');
                expect(tabContent).not.toBeNull();

                var panes = fixture.el.querySelectorAll('.tab-pane');
                expect(panes.length).toBe(2);
            });

            it('shows first tab by default', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' },
                            email: { type: 'email', label: 'Email' }
                        },
                        layout: {
                            type: 'tabs',
                            tabs: [
                                { id: 'general', label: 'General', fields: ['name'] },
                                { id: 'contact', label: 'Contact', fields: ['email'] }
                            ]
                        }
                    }
                });

                var navLinks = fixture.el.querySelectorAll('.nav-link');
                expect(navLinks[0].classList.contains('active')).toBe(true);
                expect(navLinks[1].classList.contains('active')).toBe(false);

                var panes = fixture.el.querySelectorAll('.tab-pane');
                expect(panes[0].classList.contains('active')).toBe(true);
                expect(panes[1].classList.contains('active')).toBe(false);
            });

            it('has correct tab IDs', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'tabs',
                            tabs: [
                                { id: 'my-tab', label: 'My Tab', fields: ['name'] }
                            ]
                        }
                    }
                });

                var pane = fixture.el.querySelector('.tab-pane');
                expect(pane.id).toBe('my-tab');
            });

            it('has ARIA attributes for tabs', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            name: { type: 'text', label: 'Name' }
                        },
                        layout: {
                            type: 'tabs',
                            tabs: [
                                { id: 'general', label: 'General', fields: ['name'] }
                            ]
                        }
                    }
                });

                var navTabs = fixture.el.querySelector('.nav-tabs');
                expect(navTabs.getAttribute('role')).toBe('tablist');

                var navLink = fixture.el.querySelector('.nav-link');
                expect(navLink.getAttribute('role')).toBe('tab');

                var pane = fixture.el.querySelector('.tab-pane');
                expect(pane.getAttribute('role')).toBe('tabpanel');
            });

        });

        describe('Nested layouts', function() {

            it('supports sections with nested columns', function() {
                Form.create('#form-container', {
                    schema: {
                        fields: {
                            first_name: { type: 'text', label: 'First Name' },
                            last_name: { type: 'text', label: 'Last Name' },
                            bio: { type: 'textarea', label: 'Bio' }
                        },
                        layout: {
                            type: 'sections',
                            sections: [
                                {
                                    id: 'names',
                                    title: 'Names',
                                    layout: { type: 'columns', columns: 2 },
                                    fields: ['first_name', 'last_name']
                                },
                                {
                                    id: 'about',
                                    title: 'About',
                                    fields: ['bio']
                                }
                            ]
                        }
                    }
                });

                var sections = fixture.el.querySelectorAll('.funky-form-section');
                expect(sections.length).toBe(2);

                // First section should have columns layout (nested inside content)
                var firstContent = sections[0].querySelector('.funky-form-section-content');
                var hasColumnsLayout = firstContent.querySelector('.funky-form-columns') !== null;
                expect(hasColumnsLayout).toBe(true);

                // Second section should have default layout (no columns container)
                var secondContent = sections[1].querySelector('.funky-form-section-content');
                var hasNoColumnsLayout = secondContent.querySelector('.funky-form-columns') === null;
                expect(hasNoColumnsLayout).toBe(true);
            });

        });

    });

});
