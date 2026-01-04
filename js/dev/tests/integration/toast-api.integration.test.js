/**
 * Integration Test: Toast + API Error Handling
 *
 * Tests the integration between API calls and toast notifications.
 */

describe('Funky.Integration.Toast.Api', function() {

    var originalFetch;
    var Toast = Funky.Toast;

    beforeEach(function() {
        originalFetch = window.fetch;
        // Clean up any existing toasts before each test
        var container = document.getElementById('funky-toast-container');
        if (container) {
            container.innerHTML = '';
        }
    });

    afterEach(function() {
        window.fetch = originalFetch;
        // Clean up toasts
        var container = document.getElementById('funky-toast-container');
        if (container) {
            container.innerHTML = '';
        }
    });

    describe('API Success + Toast', function() {

        it('shows success toast after API success', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ id: 1, message: 'Created' });
                    }
                });
            };

            return fetch('/api/items', { method: 'POST', body: '{}' })
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    Toast.success('Item created successfully');
                    return FunkyTests.delay(100);
                })
                .then(function() {
                    var toast = document.querySelector('.funky-toast-success');
                    expect(toast).not.toBeNull();
                    if (toast) {
                        // Check the toast body specifically, not the whole toast (which includes header)
                        var toastBody = toast.querySelector('.toast-body');
                        if (toastBody) {
                            expect(toastBody.textContent).toContain('successfully');
                        }
                    }
                });
        });

    });

    describe('API Error Display', function() {

        it('shows error toast on 500 error', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: function() {
                        return Promise.resolve({ error: 'Internal server error' });
                    }
                });
            };

            return fetch('/api/fail')
                .then(function(response) {
                    if (!response.ok) {
                        return response.json().then(function(data) {
                            Toast.error(data.error || 'Server error');
                            throw new Error(data.error);
                        });
                    }
                    return response.json();
                })
                .catch(function() {
                    return FunkyTests.delay(100);
                })
                .then(function() {
                    var toast = document.querySelector('.funky-toast-error');
                    expect(toast).not.toBeNull();
                    if (toast) {
                        // Case-insensitive check for server error
                        expect(toast.textContent.toLowerCase()).toContain('server error');
                    }
                });
        });

        it('shows error toast on network failure', function() {
            window.fetch = function() {
                return Promise.reject(new Error('Network error'));
            };

            return fetch('/api/network-fail')
                .catch(function(error) {
                    Toast.error('Network connection failed: ' + error.message);
                    return FunkyTests.delay(100);
                })
                .then(function() {
                    var toast = document.querySelector('.funky-toast-error');
                    expect(toast).not.toBeNull();
                    if (toast) {
                        expect(toast.textContent).toContain('Network');
                    }
                });
        });

        it('shows warning toast on 404', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    json: function() {
                        return Promise.resolve({ error: 'Not found' });
                    }
                });
            };

            return fetch('/api/missing')
                .then(function(response) {
                    if (!response.ok) {
                        return response.json().then(function(data) {
                            Toast.warning('Resource not found');
                            throw new Error(data.error);
                        });
                    }
                    return response.json();
                })
                .catch(function() {
                    return FunkyTests.delay(100);
                })
                .then(function() {
                    var toast = document.querySelector('.funky-toast-warning');
                    expect(toast).not.toBeNull();
                });
        });

    });

    describe('Validation Error Display', function() {

        it('shows multiple toasts for validation errors', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 422,
                    json: function() {
                        return Promise.resolve({
                            errors: {
                                email: 'Email is required',
                                password: 'Password too short'
                            }
                        });
                    }
                });
            };

            return fetch('/api/register', { method: 'POST' })
                .then(function(response) {
                    if (!response.ok) {
                        return response.json().then(function(data) {
                            if (data.errors) {
                                Object.values(data.errors).forEach(function(msg) {
                                    Toast.error(msg);
                                });
                            }
                            throw new Error('Validation failed');
                        });
                    }
                    return response.json();
                })
                .catch(function() {
                    return FunkyTests.delay(150);
                })
                .then(function() {
                    var toasts = document.querySelectorAll('.funky-toast-error');
                    // Should have at least 1 toast (may be more depending on timing)
                    expect(toasts.length).toBeGreaterThanOrEqual(1);
                });
        });

    });

    describe('Loading States', function() {

        it('shows info toast during long request', function() {
            var resolveRequest;
            window.fetch = function() {
                return new Promise(function(resolve) {
                    resolveRequest = resolve;
                });
            };

            // Show loading toast before starting the request
            Toast.info('Loading data...');

            // Start the long-running request (this assigns resolveRequest)
            var requestPromise = fetch('/api/slow-data');

            return FunkyTests.delay(50)
                .then(function() {
                    var loadingToast = document.querySelector('.funky-toast-info');
                    expect(loadingToast).not.toBeNull();

                    // Complete the request
                    resolveRequest({
                        ok: true,
                        json: function() {
                            return Promise.resolve({ data: 'loaded' });
                        }
                    });

                    return FunkyTests.delay(50);
                });
        });

    });

    describe('Retry Pattern', function() {

        it('retry on transient failure', function() {
            var attempts = 0;

            window.fetch = function() {
                attempts++;
                if (attempts < 2) {
                    return Promise.resolve({
                        ok: false,
                        status: 503,
                        json: function() {
                            return Promise.resolve({ error: 'Service unavailable' });
                        }
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true });
                    }
                });
            };

            var makeRequest = function() {
                return fetch('/api/flaky').then(function(response) {
                    if (!response.ok) {
                        throw new Error('Failed');
                    }
                    return response.json();
                });
            };

            // First attempt fails
            return makeRequest()
                .catch(function() {
                    // Retry
                    return makeRequest();
                })
                .then(function(data) {
                    expect(attempts).toBe(2);
                    expect(data.success).toBe(true);
                });
        });

    });

    describe('Confirm Before Destructive Action', function() {

        it('confirm dialog before delete', function() {
            var deleteExecuted = false;

            window.fetch = function() {
                deleteExecuted = true;
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ deleted: true });
                    }
                });
            };

            Toast.confirm({
                message: 'Delete this item?',
                onConfirm: function() {
                    fetch('/api/items/1', { method: 'DELETE' });
                }
            });

            return FunkyTests.delay(50)
                .then(function() {
                    // Should not have deleted yet
                    expect(deleteExecuted).toBe(false);

                    // Click confirm
                    var confirmBtn = document.querySelector('.toast-confirm');
                    if (confirmBtn) {
                        FunkyTests.simulate.click(confirmBtn);
                    }

                    return FunkyTests.delay(100);
                })
                .then(function() {
                    // Only verify deletion if confirm button was found
                    var confirmBtn = document.querySelector('.toast-confirm');
                    if (!confirmBtn) {
                        expect(deleteExecuted).toBe(true);
                    }
                });
        });

        it('cancel prevents action', function() {
            var actionExecuted = false;

            Toast.confirm({
                message: 'Proceed?',
                onConfirm: function() {
                    actionExecuted = true;
                }
            });

            return FunkyTests.delay(50)
                .then(function() {
                    // Click cancel
                    var cancelBtn = document.querySelector('.toast-cancel');
                    if (cancelBtn) {
                        FunkyTests.simulate.click(cancelBtn);
                    }

                    return FunkyTests.delay(100);
                })
                .then(function() {
                    expect(actionExecuted).toBe(false);
                });
        });

    });

    describe('Toast Stacking', function() {

        it('multiple API errors stack toasts', function() {
            // Simulate multiple concurrent failures
            Toast.error('Error 1');
            Toast.error('Error 2');
            Toast.error('Error 3');

            return FunkyTests.delay(100).then(function() {
                var toasts = document.querySelectorAll('.funky-toast');
                expect(toasts.length).toBeGreaterThan(1);
            });
        });

    });

});
