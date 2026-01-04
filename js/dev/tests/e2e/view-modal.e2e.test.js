/**
 * E2E Tests: View Modal Flow
 *
 * Tests read-only view modals for displaying record details.
 */

describe('Funky.E2E.ViewModal', function() {

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
        {
            id: 1,
            name: 'Complete Record',
            description: 'This is a comprehensive record with all fields populated.',
            status: 'Active',
            category: 'Primary',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-06-20T14:45:00Z',
            owner: 'John Doe',
            priority: 'High',
            tags: ['important', 'reviewed', 'approved'],
            metadata: {
                source: 'Import',
                version: '2.1',
                checksum: 'abc123def456'
            }
        },
        {
            id: 2,
            name: 'Partial Record',
            description: null,
            status: 'Pending',
            category: 'Secondary',
            created_at: '2024-03-10T08:00:00Z',
            updated_at: null,
            owner: 'Jane Smith',
            priority: 'Medium',
            tags: [],
            metadata: null
        }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="view-modal-container"></div>');

        restoreAPI = E2E.mockAPI({
            '/api/records/': function(opts) {
                // Match /api/records/:id
                var id = parseInt(opts.url.split('/').pop());
                if (id && !isNaN(id)) {
                    return { data: records.find(function(r) { return r.id === id; }) };
                }
                // If no valid ID, return all records
                return { data: records };
            }
        });
    });

    afterEach(function() {
        if (restoreAPI) restoreAPI();
        E2E.cleanup();
        fixture.destroy();
    });

    function createViewModalUI() {
        var container = document.getElementById('view-modal-container');
        container.innerHTML =
            '<div class="records-app">' +
                '<table id="records-table" class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Name</th>' +
                            '<th>Status</th>' +
                            '<th>Owner</th>' +
                            '<th>Actions</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="records-tbody"></tbody>' +
                '</table>' +
            '</div>' +
            '<div id="view-modal" class="modal view-modal" style="display: none;">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h3 id="view-title">Record Details</h3>' +
                        '<button id="close-view-btn" class="btn-close">×</button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                        '<div id="loading-indicator" class="loading" style="display: none;">Loading...</div>' +
                        '<div id="view-content" class="view-content"></div>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button id="edit-from-view-btn" class="btn btn-primary">Edit</button>' +
                        '<button id="copy-details-btn" class="btn btn-secondary">Copy Details</button>' +
                        '<button id="close-view-footer-btn" class="btn btn-secondary">Close</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        renderTable();
        initViewModalLogic();
    }

    function renderTable() {
        var tbody = document.getElementById('records-tbody');
        tbody.innerHTML = '';

        records.forEach(function(r) {
            var tr = document.createElement('tr');
            tr.setAttribute('data-id', r.id);
            tr.innerHTML =
                '<td>' + r.name + '</td>' +
                '<td>' + r.status + '</td>' +
                '<td>' + r.owner + '</td>' +
                '<td>' +
                    '<button class="btn btn-sm view-btn" data-id="' + r.id + '">View</button>' +
                    '<button class="btn btn-sm edit-btn" data-id="' + r.id + '">Edit</button>' +
                '</td>';
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.view-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                openViewModal(parseInt(this.getAttribute('data-id')));
            });
        });
    }

    var currentViewId = null;

    function initViewModalLogic() {
        document.getElementById('close-view-btn').addEventListener('click', closeViewModal);
        document.getElementById('close-view-footer-btn').addEventListener('click', closeViewModal);

        document.getElementById('edit-from-view-btn').addEventListener('click', function() {
            if (currentViewId) {
                closeViewModal();
                Toast.info('Opening edit mode for record #' + currentViewId);
            }
        });

        document.getElementById('copy-details-btn').addEventListener('click', function() {
            copyDetails();
        });
    }

    function openViewModal(recordId) {
        currentViewId = recordId;
        var modal = document.getElementById('view-modal');
        var content = document.getElementById('view-content');
        var loading = document.getElementById('loading-indicator');

        modal.style.display = 'block';
        loading.style.display = 'block';
        content.innerHTML = '';

        fetch('/api/records/' + recordId)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                loading.style.display = 'none';
                renderViewContent(data);
            });
    }

    function renderViewContent(record) {
        var content = document.getElementById('view-content');

        var html = '<dl class="detail-list">';

        html += '<dt>ID</dt><dd>' + record.id + '</dd>';
        html += '<dt>Name</dt><dd>' + record.name + '</dd>';
        html += '<dt>Description</dt><dd>' + (record.description || '<em class="text-muted">No description</em>') + '</dd>';
        html += '<dt>Status</dt><dd><span class="badge badge-' + record.status.toLowerCase() + '">' + record.status + '</span></dd>';
        html += '<dt>Category</dt><dd>' + record.category + '</dd>';
        html += '<dt>Priority</dt><dd>' + record.priority + '</dd>';
        html += '<dt>Owner</dt><dd>' + record.owner + '</dd>';

        if (record.tags && record.tags.length > 0) {
            html += '<dt>Tags</dt><dd>';
            record.tags.forEach(function(tag) {
                html += '<span class="tag">' + tag + '</span> ';
            });
            html += '</dd>';
        } else {
            html += '<dt>Tags</dt><dd><em class="text-muted">No tags</em></dd>';
        }

        html += '<dt>Created</dt><dd>' + formatDate(record.created_at) + '</dd>';
        html += '<dt>Updated</dt><dd>' + (record.updated_at ? formatDate(record.updated_at) : '<em class="text-muted">Never updated</em>') + '</dd>';

        if (record.metadata) {
            html += '<dt>Metadata</dt><dd><pre class="metadata">' + JSON.stringify(record.metadata, null, 2) + '</pre></dd>';
        }

        html += '</dl>';

        content.innerHTML = html;
    }

    function formatDate(dateStr) {
        var date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    function closeViewModal() {
        document.getElementById('view-modal').style.display = 'none';
        currentViewId = null;
    }

    function copyDetails() {
        var content = document.getElementById('view-content');
        var text = content.innerText;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() {
                Toast.success('Details copied to clipboard');
            }).catch(function() {
                Toast.error('Failed to copy');
            });
        } else {
            Toast.success('Details copied to clipboard');
        }
    }

    describe('Opening View Modal', function() {

        it('User can open view modal for record details', function() {
            if (isHeadless) return;

            return E2E.scenario('Open View Modal')
                .given('I have a table with records', function() {
                    createViewModalUI();
                    return E2E.waitFor('.view-btn');
                })
                .when('I click View on the first record', function() {
                    return E2E.click('.view-btn[data-id="1"]');
                })
                .then('View modal should be visible', function() {
                    return E2E.waitFor('#view-modal[style*="block"]');
                })
                .and('Modal should show record details', function() {
                    return E2E.waitFor('.detail-list').then(function() {
                        E2E.assertText('#view-content', 'Complete Record');
                    });
                })
                .run();
        });

        it('View modal displays all fields correctly', function() {
            if (isHeadless) return;

            return E2E.scenario('Display All Fields')
                .given('I opened view modal for first record', function() {
                    createViewModalUI();
                    return E2E.waitFor('.view-btn')
                        .then(function() { return E2E.click('.view-btn[data-id="1"]'); })
                        .then(function() { return E2E.waitFor('.detail-list'); });
                })
                .then('I should see the name', function() {
                    E2E.assertText('#view-content', 'Complete Record');
                })
                .and('I should see the description', function() {
                    E2E.assertText('#view-content', 'comprehensive record');
                })
                .and('I should see the status badge', function() {
                    E2E.assertExists('.badge');
                    E2E.assertText('.badge', 'Active');
                })
                .and('I should see the owner', function() {
                    E2E.assertText('#view-content', 'John Doe');
                })
                .and('I should see the tags', function() {
                    E2E.assertText('#view-content', 'important');
                    E2E.assertText('#view-content', 'reviewed');
                })
                .and('I should see the metadata', function() {
                    E2E.assertExists('.metadata');
                    E2E.assertText('.metadata', 'Import');
                })
                .run();
        });

        it('View modal handles missing fields gracefully', function() {
            if (isHeadless) return;

            return E2E.scenario('Handle Missing Fields')
                .given('I opened view modal for partial record', function() {
                    createViewModalUI();
                    return E2E.waitFor('.view-btn')
                        .then(function() { return E2E.click('.view-btn[data-id="2"]'); })
                        .then(function() { return E2E.waitFor('.detail-list'); });
                })
                .then('Missing description should show placeholder', function() {
                    E2E.assertText('#view-content', 'No description');
                })
                .and('Missing updated date should show placeholder', function() {
                    E2E.assertText('#view-content', 'Never updated');
                })
                .and('Empty tags should show placeholder', function() {
                    E2E.assertText('#view-content', 'No tags');
                })
                .run();
        });

    });

    describe('View Modal Actions', function() {

        it('User can navigate to edit from view modal', function() {
            if (isHeadless) return;

            return E2E.scenario('Edit from View')
                .given('I have view modal open', function() {
                    createViewModalUI();
                    return E2E.waitFor('.view-btn')
                        .then(function() { return E2E.click('.view-btn[data-id="1"]'); })
                        .then(function() { return E2E.waitFor('.detail-list'); });
                })
                .when('I click Edit button', function() {
                    return E2E.click('#edit-from-view-btn');
                })
                .then('Modal should close', function() {
                    return E2E.wait(100).then(function() {
                        E2E.assertHidden('#view-modal');
                    });
                })
                .and('I should see edit mode message', function() {
                    return E2E.waitForText('Opening edit mode');
                })
                .run();
        });

        it('User can copy data from view modal', function() {
            if (isHeadless) return;

            return E2E.scenario('Copy Details')
                .given('I have view modal open', function() {
                    createViewModalUI();
                    return E2E.waitFor('.view-btn')
                        .then(function() { return E2E.click('.view-btn[data-id="1"]'); })
                        .then(function() { return E2E.waitFor('.detail-list'); });
                })
                .when('I click Copy Details', function() {
                    return E2E.click('#copy-details-btn');
                })
                .then('I should see success message', function() {
                    return E2E.waitForText('copied to clipboard');
                })
                .run();
        });

        it('User can close view modal', function() {
            return E2E.scenario('Close View Modal')
                .given('I have view modal open', function() {
                    createViewModalUI();
                    return E2E.waitFor('.view-btn')
                        .then(function() { return E2E.click('.view-btn[data-id="1"]'); })
                        .then(function() { return E2E.waitFor('#view-modal[style*="block"]'); });
                })
                .when('I click close button', function() {
                    return E2E.click('#close-view-btn');
                })
                .then('Modal should close', function() {
                    return E2E.wait(50).then(function() {
                        E2E.assertHidden('#view-modal');
                    });
                })
                .run();
        });

    });

    describe('Loading States', function() {

        it('View modal shows loading state', function() {
            return E2E.scenario('Loading State')
                .given('I have a table with records', function() {
                    createViewModalUI();
                    return E2E.waitFor('.view-btn');
                })
                .when('I click View', function() {
                    return E2E.click('.view-btn[data-id="1"]');
                })
                .then('Modal should show initially', function() {
                    return E2E.waitFor('#view-modal[style*="block"]');
                })
                .and('Content should load', function() {
                    return E2E.waitFor('.detail-list');
                })
                .run();
        });

    });

});
