/**
 * E2E Tests: Inline Edit Flow
 *
 * Tests inline editing functionality in data tables.
 */

describe('Funky.E2E.InlineEdit', function() {

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

    var records = [
        { id: 1, name: 'Record One', value: 100, status: 'active', category: 'A' },
        { id: 2, name: 'Record Two', value: 200, status: 'pending', category: 'B' },
        { id: 3, name: 'Record Three', value: 300, status: 'active', category: 'A' }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="inline-edit-container"></div>');

        restoreAPI = E2E.mockAPI({
            '/api/records/': function(opts) {
                var id = parseInt(opts.url.split('/').pop());
                if (opts.options && opts.options.method === 'PATCH') {
                    var body = JSON.parse(opts.options.body);
                    var record = records.find(function(r) { return r.id === id; });
                    if (record) {
                        if (body.name !== undefined && body.name.length < 2) {
                            return { ok: false, status: 422, data: { error: 'Name too short' } };
                        }
                        Object.assign(record, body);
                        return { data: record };
                    }
                }
                return { data: records.find(function(r) { return r.id === id; }) };
            },
            '/api/records': { data: records }
        });
    });

    afterEach(function() {
        if (restoreAPI) restoreAPI();
        E2E.cleanup();
        fixture.destroy();
    });

    var editingCell = null;

    function createInlineEditTable() {
        var container = document.getElementById('inline-edit-container');
        container.innerHTML =
            '<div class="inline-edit-app">' +
                '<table id="records-table" class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Name</th>' +
                            '<th>Value</th>' +
                            '<th>Status</th>' +
                            '<th>Category</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="records-tbody"></tbody>' +
                '</table>' +
            '</div>';

        renderTable();
    }

    function renderTable() {
        var tbody = document.getElementById('records-tbody');
        tbody.innerHTML = '';

        records.forEach(function(record) {
            var tr = document.createElement('tr');
            tr.setAttribute('data-id', record.id);
            tr.innerHTML =
                '<td class="editable" data-field="name" data-type="text">' +
                    '<span class="cell-value">' + record.name + '</span>' +
                '</td>' +
                '<td class="editable" data-field="value" data-type="number">' +
                    '<span class="cell-value">' + record.value + '</span>' +
                '</td>' +
                '<td class="editable" data-field="status" data-type="select">' +
                    '<span class="cell-value">' + record.status + '</span>' +
                '</td>' +
                '<td class="editable" data-field="category" data-type="text">' +
                    '<span class="cell-value">' + record.category + '</span>' +
                '</td>';
            tbody.appendChild(tr);
        });

        initInlineEdit();
    }

    function initInlineEdit() {
        document.querySelectorAll('.editable').forEach(function(cell) {
            cell.addEventListener('dblclick', function() {
                startEdit(this);
            });
        });
    }

    function startEdit(cell) {
        if (editingCell) {
            cancelEdit();
        }

        editingCell = cell;
        var field = cell.getAttribute('data-field');
        var type = cell.getAttribute('data-type');
        var currentValue = cell.querySelector('.cell-value').textContent;
        var row = cell.closest('tr');
        var recordId = row.getAttribute('data-id');

        cell.classList.add('editing');

        var input;
        if (type === 'select') {
            input = document.createElement('select');
            input.className = 'inline-input';
            var options = field === 'status'
                ? ['active', 'pending', 'inactive']
                : ['A', 'B', 'C'];

            options.forEach(function(opt) {
                var option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                if (opt === currentValue) option.selected = true;
                input.appendChild(option);
            });
        } else if (type === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.className = 'inline-input';
            input.value = currentValue;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'inline-input';
            input.value = currentValue;
        }

        input.setAttribute('data-original', currentValue);

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit(cell, recordId, field, this.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                saveEdit(cell, recordId, field, this.value);
                var nextCell = getNextEditableCell(cell, e.shiftKey);
                if (nextCell) {
                    setTimeout(function() {
                        startEdit(nextCell);
                    }, 50);
                }
            }
        });

        input.addEventListener('blur', function() {
            setTimeout(function() {
                if (editingCell === cell) {
                    saveEdit(cell, recordId, field, input.value);
                }
            }, 100);
        });

        cell.querySelector('.cell-value').style.display = 'none';
        cell.appendChild(input);
        input.focus();
        if (input.select) input.select();
    }

    function saveEdit(cell, recordId, field, newValue) {
        var input = cell.querySelector('.inline-input');
        if (!input) return;

        var originalValue = input.getAttribute('data-original');

        if (newValue === originalValue) {
            cancelEdit();
            return;
        }

        var updateData = {};
        updateData[field] = newValue;

        fetch('/api/records/' + recordId, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        })
        .then(function(r) {
            return r.json().then(function(data) {
                return { ok: r.ok, data: data };
            });
        })
        .then(function(result) {
            if (!result.ok || result.data.error) {
                Toast.error(result.data.error || 'Failed to save');
                input.value = originalValue;
                input.classList.add('error');
                input.focus();
                return;
            }

            var cellValue = cell.querySelector('.cell-value');
            cellValue.textContent = newValue;
            cellValue.style.display = '';

            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
            cell.classList.remove('editing');
            editingCell = null;

            Toast.success('Updated successfully');
        });
    }

    function cancelEdit() {
        if (!editingCell) return;

        var input = editingCell.querySelector('.inline-input');
        if (input) {
            input.parentNode.removeChild(input);
        }

        var cellValue = editingCell.querySelector('.cell-value');
        cellValue.style.display = '';

        editingCell.classList.remove('editing');
        editingCell = null;
    }

    function getNextEditableCell(currentCell, reverse) {
        var allCells = Array.from(document.querySelectorAll('.editable'));
        var currentIndex = allCells.indexOf(currentCell);

        if (reverse) {
            return currentIndex > 0 ? allCells[currentIndex - 1] : null;
        } else {
            return currentIndex < allCells.length - 1 ? allCells[currentIndex + 1] : null;
        }
    }

    describe('Activation', function() {

        it('User can activate inline edit on double-click', function() {
            return E2E.scenario('Double-Click to Edit')
                .given('I have a table with editable cells', function() {
                    createInlineEditTable();
                    return E2E.waitFor('.editable');
                })
                .when('I double-click a cell', function() {
                    var cell = document.querySelector('tr[data-id="1"] .editable[data-field="name"]');
                    return E2E.dblClick(cell);
                })
                .then('Cell should enter edit mode', function() {
                    return E2E.waitFor('.editable.editing');
                })
                .and('An input should appear', function() {
                    E2E.assertExists('.inline-input');
                })
                .and('Input should have the current value', function() {
                    E2E.assertValue('.inline-input', 'Record One');
                })
                .and('Input should be focused', function() {
                    expect(document.activeElement.classList.contains('inline-input')).toBe(true);
                })
                .run();
        });

        it('Double-clicking another cell cancels current edit', function() {
            return E2E.scenario('Switch Edit Cell')
                .given('I am editing a cell', function() {
                    createInlineEditTable();
                    return E2E.waitFor('.editable')
                        .then(function() {
                            var cell = document.querySelector('tr[data-id="1"] .editable[data-field="name"]');
                            return E2E.dblClick(cell);
                        })
                        .then(function() { return E2E.waitFor('.inline-input'); });
                })
                .when('I double-click another cell', function() {
                    var cell = document.querySelector('tr[data-id="2"] .editable[data-field="name"]');
                    return E2E.dblClick(cell);
                })
                .then('Only one input should exist', function() {
                    return E2E.wait(50).then(function() {
                        var inputs = document.querySelectorAll('.inline-input');
                        expect(inputs.length).toBe(1);
                    });
                })
                .and('The new cell should be editing', function() {
                    E2E.assertValue('.inline-input', 'Record Two');
                })
                .run();
        });

    });

    describe('Saving', function() {

        it('User can edit text field and save with Enter', function() {
            if (isHeadless) return;

            return E2E.scenario('Save with Enter')
                .given('I am editing a text cell', function() {
                    createInlineEditTable();
                    return E2E.waitFor('.editable')
                        .then(function() {
                            var cell = document.querySelector('tr[data-id="1"] .editable[data-field="name"]');
                            return E2E.dblClick(cell);
                        })
                        .then(function() { return E2E.waitFor('.inline-input'); });
                })
                .when('I change the value', function() {
                    return E2E.clear('.inline-input')
                        .then(function() { return E2E.type('.inline-input', 'Updated Record', { clear: false }); });
                })
                .and('I press Enter', function() {
                    return E2E.press('.inline-input', 'Enter');
                })
                .then('I should see success message', function() {
                    return E2E.waitForText('Updated successfully');
                })
                .and('Cell should show new value', function() {
                    return E2E.wait(100).then(function() {
                        E2E.assertText('tr[data-id="1"] .editable[data-field="name"]', 'Updated Record');
                    });
                })
                .and('Input should be removed', function() {
                    E2E.assertNotExists('.inline-input');
                })
                .run();
        });

        it('User can cancel edit with Escape', function() {
            return E2E.scenario('Cancel with Escape')
                .given('I am editing a cell', function() {
                    createInlineEditTable();
                    return E2E.waitFor('.editable')
                        .then(function() {
                            var cell = document.querySelector('tr[data-id="1"] .editable[data-field="name"]');
                            return E2E.dblClick(cell);
                        })
                        .then(function() { return E2E.waitFor('.inline-input'); });
                })
                .when('I change the value', function() {
                    return E2E.clear('.inline-input')
                        .then(function() { return E2E.type('.inline-input', 'Changed Value', { clear: false }); });
                })
                .and('I press Escape', function() {
                    return E2E.press('.inline-input', 'Escape');
                })
                .then('Cell should show original value', function() {
                    return E2E.wait(50).then(function() {
                        E2E.assertText('tr[data-id="1"] .editable[data-field="name"]', 'Record One');
                    });
                })
                .and('Input should be removed', function() {
                    E2E.assertNotExists('.inline-input');
                })
                .run();
        });

        it('User can edit dropdown/select fields', function() {
            if (isHeadless) return;

            return E2E.scenario('Edit Select Field')
                .given('I double-click a status cell', function() {
                    createInlineEditTable();
                    return E2E.waitFor('.editable')
                        .then(function() {
                            var cell = document.querySelector('tr[data-id="1"] .editable[data-field="status"]');
                            return E2E.dblClick(cell);
                        })
                        .then(function() { return E2E.waitFor('.inline-input'); });
                })
                .then('A select dropdown should appear', function() {
                    var input = document.querySelector('.inline-input');
                    expect(input.tagName).toBe('SELECT');
                })
                .when('I select a different option', function() {
                    return E2E.select('.inline-input', 'pending');
                })
                .and('I press Enter', function() {
                    return E2E.press('.inline-input', 'Enter');
                })
                .then('Cell should show new value', function() {
                    return E2E.waitForText('Updated successfully').then(function() {
                        return E2E.wait(100);
                    }).then(function() {
                        E2E.assertText('tr[data-id="1"] .editable[data-field="status"]', 'pending');
                    });
                })
                .run();
        });

    });

    describe('Validation', function() {

        it('Validation errors display correctly', function() {
            if (isHeadless) return;

            return E2E.scenario('Validation Error')
                .given('I am editing a name cell', function() {
                    createInlineEditTable();
                    return E2E.waitFor('.editable')
                        .then(function() {
                            var cell = document.querySelector('tr[data-id="1"] .editable[data-field="name"]');
                            return E2E.dblClick(cell);
                        })
                        .then(function() { return E2E.waitFor('.inline-input'); });
                })
                .when('I enter a too short value', function() {
                    return E2E.clear('.inline-input')
                        .then(function() { return E2E.type('.inline-input', 'A', { clear: false }); });
                })
                .and('I press Enter', function() {
                    return E2E.press('.inline-input', 'Enter');
                })
                .then('I should see an error message', function() {
                    return E2E.waitForText('Name too short');
                })
                .and('Input should have error class', function() {
                    return E2E.wait(100).then(function() {
                        E2E.assertHasClass('.inline-input', 'error');
                    });
                })
                .and('Input should remain visible', function() {
                    E2E.assertExists('.inline-input');
                })
                .run();
        });

    });

    describe('Navigation', function() {

        it('User can tab between editable fields', function() {
            if (isHeadless) return;

            return E2E.scenario('Tab Navigation')
                .given('I am editing the first cell', function() {
                    createInlineEditTable();
                    return E2E.waitFor('.editable')
                        .then(function() {
                            var cell = document.querySelector('tr[data-id="1"] .editable[data-field="name"]');
                            return E2E.dblClick(cell);
                        })
                        .then(function() { return E2E.waitFor('.inline-input'); });
                })
                .when('I press Tab', function() {
                    return E2E.press('.inline-input', 'Tab');
                })
                .then('The next cell should be editing', function() {
                    return E2E.wait(200).then(function() {
                        var editingCell = document.querySelector('.editable.editing');
                        expect(editingCell.getAttribute('data-field')).toBe('value');
                    });
                })
                .run();
        });

    });

});
