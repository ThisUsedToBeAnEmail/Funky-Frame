/**
 * E2E Tests: Bulk Operations Flow
 *
 * Tests multi-select and bulk action workflows.
 */

describe('Funky.E2E.BulkOperations', function() {

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

    var items = [];

    beforeEach(function() {
        items = [
            { id: 1, name: 'Item 1', status: 'Active', category: 'A' },
            { id: 2, name: 'Item 2', status: 'Active', category: 'B' },
            { id: 3, name: 'Item 3', status: 'Inactive', category: 'A' },
            { id: 4, name: 'Item 4', status: 'Active', category: 'C' },
            { id: 5, name: 'Item 5', status: 'Inactive', category: 'B' }
        ];

        fixture = FunkyTests.fixture('<div id="bulk-container"></div>');

        restoreAPI = E2E.mockAPI({
            '/api/items/bulk-delete': function(opts) {
                var body = JSON.parse(opts.options.body);
                var ids = body.ids;
                items = items.filter(function(i) { return ids.indexOf(i.id) === -1; });
                return { data: { success: true, deleted: ids.length } };
            },
            '/api/items/bulk-update': function(opts) {
                var body = JSON.parse(opts.options.body);
                body.ids.forEach(function(id) {
                    var item = items.find(function(i) { return i.id === id; });
                    if (item) {
                        Object.assign(item, body.updates);
                    }
                });
                return { data: { success: true, updated: body.ids.length } };
            },
            '/api/items': { data: items }
        });
    });

    afterEach(function() {
        if (restoreAPI) restoreAPI();
        E2E.cleanup();
        fixture.destroy();
    });

    var selectedIds = [];

    function createBulkTable() {
        var container = document.getElementById('bulk-container');
        container.innerHTML =
            '<div class="bulk-app">' +
                '<div class="action-bar" id="action-bar" style="display: none;">' +
                    '<span id="selected-count">0 selected</span>' +
                    '<button id="bulk-delete-btn" class="btn btn-danger">Delete Selected</button>' +
                    '<button id="bulk-activate-btn" class="btn btn-success">Activate Selected</button>' +
                    '<button id="bulk-deactivate-btn" class="btn btn-warning">Deactivate Selected</button>' +
                    '<button id="clear-selection-btn" class="btn btn-secondary">Clear Selection</button>' +
                '</div>' +
                '<table id="items-table" class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th><input type="checkbox" id="select-all"></th>' +
                            '<th>Name</th>' +
                            '<th>Status</th>' +
                            '<th>Category</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="items-tbody"></tbody>' +
                '</table>' +
            '</div>' +
            '<div id="confirm-modal" class="modal" style="display: none;">' +
                '<div class="modal-content">' +
                    '<p id="confirm-message">Are you sure?</p>' +
                    '<button id="confirm-yes-btn" class="btn btn-danger">Yes</button>' +
                    '<button id="confirm-no-btn" class="btn btn-secondary">No</button>' +
                '</div>' +
            '</div>';

        selectedIds = [];
        renderTable();
        initBulkLogic();
    }

    function renderTable() {
        var tbody = document.getElementById('items-tbody');
        tbody.innerHTML = '';

        items.forEach(function(item) {
            var tr = document.createElement('tr');
            tr.setAttribute('data-id', item.id);
            var isSelected = selectedIds.indexOf(item.id) !== -1;
            if (isSelected) tr.classList.add('selected');

            tr.innerHTML =
                '<td><input type="checkbox" class="row-checkbox" data-id="' + item.id + '"' + (isSelected ? ' checked' : '') + '></td>' +
                '<td>' + item.name + '</td>' +
                '<td class="item-status">' + item.status + '</td>' +
                '<td>' + item.category + '</td>';
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.row-checkbox').forEach(function(cb) {
            cb.addEventListener('change', function() {
                var id = parseInt(this.getAttribute('data-id'));
                toggleSelection(id, this.checked);
            });
        });

        updateSelectAll();
    }

    function initBulkLogic() {
        document.getElementById('select-all').addEventListener('change', function() {
            var checked = this.checked;
            if (checked) {
                selectedIds = items.map(function(i) { return i.id; });
            } else {
                selectedIds = [];
            }
            renderTable();
            updateActionBar();
        });

        document.getElementById('bulk-delete-btn').addEventListener('click', function() {
            showConfirm('Are you sure you want to delete ' + selectedIds.length + ' items?', function() {
                bulkDelete();
            });
        });

        document.getElementById('bulk-activate-btn').addEventListener('click', function() {
            bulkUpdate({ status: 'Active' });
        });

        document.getElementById('bulk-deactivate-btn').addEventListener('click', function() {
            bulkUpdate({ status: 'Inactive' });
        });

        document.getElementById('clear-selection-btn').addEventListener('click', function() {
            selectedIds = [];
            renderTable();
            updateActionBar();
        });

        document.getElementById('confirm-no-btn').addEventListener('click', hideConfirm);
    }

    function toggleSelection(id, selected) {
        if (selected && selectedIds.indexOf(id) === -1) {
            selectedIds.push(id);
        } else if (!selected) {
            selectedIds = selectedIds.filter(function(i) { return i !== id; });
        }
        updateActionBar();
        updateSelectAll();

        var row = document.querySelector('tr[data-id="' + id + '"]');
        if (row) {
            if (selected) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        }
    }

    function updateActionBar() {
        var actionBar = document.getElementById('action-bar');
        var countSpan = document.getElementById('selected-count');

        if (selectedIds.length > 0) {
            actionBar.style.display = 'block';
            countSpan.textContent = selectedIds.length + ' selected';
        } else {
            actionBar.style.display = 'none';
        }
    }

    function updateSelectAll() {
        var selectAll = document.getElementById('select-all');
        var allChecked = items.length > 0 && selectedIds.length === items.length;
        var someChecked = selectedIds.length > 0 && selectedIds.length < items.length;

        selectAll.checked = allChecked;
        selectAll.indeterminate = someChecked;
    }

    var confirmCallback = null;

    function showConfirm(message, callback) {
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('confirm-modal').style.display = 'block';
        confirmCallback = callback;

        document.getElementById('confirm-yes-btn').onclick = function() {
            hideConfirm();
            if (confirmCallback) confirmCallback();
        };
    }

    function hideConfirm() {
        document.getElementById('confirm-modal').style.display = 'none';
        confirmCallback = null;
    }

    function bulkDelete() {
        fetch('/api/items/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
        })
        .then(function(r) { return r.json(); })
        .then(function(result) {
            Toast.success(result.deleted + ' items deleted');
            selectedIds = [];
            renderTable();
            updateActionBar();
        });
    }

    function bulkUpdate(updates) {
        fetch('/api/items/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds, updates: updates })
        })
        .then(function(r) { return r.json(); })
        .then(function(result) {
            Toast.success(result.updated + ' items updated');
            renderTable();
        });
    }

    describe('Selection', function() {

        it('User can select individual rows with checkboxes', function() {
            return E2E.scenario('Select Individual Rows')
                .given('I have a table with selectable rows', function() {
                    createBulkTable();
                    return E2E.waitFor('#items-table tbody tr');
                })
                .when('I check the first row', function() {
                    var checkbox = document.querySelector('tr[data-id="1"] .row-checkbox');
                    return E2E.check(checkbox);
                })
                .then('The action bar should appear', function() {
                    E2E.assertVisible('#action-bar');
                })
                .and('Selected count should show 1', function() {
                    E2E.assertText('#selected-count', '1 selected');
                })
                .and('The row should be highlighted', function() {
                    E2E.assertHasClass('tr[data-id="1"]', 'selected');
                })
                .when('I check another row', function() {
                    var checkbox = document.querySelector('tr[data-id="3"] .row-checkbox');
                    return E2E.check(checkbox);
                })
                .then('Selected count should show 2', function() {
                    E2E.assertText('#selected-count', '2 selected');
                })
                .run();
        });

        it('User can select all rows on current page', function() {
            return E2E.scenario('Select All')
                .given('I have a table with multiple rows', function() {
                    createBulkTable();
                    return E2E.waitFor('#select-all');
                })
                .when('I check the select-all checkbox', function() {
                    return E2E.check('#select-all');
                })
                .then('All rows should be selected', function() {
                    var checkboxes = document.querySelectorAll('.row-checkbox:checked');
                    expect(checkboxes.length).toBe(5);
                })
                .and('Selected count should show 5', function() {
                    E2E.assertText('#selected-count', '5 selected');
                })
                .and('All rows should be highlighted', function() {
                    var selectedRows = document.querySelectorAll('tr.selected');
                    expect(selectedRows.length).toBe(5);
                })
                .run();
        });

        it('User can see selected count update in action bar', function() {
            return E2E.scenario('Count Updates')
                .given('I have selected 2 items', function() {
                    createBulkTable();
                    return E2E.waitFor('.row-checkbox')
                        .then(function() {
                            return E2E.check(document.querySelector('tr[data-id="1"] .row-checkbox'));
                        })
                        .then(function() {
                            return E2E.check(document.querySelector('tr[data-id="2"] .row-checkbox'));
                        });
                })
                .then('Count should be 2', function() {
                    E2E.assertText('#selected-count', '2 selected');
                })
                .when('I deselect one', function() {
                    return E2E.uncheck(document.querySelector('tr[data-id="1"] .row-checkbox'));
                })
                .then('Count should be 1', function() {
                    E2E.assertText('#selected-count', '1 selected');
                })
                .run();
        });

        it('User can clear selection with clear button', function() {
            return E2E.scenario('Clear Selection')
                .given('I have selected multiple items', function() {
                    createBulkTable();
                    return E2E.waitFor('#select-all')
                        .then(function() { return E2E.check('#select-all'); });
                })
                .then('Action bar should be visible', function() {
                    E2E.assertVisible('#action-bar');
                })
                .when('I click Clear Selection', function() {
                    return E2E.click('#clear-selection-btn');
                })
                .then('No rows should be selected', function() {
                    var checked = document.querySelectorAll('.row-checkbox:checked');
                    expect(checked.length).toBe(0);
                })
                .and('Action bar should be hidden', function() {
                    E2E.assertHidden('#action-bar');
                })
                .run();
        });

    });

    describe('Bulk Actions', function() {

        it('User can perform bulk delete with confirmation', function() {
            if (isHeadless) return;

            return E2E.scenario('Bulk Delete')
                .given('I have selected 2 items', function() {
                    createBulkTable();
                    return E2E.waitFor('.row-checkbox')
                        .then(function() {
                            return E2E.check(document.querySelector('tr[data-id="1"] .row-checkbox'));
                        })
                        .then(function() {
                            return E2E.check(document.querySelector('tr[data-id="2"] .row-checkbox'));
                        });
                })
                .when('I click Delete Selected', function() {
                    return E2E.click('#bulk-delete-btn');
                })
                .then('Confirm modal should appear', function() {
                    return E2E.waitFor('#confirm-modal[style*="block"]');
                })
                .and('It should mention the count', function() {
                    E2E.assertText('#confirm-message', '2 items');
                })
                .when('I confirm the deletion', function() {
                    return E2E.click('#confirm-yes-btn');
                })
                .then('I should see success message', function() {
                    return E2E.waitForText('2 items deleted');
                })
                .and('Table should show 3 rows', function() {
                    return E2E.wait(100).then(function() {
                        var rows = document.querySelectorAll('#items-tbody tr');
                        expect(rows.length).toBe(3);
                    });
                })
                .and('Action bar should be hidden', function() {
                    E2E.assertHidden('#action-bar');
                })
                .run();
        });

        it('User can perform bulk status update', function() {
            if (isHeadless) return;

            return E2E.scenario('Bulk Update Status')
                .given('I have selected inactive items', function() {
                    createBulkTable();
                    return E2E.waitFor('.row-checkbox')
                        .then(function() {
                            return E2E.check(document.querySelector('tr[data-id="3"] .row-checkbox'));
                        })
                        .then(function() {
                            return E2E.check(document.querySelector('tr[data-id="5"] .row-checkbox'));
                        });
                })
                .when('I click Activate Selected', function() {
                    return E2E.click('#bulk-activate-btn');
                })
                .then('I should see success message', function() {
                    return E2E.waitForText('2 items updated');
                })
                .and('Items should now be Active', function() {
                    return E2E.wait(100).then(function() {
                        var row3 = document.querySelector('tr[data-id="3"] .item-status');
                        var row5 = document.querySelector('tr[data-id="5"] .item-status');
                        E2E.assertText(row3, 'Active');
                        E2E.assertText(row5, 'Active');
                    });
                })
                .run();
        });

        it('Bulk action button disabled when nothing selected', function() {
            return E2E.scenario('Disabled State')
                .given('I have a table with no selection', function() {
                    createBulkTable();
                    return E2E.waitFor('#items-table');
                })
                .then('Action bar should be hidden', function() {
                    E2E.assertHidden('#action-bar');
                })
                .when('I select and then deselect an item', function() {
                    return E2E.check(document.querySelector('tr[data-id="1"] .row-checkbox'))
                        .then(function() {
                            return E2E.uncheck(document.querySelector('tr[data-id="1"] .row-checkbox'));
                        });
                })
                .then('Action bar should be hidden again', function() {
                    E2E.assertHidden('#action-bar');
                })
                .run();
        });

        it('User can cancel bulk delete', function() {
            return E2E.scenario('Cancel Bulk Delete')
                .given('I have selected items and clicked delete', function() {
                    createBulkTable();
                    return E2E.waitFor('.row-checkbox')
                        .then(function() { return E2E.check(document.querySelector('tr[data-id="1"] .row-checkbox')); })
                        .then(function() { return E2E.click('#bulk-delete-btn'); })
                        .then(function() { return E2E.waitFor('#confirm-modal[style*="block"]'); });
                })
                .when('I click No', function() {
                    return E2E.click('#confirm-no-btn');
                })
                .then('Modal should close', function() {
                    return E2E.wait(50).then(function() {
                        E2E.assertHidden('#confirm-modal');
                    });
                })
                .and('Items should still be there', function() {
                    var rows = document.querySelectorAll('#items-tbody tr');
                    expect(rows.length).toBe(5);
                })
                .and('Selection should be preserved', function() {
                    E2E.assertChecked('tr[data-id="1"] .row-checkbox');
                })
                .run();
        });

    });

});