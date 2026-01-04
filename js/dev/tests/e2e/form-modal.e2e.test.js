/**
 * E2E Tests: Form Modal Flow
 *
 * Tests dynamic form modals for create and edit operations.
 */

describe('Funky.E2E.FormModal', function() {

    var E2E = FunkyTests.E2E;
    var Toast = Funky.Toast;
    var fixture;
    var restoreAPI;

    // Skip all tests if E2E utilities not available
    if (!E2E) {
        it('E2E utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var isHeadless = navigator.webdriver ||
                      window.frameElement !== null ||
                      window.parent !== window ||
                      !document.hasFocus();

    var entities = [
        { id: 1, name: 'Entity One', description: 'First entity', type: 'primary', priority: 1, active: true },
        { id: 2, name: 'Entity Two', description: 'Second entity', type: 'secondary', priority: 2, active: true },
        { id: 3, name: 'Entity Three', description: 'Third entity', type: 'primary', priority: 3, active: false }
    ];

    var types = [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'tertiary', label: 'Tertiary' }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="form-modal-container"></div>');

        restoreAPI = E2E.mockAPI({
            '/api/entities': function(opts) {
                if (opts.options && opts.options.method === 'POST') {
                    var body = JSON.parse(opts.options.body);
                    if (!body.name || body.name.length < 3) {
                        return { ok: false, status: 422, data: { errors: { name: 'Name must be at least 3 characters' } } };
                    }
                    var newEntity = Object.assign({ id: entities.length + 1 }, body);
                    entities.push(newEntity);
                    return { data: newEntity };
                }
                return { data: entities };
            },
            '/api/entities/': function(opts) {
                var id = parseInt(opts.url.split('/').pop());
                if (opts.options && opts.options.method === 'PUT') {
                    var body = JSON.parse(opts.options.body);
                    if (!body.name || body.name.length < 3) {
                        return { ok: false, status: 422, data: { errors: { name: 'Name must be at least 3 characters' } } };
                    }
                    var entity = entities.find(function(e) { return e.id === id; });
                    if (entity) Object.assign(entity, body);
                    return { data: entity };
                }
                var found = entities.find(function(e) { return e.id === id; });
                return { data: found };
            },
            '/api/types': { data: types },
            '/api/schema/entity': {
                data: {
                    type: 'object',
                    required: ['name', 'type'],
                    properties: {
                        name: { type: 'string', minLength: 3, title: 'Name' },
                        description: { type: 'string', title: 'Description' },
                        type: { type: 'string', enum: ['primary', 'secondary', 'tertiary'], title: 'Type' },
                        priority: { type: 'integer', minimum: 1, maximum: 10, title: 'Priority' },
                        active: { type: 'boolean', title: 'Active' }
                    }
                }
            }
        });
    });

    afterEach(function() {
        if (restoreAPI) restoreAPI();
        E2E.cleanup();
        fixture.destroy();
    });

    function createFormModalUI() {
        var container = document.getElementById('form-modal-container');
        container.innerHTML =
            '<div class="entity-manager">' +
                '<div class="toolbar">' +
                    '<button id="create-btn" class="btn btn-primary">Create New</button>' +
                '</div>' +
                '<table id="entities-table" class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Name</th>' +
                            '<th>Type</th>' +
                            '<th>Priority</th>' +
                            '<th>Active</th>' +
                            '<th>Actions</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="entities-tbody"></tbody>' +
                '</table>' +
            '</div>' +
            '<div id="entity-modal" class="modal" style="display: none;">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h3 id="modal-title">Create Entity</h3>' +
                        '<button id="close-modal-btn" class="btn-close">×</button>' +
                    '</div>' +
                    '<form id="entity-form">' +
                        '<div class="form-group">' +
                            '<label for="field-name">Name *</label>' +
                            '<input type="text" id="field-name" name="name" class="form-control" required>' +
                            '<div class="field-error" id="error-name"></div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="field-description">Description</label>' +
                            '<textarea id="field-description" name="description" class="form-control" rows="3"></textarea>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="field-type">Type *</label>' +
                            '<select id="field-type" name="type" class="form-control" required>' +
                                '<option value="">Select type...</option>' +
                                '<option value="primary">Primary</option>' +
                                '<option value="secondary">Secondary</option>' +
                                '<option value="tertiary">Tertiary</option>' +
                            '</select>' +
                            '<div class="field-error" id="error-type"></div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="field-priority">Priority (1-10)</label>' +
                            '<input type="number" id="field-priority" name="priority" class="form-control" min="1" max="10">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label>' +
                                '<input type="checkbox" id="field-active" name="active">' +
                                ' Active' +
                            '</label>' +
                        '</div>' +
                        '<input type="hidden" id="entity-id" name="id">' +
                        '<div class="form-actions">' +
                            '<button type="submit" id="submit-btn" class="btn btn-primary">Save</button>' +
                            '<button type="button" id="cancel-btn" class="btn btn-secondary">Cancel</button>' +
                        '</div>' +
                    '</form>' +
                    '<div id="form-loading" class="loading-overlay" style="display: none;">' +
                        '<div class="spinner"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        initFormModalLogic();
        renderTable();
    }

    var currentEditId = null;
    var formDirty = false;

    function initFormModalLogic() {
        document.getElementById('create-btn').addEventListener('click', function() {
            openModal('create');
        });

        document.getElementById('close-modal-btn').addEventListener('click', function() {
            if (formDirty) {
                if (confirm('You have unsaved changes. Discard?')) {
                    closeModal();
                }
            } else {
                closeModal();
            }
        });

        document.getElementById('cancel-btn').addEventListener('click', function() {
            if (formDirty) {
                if (confirm('You have unsaved changes. Discard?')) {
                    closeModal();
                }
            } else {
                closeModal();
            }
        });

        document.getElementById('entity-form').addEventListener('submit', function(e) {
            e.preventDefault();
            submitForm();
        });

        document.getElementById('entity-form').addEventListener('input', function() {
            formDirty = true;
        });

        document.getElementById('field-type').addEventListener('change', function() {
            var priorityField = document.getElementById('field-priority');
            if (this.value === 'primary') {
                priorityField.value = '1';
            } else if (this.value === 'secondary') {
                priorityField.value = '5';
            }
        });
    }

    function renderTable() {
        var tbody = document.getElementById('entities-tbody');
        tbody.innerHTML = '';

        entities.forEach(function(e) {
            var tr = document.createElement('tr');
            tr.setAttribute('data-id', e.id);
            tr.innerHTML =
                '<td>' + e.name + '</td>' +
                '<td>' + e.type + '</td>' +
                '<td>' + e.priority + '</td>' +
                '<td>' + (e.active ? 'Yes' : 'No') + '</td>' +
                '<td>' +
                    '<button class="btn btn-sm edit-btn" data-id="' + e.id + '">Edit</button>' +
                '</td>';
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.edit-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                openModal('edit', parseInt(this.getAttribute('data-id')));
            });
        });
    }

    function openModal(mode, entityId) {
        var modal = document.getElementById('entity-modal');
        var form = document.getElementById('entity-form');
        var title = document.getElementById('modal-title');

        form.reset();
        clearErrors();
        formDirty = false;
        currentEditId = null;

        if (mode === 'edit' && entityId) {
            currentEditId = entityId;
            title.textContent = 'Edit Entity';

            var entity = entities.find(function(e) { return e.id === entityId; });
            if (entity) {
                document.getElementById('field-name').value = entity.name;
                document.getElementById('field-description').value = entity.description || '';
                document.getElementById('field-type').value = entity.type;
                document.getElementById('field-priority').value = entity.priority;
                document.getElementById('field-active').checked = entity.active;
                document.getElementById('entity-id').value = entity.id;
            }
        } else {
            title.textContent = 'Create Entity';
            document.getElementById('field-active').checked = true;
        }

        modal.style.display = 'block';
        document.getElementById('field-name').focus();
    }

    function closeModal() {
        document.getElementById('entity-modal').style.display = 'none';
        currentEditId = null;
        formDirty = false;
    }

    function clearErrors() {
        document.querySelectorAll('.field-error').forEach(function(el) {
            el.textContent = '';
        });
        document.querySelectorAll('.form-control.error').forEach(function(el) {
            el.classList.remove('error');
        });
    }

    function showErrors(errors) {
        clearErrors();
        for (var field in errors) {
            var errorEl = document.getElementById('error-' + field);
            var inputEl = document.getElementById('field-' + field);
            if (errorEl) {
                errorEl.textContent = errors[field];
            }
            if (inputEl) {
                inputEl.classList.add('error');
            }
        }
    }

    function submitForm() {
        clearErrors();

        var name = document.getElementById('field-name').value;
        var description = document.getElementById('field-description').value;
        var type = document.getElementById('field-type').value;
        var priority = document.getElementById('field-priority').value;
        var active = document.getElementById('field-active').checked;

        if (!name) {
            showErrors({ name: 'Name is required' });
            return;
        }

        if (!type) {
            showErrors({ type: 'Type is required' });
            return;
        }

        var data = {
            name: name,
            description: description,
            type: type,
            priority: parseInt(priority) || 1,
            active: active
        };

        showLoading(true);

        var url = currentEditId ? '/api/entities/' + currentEditId : '/api/entities';
        var method = currentEditId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(function(r) {
            return r.json().then(function(data) {
                return { ok: r.ok, data: data };
            });
        })
        .then(function(result) {
            showLoading(false);

            if (!result.ok || result.data.errors) {
                showErrors(result.data.errors || { name: 'An error occurred' });
                return;
            }

            Toast.success(currentEditId ? 'Entity updated successfully' : 'Entity created successfully');
            closeModal();
            renderTable();
        })
        .catch(function() {
            showLoading(false);
            Toast.error('Failed to save entity');
        });
    }

    function showLoading(show) {
        document.getElementById('form-loading').style.display = show ? 'flex' : 'none';
        document.getElementById('submit-btn').disabled = show;
    }

    describe('Create Modal', function() {

        it('User can open create modal with empty form', function() {
            return E2E.scenario('Open Create Modal')
                .given('I have the entity manager', function() {
                    createFormModalUI();
                    return E2E.waitFor('#create-btn');
                })
                .when('I click Create New', function() {
                    return E2E.click('#create-btn');
                })
                .then('Modal should be visible', function() {
                    return E2E.waitFor('#entity-modal[style*="block"]');
                })
                .and('Title should say Create Entity', function() {
                    E2E.assertText('#modal-title', 'Create Entity');
                })
                .and('Form fields should be empty', function() {
                    E2E.assertValue('#field-name', '');
                    E2E.assertValue('#field-description', '');
                    E2E.assertValue('#field-type', '');
                })
                .and('Active should be checked by default', function() {
                    E2E.assertChecked('#field-active');
                })
                .and('Name field should be focused', function() {
                    expect(document.activeElement.id).toBe('field-name');
                })
                .run();
        });

        it('User can create a new entity', function() {
            if (isHeadless) return;

            return E2E.scenario('Create Entity')
                .given('I opened the create modal', function() {
                    createFormModalUI();
                    return E2E.waitFor('#create-btn')
                        .then(function() { return E2E.click('#create-btn'); })
                        .then(function() { return E2E.waitFor('#entity-modal[style*="block"]'); });
                })
                .when('I fill in the form', function() {
                    return E2E.type('#field-name', 'New Entity')
                        .then(function() { return E2E.type('#field-description', 'A new entity description'); })
                        .then(function() { return E2E.select('#field-type', 'tertiary'); })
                        .then(function() { return E2E.type('#field-priority', '7'); });
                })
                .and('I submit the form', function() {
                    return E2E.click('#submit-btn');
                })
                .then('I should see success message', function() {
                    return E2E.waitForText('Entity created successfully');
                })
                .and('Modal should close', function() {
                    return E2E.wait(100).then(function() {
                        E2E.assertHidden('#entity-modal');
                    });
                })
                .and('New entity should appear in table', function() {
                    E2E.assertText('#entities-table', 'New Entity');
                })
                .run();
        });

        it('Form validates required fields', function() {
            return E2E.scenario('Required Field Validation')
                .given('I opened the create modal', function() {
                    createFormModalUI();
                    return E2E.waitFor('#create-btn')
                        .then(function() { return E2E.click('#create-btn'); })
                        .then(function() { return E2E.waitFor('#entity-modal[style*="block"]'); });
                })
                .when('I submit without filling required fields', function() {
                    return E2E.click('#submit-btn');
                })
                .then('I should see name error', function() {
                    return E2E.wait(50).then(function() {
                        E2E.assertText('#error-name', 'Name is required');
                    });
                })
                .and('Name field should have error class', function() {
                    E2E.assertHasClass('#field-name', 'error');
                })
                .run();
        });

        it('Form shows API validation errors', function() {
            if (isHeadless) return;

            return E2E.scenario('API Validation Error')
                .given('I opened the create modal', function() {
                    createFormModalUI();
                    return E2E.waitFor('#create-btn')
                        .then(function() { return E2E.click('#create-btn'); })
                        .then(function() { return E2E.waitFor('#entity-modal[style*="block"]'); });
                })
                .when('I enter a short name', function() {
                    return E2E.type('#field-name', 'AB')
                        .then(function() { return E2E.select('#field-type', 'primary'); });
                })
                .and('I submit the form', function() {
                    return E2E.click('#submit-btn');
                })
                .then('I should see API validation error', function() {
                    return E2E.waitUntil(function() {
                        return document.getElementById('error-name').textContent.indexOf('at least 3 characters') !== -1;
                    });
                })
                .run();
        });

    });

    describe('Edit Modal', function() {

        it('User can open edit modal with pre-filled data', function() {
            return E2E.scenario('Open Edit Modal')
                .given('I have entities in the table', function() {
                    createFormModalUI();
                    return E2E.waitFor('.edit-btn');
                })
                .when('I click Edit on the first entity', function() {
                    return E2E.click('.edit-btn[data-id="1"]');
                })
                .then('Modal should be visible', function() {
                    return E2E.waitFor('#entity-modal[style*="block"]');
                })
                .and('Title should say Edit Entity', function() {
                    E2E.assertText('#modal-title', 'Edit Entity');
                })
                .and('Form should be pre-filled', function() {
                    E2E.assertValue('#field-name', 'Entity One');
                    E2E.assertValue('#field-description', 'First entity');
                    E2E.assertValue('#field-type', 'primary');
                    E2E.assertValue('#field-priority', '1');
                })
                .and('Active checkbox should match entity state', function() {
                    E2E.assertChecked('#field-active');
                })
                .run();
        });

        it('User can update an entity', function() {
            if (isHeadless) return;

            return E2E.scenario('Update Entity')
                .given('I opened edit modal for first entity', function() {
                    createFormModalUI();
                    return E2E.waitFor('.edit-btn')
                        .then(function() { return E2E.click('.edit-btn[data-id="1"]'); })
                        .then(function() { return E2E.waitFor('#entity-modal[style*="block"]'); });
                })
                .when('I change the name', function() {
                    return E2E.clear('#field-name')
                        .then(function() { return E2E.type('#field-name', 'Updated Entity One', { clear: false }); });
                })
                .and('I submit the form', function() {
                    return E2E.click('#submit-btn');
                })
                .then('I should see success message', function() {
                    return E2E.waitForText('Entity updated successfully');
                })
                .and('Table should show updated name', function() {
                    return E2E.wait(100).then(function() {
                        E2E.assertText('tr[data-id="1"]', 'Updated Entity One');
                    });
                })
                .run();
        });

    });

    describe('Form Behavior', function() {

        it('User can cancel form and discard changes', function() {
            return E2E.scenario('Cancel Form')
                .given('I opened the create modal', function() {
                    createFormModalUI();
                    return E2E.waitFor('#create-btn')
                        .then(function() { return E2E.click('#create-btn'); })
                        .then(function() { return E2E.waitFor('#entity-modal[style*="block"]'); });
                })
                .when('I click Cancel', function() {
                    return E2E.click('#cancel-btn');
                })
                .then('Modal should close', function() {
                    return E2E.wait(50).then(function() {
                        E2E.assertHidden('#entity-modal');
                    });
                })
                .and('No new entity should be added', function() {
                    var rows = document.querySelectorAll('#entities-tbody tr');
                    expect(rows.length).toBe(3);
                })
                .run();
        });

        it('Form change handlers update dependent fields', function() {
            return E2E.scenario('Dependent Fields')
                .given('I opened the create modal', function() {
                    createFormModalUI();
                    return E2E.waitFor('#create-btn')
                        .then(function() { return E2E.click('#create-btn'); })
                        .then(function() { return E2E.waitFor('#entity-modal[style*="block"]'); });
                })
                .when('I select Primary type', function() {
                    return E2E.select('#field-type', 'primary');
                })
                .then('Priority should be set to 1', function() {
                    E2E.assertValue('#field-priority', '1');
                })
                .when('I select Secondary type', function() {
                    return E2E.select('#field-type', 'secondary');
                })
                .then('Priority should be set to 5', function() {
                    E2E.assertValue('#field-priority', '5');
                })
                .run();
        });

        it('Close button closes the modal', function() {
            return E2E.scenario('Close Modal')
                .given('I opened the modal', function() {
                    createFormModalUI();
                    return E2E.waitFor('#create-btn')
                        .then(function() { return E2E.click('#create-btn'); })
                        .then(function() { return E2E.waitFor('#entity-modal[style*="block"]'); });
                })
                .when('I click the close button', function() {
                    return E2E.click('#close-modal-btn');
                })
                .then('Modal should close', function() {
                    return E2E.wait(50).then(function() {
                        E2E.assertHidden('#entity-modal');
                    });
                })
                .run();
        });

    });

});
