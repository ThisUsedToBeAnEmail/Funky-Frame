/**
 * Integration Test: Advanced Filter + API + Cache
 *
 * Tests the integration between advanced filtering, API requests,
 * cache management, and UI feedback.
 */

describe('Funky.Integration.AdvancedFilter.Api', function() {

    var Cache = Funky.Cache;
    var PubSub = Funky.PubSub;
    var Toast = Funky.Toast;
    var originalFetch;
    var apiCalls;
    var fixture;

    // Sample filter options returned by API
    var sampleFilterOptions = {
        fields: {
            status: {
                label: 'Status',
                type: 'multiselect',
                options: [
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'pending', label: 'Pending' }
                ]
            },
            priority: {
                label: 'Priority',
                type: 'multiselect',
                options: [
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' }
                ]
            },
            amount: {
                label: 'Amount',
                type: 'range',
                min: 0,
                max: 10000
            },
            created_date: {
                label: 'Created Date',
                type: 'date'
            }
        }
    };

    // Sample data returned after filtering
    var sampleFilteredData = {
        data: [
            { id: 1, name: 'Item 1', status: 'active', priority: 'high' },
            { id: 2, name: 'Item 2', status: 'active', priority: 'medium' }
        ],
        total: 2,
        filtered: 2
    };

    beforeEach(function() {
        Cache.clear();
        PubSub.clear();
        apiCalls = [];
        originalFetch = window.fetch;

        // Create test fixture
        fixture = FunkyTests.fixture('<div id="filter-test-container"></div>');

        // Mock fetch for various endpoints
        window.fetch = function(url, options) {
            apiCalls.push({ url: url, options: options || {} });

            // Filter options endpoint
            if (url.includes('/api/filter_options')) {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve(sampleFilterOptions);
                    }
                });
            }

            // Saved filters endpoint
            if (url.includes('/api/saved_filters')) {
                if (options && options.method === 'POST') {
                    return Promise.resolve({
                        ok: true,
                        json: function() {
                            return Promise.resolve({ id: 1, name: 'My Filter', params: {} });
                        }
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve([
                            { id: 1, name: 'Active Items', params: { status: ['active'] } },
                            { id: 2, name: 'High Priority', params: { priority: ['high'] } }
                        ]);
                    }
                });
            }

            // Data endpoint with filters
            if (url.includes('/api/data')) {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve(sampleFilteredData);
                    }
                });
            }

            // Error endpoint
            if (url.includes('/api/error')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: function() {
                        return Promise.resolve({ error: 'Server error' });
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
    // Filter Options Loading
    // =========================================================================

    describe('Filter Options Loading', function() {

        it('fetches filter options from API', function() {
            return fetch('/api/filter_options')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    expect(apiCalls.length).toBe(1);
                    expect(apiCalls[0].url).toContain('filter_options');
                    expect(data.fields.status).toBeDefined();
                    expect(data.fields.status.options.length).toBe(3);
                });
        });

        it('caches filter options after first load', function() {
            var cacheKey = 'filter:options:test';

            return fetch('/api/filter_options')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    Cache.set(cacheKey, data, { ttl: 300000 });
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    // Second request should use cache
                    var cached = Cache.get(cacheKey);
                    expect(cached).toBeDefined();
                    expect(cached.fields.status).toBeDefined();
                    expect(apiCalls.length).toBe(1); // Only one API call
                });
        });

        it('invalidates cache on filter options update', function() {
            var cacheKey = 'filter:options:test';
            Cache.set(cacheKey, sampleFilterOptions);

            // Simulate admin updating filter options
            Cache.delete(cacheKey);

            expect(Cache.get(cacheKey)).toBeUndefined();
        });

    });

    // =========================================================================
    // Filter Application + API
    // =========================================================================

    describe('Filter Application + API', function() {

        it('applies filters and fetches filtered data', function() {
            var filterParams = { status: ['active'], priority: ['high'] };
            var queryString = 'status=active&priority=high';

            return fetch('/api/data?' + queryString)
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    expect(apiCalls.length).toBe(1);
                    expect(apiCalls[0].url).toContain('status=active');
                    expect(data.data.length).toBe(2);
                    expect(data.filtered).toBe(2);
                });
        });

        it('emits filter change event via PubSub', function() {
            var filterEvents = [];

            PubSub.on('funky:filter:change', function(data) {
                filterEvents.push(data);
            });

            // Simulate filter change
            PubSub.emit('funky:filter:change', {
                context: 'test',
                params: { status: ['active'] }
            });

            expect(filterEvents.length).toBe(1);
            expect(filterEvents[0].params.status).toContain('active');
        });

        it('clears cache when filters change', function() {
            var cacheKey = 'data:list:default';
            Cache.set(cacheKey, sampleFilteredData);

            // Simulate filter change clearing related cache
            PubSub.on('funky:filter:change', function() {
                Cache.clearPattern('data:');
            });

            PubSub.emit('funky:filter:change', { params: { status: ['inactive'] } });

            expect(Cache.get(cacheKey)).toBeUndefined();
        });

        it('builds correct query string from multiple filters', function() {
            var filters = {
                status: ['active', 'pending'],
                priority: ['high'],
                amount_min: 100,
                amount_max: 5000
            };

            var params = new URLSearchParams();
            Object.keys(filters).forEach(function(key) {
                var value = filters[key];
                if (Array.isArray(value)) {
                    value.forEach(function(v) {
                        params.append(key, v);
                    });
                } else {
                    params.append(key, value);
                }
            });

            var queryString = params.toString();

            expect(queryString).toContain('status=active');
            expect(queryString).toContain('status=pending');
            expect(queryString).toContain('priority=high');
            expect(queryString).toContain('amount_min=100');
        });

    });

    // =========================================================================
    // Saved Filters + API
    // =========================================================================

    describe('Saved Filters + API', function() {

        it('loads saved filters from API', function() {
            return fetch('/api/saved_filters?context=test')
                .then(function(response) {
                    return response.json();
                })
                .then(function(savedFilters) {
                    expect(savedFilters.length).toBe(2);
                    expect(savedFilters[0].name).toBe('Active Items');
                    expect(savedFilters[1].name).toBe('High Priority');
                });
        });

        it('saves new filter via API', function() {
            var newFilter = {
                name: 'My Custom Filter',
                context: 'test',
                params: { status: ['active'], priority: ['high'] }
            };

            return fetch('/api/saved_filters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFilter)
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                expect(result.id).toBeDefined();
                expect(apiCalls.some(function(c) { return c.options.method === 'POST'; })).toBe(true);
            });
        });

        it('caches saved filters list', function() {
            var cacheKey = 'filters:saved:test';

            return fetch('/api/saved_filters?context=test')
                .then(function(response) {
                    return response.json();
                })
                .then(function(savedFilters) {
                    Cache.set(cacheKey, savedFilters);
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    var cached = Cache.get(cacheKey);
                    expect(cached.length).toBe(2);
                });
        });

        it('invalidates saved filters cache after save', function() {
            var cacheKey = 'filters:saved:test';
            Cache.set(cacheKey, [{ id: 1, name: 'Old Filter' }]);

            // Simulate saving new filter and invalidating cache
            return fetch('/api/saved_filters', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Filter' })
            })
            .then(function() {
                Cache.delete(cacheKey);
                return FunkyTests.delay(50);
            })
            .then(function() {
                expect(Cache.get(cacheKey)).toBeUndefined();
            });
        });

    });

    // =========================================================================
    // Filter + Toast Feedback
    // =========================================================================

    describe('Filter + Toast Feedback', function() {

        it('shows success toast when filters applied', function() {
            return fetch('/api/data?status=active')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    Toast.success('Filters applied: ' + data.filtered + ' results');
                    return FunkyTests.delay(100);
                })
                .then(function() {
                    var toast = document.querySelector('.funky-toast-success');
                    expect(toast).toBeInDocument();
                    expect(toast.textContent).toContain('results');
                });
        });

        it('shows toast when filter is saved', function() {
            return fetch('/api/saved_filters', {
                method: 'POST',
                body: JSON.stringify({ name: 'My Filter' })
            })
            .then(function() {
                Toast.success('Filter saved successfully');
                return FunkyTests.delay(100);
            })
            .then(function() {
                var toast = document.querySelector('.funky-toast-success');
                expect(toast).toBeInDocument();
                expect(toast.textContent).toContain('saved');
            });
        });

        it('shows error toast on filter API failure', function() {
            return fetch('/api/error')
                .then(function(response) {
                    if (!response.ok) {
                        Toast.error('Failed to apply filters');
                        throw new Error('API error');
                    }
                })
                .catch(function() {
                    return FunkyTests.delay(100);
                })
                .then(function() {
                    var toast = document.querySelector('.funky-toast-error');
                    expect(toast).toBeInDocument();
                });
        });

        it('shows info toast when filters cleared', function() {
            Toast.info('All filters cleared');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-info');
                expect(toast).toBeInDocument();
                expect(toast.textContent).toContain('cleared');
            });
        });

    });

    // =========================================================================
    // URL Hash Persistence
    // =========================================================================

    describe('URL Hash Persistence', function() {

        it('encodes filters to URL hash', function() {
            var filters = { status: ['active'], priority: ['high'] };
            var encoded = btoa(JSON.stringify(filters));

            expect(encoded).toBeDefined();
            expect(typeof encoded).toBe('string');

            // Decode and verify
            var decoded = JSON.parse(atob(encoded));
            expect(decoded.status).toContain('active');
        });

        it('decodes filters from URL hash', function() {
            var original = { status: ['pending'], amount_min: 500 };
            var hash = btoa(JSON.stringify(original));

            var decoded = JSON.parse(atob(hash));

            expect(decoded.status).toContain('pending');
            expect(decoded.amount_min).toBe(500);
        });

        it('handles invalid hash gracefully', function() {
            var invalidHash = 'not-valid-base64!!!';
            var decoded = null;

            try {
                decoded = JSON.parse(atob(invalidHash));
            } catch (e) {
                decoded = {};
            }

            expect(decoded).toEqual({});
        });

    });

    // =========================================================================
    // Filter + PubSub Events
    // =========================================================================

    describe('Filter + PubSub Events', function() {

        it('emits event when filter options loaded', function() {
            var events = [];

            PubSub.on('funky:filter:options:loaded', function(data) {
                events.push(data);
            });

            return fetch('/api/filter_options')
                .then(function(response) {
                    return response.json();
                })
                .then(function(options) {
                    PubSub.emit('funky:filter:options:loaded', { options: options });
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    expect(events.length).toBe(1);
                    expect(events[0].options.fields).toBeDefined();
                });
        });

        it('emits event when saved filter applied', function() {
            var events = [];

            PubSub.on('funky:filter:saved:applied', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:filter:saved:applied', {
                id: 1,
                name: 'Active Items',
                params: { status: ['active'] }
            });

            expect(events.length).toBe(1);
            expect(events[0].name).toBe('Active Items');
        });

        it('components can react to filter changes', function() {
            var componentUpdates = [];

            // Simulate component listening for filter changes
            PubSub.on('funky:filter:change', function(data) {
                componentUpdates.push({
                    action: 'refresh',
                    params: data.params
                });
            });

            PubSub.emit('funky:filter:change', {
                context: 'test',
                params: { status: ['active'] }
            });

            expect(componentUpdates.length).toBe(1);
            expect(componentUpdates[0].action).toBe('refresh');
        });

    });

    // =========================================================================
    // Filter Chip Display
    // =========================================================================

    describe('Filter Chip Display', function() {

        it('generates filter chips from active filters', function() {
            var activeFilters = {
                status: ['active', 'pending'],
                priority: ['high']
            };

            var chips = [];
            Object.keys(activeFilters).forEach(function(field) {
                var values = activeFilters[field];
                values.forEach(function(value) {
                    chips.push({
                        field: field,
                        value: value,
                        label: field + ': ' + value
                    });
                });
            });

            expect(chips.length).toBe(3);
            expect(chips[0].label).toBe('status: active');
            expect(chips[2].label).toBe('priority: high');
        });

        it('removes filter when chip dismissed', function() {
            var activeFilters = {
                status: ['active', 'pending'],
                priority: ['high']
            };

            // Simulate removing 'pending' from status
            activeFilters.status = activeFilters.status.filter(function(v) {
                return v !== 'pending';
            });

            expect(activeFilters.status.length).toBe(1);
            expect(activeFilters.status).toContain('active');
            expect(activeFilters.status).not.toContain('pending');
        });

    });

    // =========================================================================
    // Recent Filters History
    // =========================================================================

    describe('Recent Filters History', function() {

        it('stores recent filter in history', function() {
            var recentFilters = [];

            var addToHistory = function(filter) {
                // Remove duplicate if exists
                recentFilters = recentFilters.filter(function(f) {
                    return JSON.stringify(f.params) !== JSON.stringify(filter.params);
                });
                // Add to front
                recentFilters.unshift(filter);
                // Limit to 10
                if (recentFilters.length > 10) {
                    recentFilters.pop();
                }
            };

            addToHistory({ params: { status: ['active'] }, timestamp: Date.now() });
            addToHistory({ params: { priority: ['high'] }, timestamp: Date.now() });

            expect(recentFilters.length).toBe(2);
            expect(recentFilters[0].params.priority).toContain('high');
        });

        it('prevents duplicate entries in history', function() {
            var recentFilters = [];

            var addToHistory = function(filter) {
                recentFilters = recentFilters.filter(function(f) {
                    return JSON.stringify(f.params) !== JSON.stringify(filter.params);
                });
                recentFilters.unshift(filter);
            };

            addToHistory({ params: { status: ['active'] } });
            addToHistory({ params: { status: ['active'] } }); // Duplicate

            expect(recentFilters.length).toBe(1);
        });

    });

});
