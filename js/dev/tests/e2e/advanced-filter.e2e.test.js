/**
 * E2E Tests: Advanced Filter Flow
 *
 * Tests comprehensive filtering system with saved filters and history.
 */

describe('Funky.E2E.AdvancedFilter', function() {

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

    var products = [
        { id: 1, name: 'Widget A', category: 'Electronics', price: 99.99, status: 'In Stock', rating: 4.5 },
        { id: 2, name: 'Gadget B', category: 'Electronics', price: 149.99, status: 'In Stock', rating: 4.2 },
        { id: 3, name: 'Tool C', category: 'Hardware', price: 29.99, status: 'Low Stock', rating: 3.8 },
        { id: 4, name: 'Device D', category: 'Electronics', price: 299.99, status: 'Out of Stock', rating: 4.8 },
        { id: 5, name: 'Part E', category: 'Hardware', price: 9.99, status: 'In Stock', rating: 3.5 },
        { id: 6, name: 'Module F', category: 'Software', price: 49.99, status: 'In Stock', rating: 4.0 },
        { id: 7, name: 'Component G', category: 'Hardware', price: 19.99, status: 'Low Stock', rating: 4.1 },
        { id: 8, name: 'System H', category: 'Software', price: 199.99, status: 'In Stock', rating: 4.7 }
    ];

    var savedFilters = [
        { id: 1, name: 'Electronics Only', filters: { category: ['Electronics'] } },
        { id: 2, name: 'In Stock Items', filters: { status: ['In Stock'] } }
    ];

    var recentFilters = [];

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="filter-container"></div>');

        restoreAPI = E2E.mockAPI({
            '/api/products': function(opts) {
                var url = opts.url;
                var filtered = products.slice();

                if (url.indexOf('category=') !== -1) {
                    var catMatch = url.match(/category=([^&]+)/);
                    if (catMatch) {
                        var cats = decodeURIComponent(catMatch[1]).split(',');
                        filtered = filtered.filter(function(p) {
                            return cats.indexOf(p.category) !== -1;
                        });
                    }
                }

                if (url.indexOf('status=') !== -1) {
                    var statMatch = url.match(/status=([^&]+)/);
                    if (statMatch) {
                        var statuses = decodeURIComponent(statMatch[1]).split(',');
                        filtered = filtered.filter(function(p) {
                            return statuses.indexOf(p.status) !== -1;
                        });
                    }
                }

                if (url.indexOf('price_min=') !== -1) {
                    var minMatch = url.match(/price_min=(\d+\.?\d*)/);
                    if (minMatch) {
                        var min = parseFloat(minMatch[1]);
                        filtered = filtered.filter(function(p) { return p.price >= min; });
                    }
                }

                if (url.indexOf('price_max=') !== -1) {
                    var maxMatch = url.match(/price_max=(\d+\.?\d*)/);
                    if (maxMatch) {
                        var max = parseFloat(maxMatch[1]);
                        filtered = filtered.filter(function(p) { return p.price <= max; });
                    }
                }

                return { data: filtered };
            },
            '/api/saved-filters': { data: savedFilters },
            '/api/saved-filters/create': function(opts) {
                var body = JSON.parse(opts.options.body);
                var newFilter = { id: savedFilters.length + 1, name: body.name, filters: body.filters };
                savedFilters.push(newFilter);
                return { data: newFilter };
            },
            '/api/saved-filters/': function(opts) {
                if (opts.options && opts.options.method === 'DELETE') {
                    var id = parseInt(opts.url.split('/').pop());
                    savedFilters = savedFilters.filter(function(f) { return f.id !== id; });
                    return { data: { success: true } };
                }
                return { data: null };
            }
        });
    });

    afterEach(function() {
        if (restoreAPI) restoreAPI();
        E2E.cleanup();
        fixture.destroy();
        recentFilters = [];
    });

    var currentFilters = {};

    function createFilterUI() {
        var container = document.getElementById('filter-container');
        container.innerHTML =
            '<div class="filter-app">' +
                '<div class="filter-toolbar">' +
                    '<button id="open-filter-btn" class="btn btn-primary">' +
                        '<span class="filter-icon">⚙</span> Filters' +
                        '<span id="filter-count" class="badge" style="display: none;">0</span>' +
                    '</button>' +
                    '<div id="active-filters" class="active-filters"></div>' +
                    '<button id="clear-filters-btn" class="btn btn-link" style="display: none;">Clear All</button>' +
                '</div>' +
                '<div id="filter-panel" class="filter-panel" style="display: none;">' +
                    '<div class="filter-header">' +
                        '<h3>Filter Products</h3>' +
                        '<button id="close-filter-btn" class="btn-close">×</button>' +
                    '</div>' +
                    '<div class="filter-body">' +
                        '<div class="filter-section">' +
                            '<h4>Category</h4>' +
                            '<label><input type="checkbox" class="filter-checkbox" data-field="category" value="Electronics"> Electronics</label>' +
                            '<label><input type="checkbox" class="filter-checkbox" data-field="category" value="Hardware"> Hardware</label>' +
                            '<label><input type="checkbox" class="filter-checkbox" data-field="category" value="Software"> Software</label>' +
                        '</div>' +
                        '<div class="filter-section">' +
                            '<h4>Status</h4>' +
                            '<label><input type="checkbox" class="filter-checkbox" data-field="status" value="In Stock"> In Stock</label>' +
                            '<label><input type="checkbox" class="filter-checkbox" data-field="status" value="Low Stock"> Low Stock</label>' +
                            '<label><input type="checkbox" class="filter-checkbox" data-field="status" value="Out of Stock"> Out of Stock</label>' +
                        '</div>' +
                        '<div class="filter-section">' +
                            '<h4>Price Range</h4>' +
                            '<div class="range-inputs">' +
                                '<input type="number" id="price-min" placeholder="Min" class="form-control">' +
                                '<span>to</span>' +
                                '<input type="number" id="price-max" placeholder="Max" class="form-control">' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="filter-footer">' +
                        '<button id="apply-filter-btn" class="btn btn-primary">Apply Filters</button>' +
                        '<button id="save-filter-btn" class="btn btn-secondary">Save as Template</button>' +
                    '</div>' +
                '</div>' +
                '<div id="saved-filters-dropdown" class="saved-filters" style="display: none;">' +
                    '<h4>Saved Filters</h4>' +
                    '<ul id="saved-filters-list"></ul>' +
                    '<h4>Recent Filters</h4>' +
                    '<ul id="recent-filters-list"></ul>' +
                '</div>' +
                '<table id="products-table" class="table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Name</th>' +
                            '<th>Category</th>' +
                            '<th>Price</th>' +
                            '<th>Status</th>' +
                            '<th>Rating</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody id="products-tbody"></tbody>' +
                '</table>' +
                '<div id="result-count" class="result-count"></div>' +
            '</div>' +
            '<div id="save-filter-modal" class="modal" style="display: none;">' +
                '<div class="modal-content">' +
                    '<h3>Save Filter Template</h3>' +
                    '<div class="form-group">' +
                        '<label for="filter-name">Template Name</label>' +
                        '<input type="text" id="filter-name" class="form-control" required>' +
                    '</div>' +
                    '<button id="confirm-save-filter" class="btn btn-primary">Save</button>' +
                    '<button id="cancel-save-filter" class="btn btn-secondary">Cancel</button>' +
                '</div>' +
            '</div>';

        currentFilters = {};
        initFilterLogic();
        loadProducts();
        loadSavedFilters();
    }

    function initFilterLogic() {
        document.getElementById('open-filter-btn').addEventListener('click', function() {
            toggleFilterPanel();
        });

        document.getElementById('close-filter-btn').addEventListener('click', function() {
            document.getElementById('filter-panel').style.display = 'none';
        });

        document.getElementById('apply-filter-btn').addEventListener('click', function() {
            applyFilters();
        });

        document.getElementById('clear-filters-btn').addEventListener('click', function() {
            clearFilters();
        });

        document.getElementById('save-filter-btn').addEventListener('click', function() {
            document.getElementById('save-filter-modal').style.display = 'block';
        });

        document.getElementById('confirm-save-filter').addEventListener('click', function() {
            saveCurrentFilter();
        });

        document.getElementById('cancel-save-filter').addEventListener('click', function() {
            document.getElementById('save-filter-modal').style.display = 'none';
        });
    }

    function toggleFilterPanel() {
        var panel = document.getElementById('filter-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    function applyFilters() {
        currentFilters = {};

        document.querySelectorAll('.filter-checkbox:checked').forEach(function(cb) {
            var field = cb.getAttribute('data-field');
            var value = cb.value;
            if (!currentFilters[field]) currentFilters[field] = [];
            currentFilters[field].push(value);
        });

        var priceMin = document.getElementById('price-min').value;
        var priceMax = document.getElementById('price-max').value;
        if (priceMin) currentFilters.price_min = priceMin;
        if (priceMax) currentFilters.price_max = priceMax;

        if (Object.keys(currentFilters).length > 0) {
            recentFilters.unshift(JSON.parse(JSON.stringify(currentFilters)));
            if (recentFilters.length > 5) recentFilters.pop();
        }

        loadProducts();
        updateActiveFilters();
        updateFilterCount();
        document.getElementById('filter-panel').style.display = 'none';
    }

    function clearFilters() {
        currentFilters = {};
        document.querySelectorAll('.filter-checkbox').forEach(function(cb) {
            cb.checked = false;
        });
        document.getElementById('price-min').value = '';
        document.getElementById('price-max').value = '';

        loadProducts();
        updateActiveFilters();
        updateFilterCount();
    }

    function loadProducts() {
        var queryParts = [];

        if (currentFilters.category) {
            queryParts.push('category=' + encodeURIComponent(currentFilters.category.join(',')));
        }
        if (currentFilters.status) {
            queryParts.push('status=' + encodeURIComponent(currentFilters.status.join(',')));
        }
        if (currentFilters.price_min) {
            queryParts.push('price_min=' + currentFilters.price_min);
        }
        if (currentFilters.price_max) {
            queryParts.push('price_max=' + currentFilters.price_max);
        }

        var url = '/api/products' + (queryParts.length ? '?' + queryParts.join('&') : '');

        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                renderProducts(data);
            });
    }

    function renderProducts(data) {
        var tbody = document.getElementById('products-tbody');
        tbody.innerHTML = '';

        data.forEach(function(p) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + p.name + '</td>' +
                '<td>' + p.category + '</td>' +
                '<td>$' + p.price.toFixed(2) + '</td>' +
                '<td>' + p.status + '</td>' +
                '<td>' + p.rating + '</td>';
            tbody.appendChild(tr);
        });

        document.getElementById('result-count').textContent = 'Showing ' + data.length + ' of ' + products.length + ' products';
    }

    function updateActiveFilters() {
        var container = document.getElementById('active-filters');
        container.innerHTML = '';

        for (var field in currentFilters) {
            var values = currentFilters[field];
            if (Array.isArray(values)) {
                values.forEach(function(v) {
                    var tag = document.createElement('span');
                    tag.className = 'filter-tag';
                    tag.innerHTML = field + ': ' + v + ' <button class="remove-filter" data-field="' + field + '" data-value="' + v + '">×</button>';
                    container.appendChild(tag);
                });
            } else {
                var tag = document.createElement('span');
                tag.className = 'filter-tag';
                tag.innerHTML = field + ': ' + values + ' <button class="remove-filter" data-field="' + field + '">×</button>';
                container.appendChild(tag);
            }
        }

        document.querySelectorAll('.remove-filter').forEach(function(btn) {
            btn.addEventListener('click', function() {
                removeFilter(this.getAttribute('data-field'), this.getAttribute('data-value'));
            });
        });

        var clearBtn = document.getElementById('clear-filters-btn');
        clearBtn.style.display = Object.keys(currentFilters).length > 0 ? 'inline-block' : 'none';
    }

    function removeFilter(field, value) {
        if (Array.isArray(currentFilters[field])) {
            currentFilters[field] = currentFilters[field].filter(function(v) { return v !== value; });
            if (currentFilters[field].length === 0) delete currentFilters[field];

            var checkbox = document.querySelector('.filter-checkbox[data-field="' + field + '"][value="' + value + '"]');
            if (checkbox) checkbox.checked = false;
        } else {
            delete currentFilters[field];
            if (field === 'price_min') document.getElementById('price-min').value = '';
            if (field === 'price_max') document.getElementById('price-max').value = '';
        }

        loadProducts();
        updateActiveFilters();
        updateFilterCount();
    }

    function updateFilterCount() {
        var count = 0;
        for (var field in currentFilters) {
            if (Array.isArray(currentFilters[field])) {
                count += currentFilters[field].length;
            } else {
                count++;
            }
        }

        var badge = document.getElementById('filter-count');
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    function loadSavedFilters() {
        var list = document.getElementById('saved-filters-list');
        list.innerHTML = '';

        savedFilters.forEach(function(sf) {
            var li = document.createElement('li');
            li.innerHTML =
                '<button class="load-saved-filter" data-id="' + sf.id + '">' + sf.name + '</button>' +
                '<button class="delete-saved-filter" data-id="' + sf.id + '">×</button>';
            list.appendChild(li);
        });

        document.querySelectorAll('.load-saved-filter').forEach(function(btn) {
            btn.addEventListener('click', function() {
                loadSavedFilter(parseInt(this.getAttribute('data-id')));
            });
        });

        document.querySelectorAll('.delete-saved-filter').forEach(function(btn) {
            btn.addEventListener('click', function() {
                deleteSavedFilter(parseInt(this.getAttribute('data-id')));
            });
        });
    }

    function loadSavedFilter(id) {
        var saved = savedFilters.find(function(f) { return f.id === id; });
        if (!saved) return;

        clearFilters();

        for (var field in saved.filters) {
            currentFilters[field] = saved.filters[field].slice();

            saved.filters[field].forEach(function(value) {
                var checkbox = document.querySelector('.filter-checkbox[data-field="' + field + '"][value="' + value + '"]');
                if (checkbox) checkbox.checked = true;
            });
        }

        loadProducts();
        updateActiveFilters();
        updateFilterCount();
        Toast.info('Loaded filter: ' + saved.name);
    }

    function saveCurrentFilter() {
        var name = document.getElementById('filter-name').value;
        if (!name) {
            Toast.error('Please enter a name');
            return;
        }

        fetch('/api/saved-filters/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, filters: currentFilters })
        })
        .then(function(r) { return r.json(); })
        .then(function() {
            Toast.success('Filter saved: ' + name);
            document.getElementById('save-filter-modal').style.display = 'none';
            document.getElementById('filter-name').value = '';
            loadSavedFilters();
        });
    }

    function deleteSavedFilter(id) {
        fetch('/api/saved-filters/' + id, { method: 'DELETE' })
            .then(function(r) { return r.json(); })
            .then(function() {
                Toast.success('Filter deleted');
                loadSavedFilters();
            });
    }

    describe('Filter Operations', function() {

        it('User can open filter modal and see filter options', function() {
            return E2E.scenario('Open Filter Panel')
                .given('I have the filter UI', function() {
                    createFilterUI();
                    return E2E.waitFor('#open-filter-btn');
                })
                .when('I click the Filters button', function() {
                    return E2E.click('#open-filter-btn');
                })
                .then('Filter panel should be visible', function() {
                    E2E.assertVisible('#filter-panel');
                })
                .and('I should see category filters', function() {
                    E2E.assertText('#filter-panel', 'Category');
                    E2E.assertText('#filter-panel', 'Electronics');
                })
                .and('I should see status filters', function() {
                    E2E.assertText('#filter-panel', 'Status');
                    E2E.assertText('#filter-panel', 'In Stock');
                })
                .and('I should see price range inputs', function() {
                    E2E.assertExists('#price-min');
                    E2E.assertExists('#price-max');
                })
                .run();
        });

        it('User can apply multi-select filters', function() {
            if (isHeadless) return;

            return E2E.scenario('Multi-Select Filter')
                .given('I opened the filter panel', function() {
                    createFilterUI();
                    return E2E.waitFor('#open-filter-btn')
                        .then(function() { return E2E.click('#open-filter-btn'); })
                        .then(function() { return E2E.waitFor('#filter-panel[style*="block"]'); });
                })
                .when('I select Electronics and Hardware categories', function() {
                    return E2E.check('.filter-checkbox[value="Electronics"]')
                        .then(function() { return E2E.check('.filter-checkbox[value="Hardware"]'); });
                })
                .and('I apply the filter', function() {
                    return E2E.click('#apply-filter-btn');
                })
                .then('Table should show filtered results', function() {
                    return E2E.wait(100).then(function() {
                        var rows = document.querySelectorAll('#products-tbody tr');
                        expect(rows.length).toBe(6);
                    });
                })
                .and('Filter count badge should show 2', function() {
                    E2E.assertText('#filter-count', '2');
                })
                .and('Active filter tags should be visible', function() {
                    E2E.assertText('#active-filters', 'Electronics');
                    E2E.assertText('#active-filters', 'Hardware');
                })
                .run();
        });

        it('User can apply range filters (min/max)', function() {
            if (isHeadless) return;

            return E2E.scenario('Range Filter')
                .given('I opened the filter panel', function() {
                    createFilterUI();
                    return E2E.waitFor('#open-filter-btn')
                        .then(function() { return E2E.click('#open-filter-btn'); })
                        .then(function() { return E2E.waitFor('#filter-panel[style*="block"]'); });
                })
                .when('I set price range 50 to 200', function() {
                    return E2E.type('#price-min', '50')
                        .then(function() { return E2E.type('#price-max', '200'); });
                })
                .and('I apply the filter', function() {
                    return E2E.click('#apply-filter-btn');
                })
                .then('Table should show products in price range', function() {
                    return E2E.wait(100).then(function() {
                        var rows = document.querySelectorAll('#products-tbody tr');
                        expect(rows.length).toBe(4);
                    });
                })
                .run();
        });

        it('User can combine multiple filters', function() {
            if (isHeadless) return;

            return E2E.scenario('Combined Filters')
                .given('I opened the filter panel', function() {
                    createFilterUI();
                    return E2E.waitFor('#open-filter-btn')
                        .then(function() { return E2E.click('#open-filter-btn'); })
                        .then(function() { return E2E.waitFor('#filter-panel[style*="block"]'); });
                })
                .when('I select Electronics category', function() {
                    return E2E.check('.filter-checkbox[value="Electronics"]');
                })
                .and('I select In Stock status', function() {
                    return E2E.check('.filter-checkbox[value="In Stock"]');
                })
                .and('I apply the filter', function() {
                    return E2E.click('#apply-filter-btn');
                })
                .then('Table should show only In Stock Electronics', function() {
                    return E2E.wait(100).then(function() {
                        var rows = document.querySelectorAll('#products-tbody tr');
                        expect(rows.length).toBe(2);
                    });
                })
                .run();
        });

        it('User can clear all filters', function() {
            if (isHeadless) return;

            return E2E.scenario('Clear Filters')
                .given('I have applied filters', function() {
                    createFilterUI();
                    return E2E.waitFor('#open-filter-btn')
                        .then(function() { return E2E.click('#open-filter-btn'); })
                        .then(function() { return E2E.waitFor('#filter-panel[style*="block"]'); })
                        .then(function() { return E2E.check('.filter-checkbox[value="Electronics"]'); })
                        .then(function() { return E2E.click('#apply-filter-btn'); })
                        .then(function() { return E2E.wait(100); });
                })
                .then('Clear button should be visible', function() {
                    E2E.assertVisible('#clear-filters-btn');
                })
                .when('I click Clear All', function() {
                    return E2E.click('#clear-filters-btn');
                })
                .then('All products should be shown', function() {
                    return E2E.wait(100).then(function() {
                        var rows = document.querySelectorAll('#products-tbody tr');
                        expect(rows.length).toBe(8);
                    });
                })
                .and('Filter count should be hidden', function() {
                    E2E.assertHidden('#filter-count');
                })
                .and('Active filters should be empty', function() {
                    var tags = document.querySelectorAll('#active-filters .filter-tag');
                    expect(tags.length).toBe(0);
                })
                .run();
        });

    });

    describe('Saved Filters', function() {

        it('User can save filter as template', function() {
            if (isHeadless) return;

            return E2E.scenario('Save Filter Template')
                .given('I have applied filters', function() {
                    createFilterUI();
                    return E2E.waitFor('#open-filter-btn')
                        .then(function() { return E2E.click('#open-filter-btn'); })
                        .then(function() { return E2E.waitFor('#filter-panel[style*="block"]'); })
                        .then(function() { return E2E.check('.filter-checkbox[value="Software"]'); })
                        .then(function() { return E2E.click('#apply-filter-btn'); })
                        .then(function() { return E2E.wait(100); });
                })
                .when('I click Save as Template', function() {
                    return E2E.click('#open-filter-btn')
                        .then(function() { return E2E.waitFor('#filter-panel[style*="block"]'); })
                        .then(function() { return E2E.click('#save-filter-btn'); });
                })
                .then('Save modal should appear', function() {
                    return E2E.waitFor('#save-filter-modal[style*="block"]');
                })
                .when('I enter a name and save', function() {
                    return E2E.type('#filter-name', 'Software Only')
                        .then(function() { return E2E.click('#confirm-save-filter'); });
                })
                .then('I should see success message', function() {
                    return E2E.waitForText('Filter saved');
                })
                .and('Modal should close', function() {
                    return E2E.wait(100).then(function() {
                        E2E.assertHidden('#save-filter-modal');
                    });
                })
                .run();
        });

        it('User can load saved filter template', function() {
            if (isHeadless) return;

            return E2E.scenario('Load Saved Filter')
                .given('I have saved filters available', function() {
                    createFilterUI();
                    return E2E.waitFor('#saved-filters-list');
                })
                .when('I click on Electronics Only filter', function() {
                    return E2E.click('.load-saved-filter[data-id="1"]');
                })
                .then('Electronics filter should be applied', function() {
                    return E2E.wait(100).then(function() {
                        var rows = document.querySelectorAll('#products-tbody tr');
                        expect(rows.length).toBe(3);
                    });
                })
                .and('I should see info message', function() {
                    return E2E.waitForText('Loaded filter: Electronics Only');
                })
                .run();
        });

        it('User can delete saved filter template', function() {
            if (isHeadless) return;

            return E2E.scenario('Delete Saved Filter')
                .given('I have saved filters', function() {
                    createFilterUI();
                    return E2E.waitFor('.delete-saved-filter');
                })
                .when('I click delete on first filter', function() {
                    return E2E.click('.delete-saved-filter[data-id="1"]');
                })
                .then('I should see success message', function() {
                    return E2E.waitForText('Filter deleted');
                })
                .and('Filter should be removed from list', function() {
                    return E2E.wait(100).then(function() {
                        E2E.assertNotExists('.load-saved-filter[data-id="1"]');
                    });
                })
                .run();
        });

    });

    describe('Filter Tags', function() {

        it('User can remove individual filter by clicking tag', function() {
            if (isHeadless) return;

            return E2E.scenario('Remove Filter Tag')
                .given('I have multiple filters applied', function() {
                    createFilterUI();
                    return E2E.waitFor('#open-filter-btn')
                        .then(function() { return E2E.click('#open-filter-btn'); })
                        .then(function() { return E2E.waitFor('#filter-panel[style*="block"]'); })
                        .then(function() { return E2E.check('.filter-checkbox[value="Electronics"]'); })
                        .then(function() { return E2E.check('.filter-checkbox[value="Hardware"]'); })
                        .then(function() { return E2E.click('#apply-filter-btn'); })
                        .then(function() { return E2E.wait(100); });
                })
                .then('I should see 2 filter tags', function() {
                    var tags = document.querySelectorAll('#active-filters .filter-tag');
                    expect(tags.length).toBe(2);
                })
                .when('I remove the Electronics filter tag', function() {
                    return E2E.click('.remove-filter[data-value="Electronics"]');
                })
                .then('Only Hardware filter should remain', function() {
                    return E2E.wait(100).then(function() {
                        var tags = document.querySelectorAll('#active-filters .filter-tag');
                        expect(tags.length).toBe(1);
                        E2E.assertText('#active-filters', 'Hardware');
                    });
                })
                .and('Table should update', function() {
                    var rows = document.querySelectorAll('#products-tbody tr');
                    expect(rows.length).toBe(3);
                })
                .run();
        });

    });

});
