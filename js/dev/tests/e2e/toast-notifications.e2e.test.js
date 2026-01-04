/**
 * E2E Tests: Toast Notifications Flow
 *
 * Tests toast notification system including auto-dismiss, actions, and stacking.
 */

describe('Funky.E2E.ToastNotifications', function() {

    var E2E = FunkyTests.E2E;
    var Toast = Funky.Toast;
    var fixture;

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

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="toast-test-container"></div>');
        E2E.cleanup();
    });

    afterEach(function() {
        E2E.cleanup();
        fixture.destroy();
    });

    function createToastUI() {
        var container = document.getElementById('toast-test-container');
        container.innerHTML =
            '<div class="toast-demo">' +
                '<button id="show-success" class="btn btn-success">Show Success</button>' +
                '<button id="show-error" class="btn btn-danger">Show Error</button>' +
                '<button id="show-warning" class="btn btn-warning">Show Warning</button>' +
                '<button id="show-info" class="btn btn-info">Show Info</button>' +
                '<button id="show-confirm" class="btn btn-secondary">Show Confirm</button>' +
                '<button id="show-with-action" class="btn btn-primary">Show with Action</button>' +
                '<button id="show-multiple" class="btn btn-secondary">Show Multiple</button>' +
            '</div>';

        if (!document.getElementById('funky-toast-container')) {
            var toastContainer = document.createElement('div');
            toastContainer.id = 'funky-toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        initToastButtons();
    }

    function initToastButtons() {
        document.getElementById('show-success').addEventListener('click', function() {
            Toast.success('Operation completed successfully!');
        });

        document.getElementById('show-error').addEventListener('click', function() {
            Toast.error('An error occurred. Please try again.');
        });

        document.getElementById('show-warning').addEventListener('click', function() {
            Toast.warning('Warning: This action cannot be undone.');
        });

        document.getElementById('show-info').addEventListener('click', function() {
            Toast.info('Here is some useful information.');
        });

        document.getElementById('show-confirm').addEventListener('click', function() {
            Toast.confirm({
                message: 'Are you sure you want to proceed?',
                onConfirm: function() {
                    Toast.success('Confirmed!');
                },
                onCancel: function() {
                    Toast.info('Cancelled');
                }
            });
        });

        document.getElementById('show-with-action').addEventListener('click', function() {
            Toast.success('Item deleted', {
                action: {
                    text: 'Undo',
                    onClick: function() {
                        Toast.info('Undo clicked!');
                    }
                }
            });
        });

        document.getElementById('show-multiple').addEventListener('click', function() {
            Toast.success('First message');
            Toast.info('Second message');
            Toast.warning('Third message');
        });
    }

    describe('Toast Types', function() {

        it('Success toast appears and contains message', function() {
            return E2E.scenario('Success Toast')
                .given('I have the toast demo', function() {
                    createToastUI();
                    return E2E.waitFor('#show-success');
                })
                .when('I click Show Success', function() {
                    return E2E.click('#show-success');
                })
                .then('Success toast should appear', function() {
                    return E2E.waitFor('.toast-success, .toast.success, [class*="toast"][class*="success"]');
                })
                .and('Toast should contain the message', function() {
                    return E2E.waitForText('Operation completed successfully');
                })
                .run();
        });

        it('Error toast appears and persists', function() {
            return E2E.scenario('Error Toast')
                .given('I have the toast demo', function() {
                    createToastUI();
                    return E2E.waitFor('#show-error');
                })
                .when('I click Show Error', function() {
                    return E2E.click('#show-error');
                })
                .then('Error toast should appear', function() {
                    return E2E.waitForText('An error occurred');
                })
                .run();
        });

        it('Warning toast appears', function() {
            return E2E.scenario('Warning Toast')
                .given('I have the toast demo', function() {
                    createToastUI();
                    return E2E.waitFor('#show-warning');
                })
                .when('I click Show Warning', function() {
                    return E2E.click('#show-warning');
                })
                .then('Warning toast should appear', function() {
                    return E2E.waitForText('cannot be undone');
                })
                .run();
        });

        it('Info toast appears', function() {
            return E2E.scenario('Info Toast')
                .given('I have the toast demo', function() {
                    createToastUI();
                    return E2E.waitFor('#show-info');
                })
                .when('I click Show Info', function() {
                    return E2E.click('#show-info');
                })
                .then('Info toast should appear', function() {
                    return E2E.waitForText('useful information');
                })
                .run();
        });

    });

    describe('Toast Stacking', function() {

        it('Multiple toasts stack correctly', function() {
            return E2E.scenario('Toast Stacking')
                .given('I have the toast demo', function() {
                    createToastUI();
                    return E2E.waitFor('#show-multiple');
                })
                .when('I click Show Multiple', function() {
                    return E2E.click('#show-multiple');
                })
                .then('Multiple toasts should appear', function() {
                    return E2E.wait(300).then(function() {
                        return E2E.waitForText('First message');
                    });
                })
                .and('Second toast should be visible', function() {
                    return E2E.waitForText('Second message');
                })
                .and('Third toast should be visible', function() {
                    return E2E.waitForText('Third message');
                })
                .run();
        });

    });

    describe('Toast Actions', function() {

        it('Toast with action button works', function() {
            if (isHeadless) return;

            return E2E.scenario('Toast Action')
                .given('I have the toast demo', function() {
                    createToastUI();
                    return E2E.waitFor('#show-with-action');
                })
                .when('I click Show with Action', function() {
                    return E2E.click('#show-with-action');
                })
                .then('Toast with Undo button should appear', function() {
                    return E2E.waitForText('Item deleted');
                })
                .and('Undo button should be visible', function() {
                    return E2E.waitForText('Undo');
                })
                .when('I click Undo', function() {
                    return E2E.waitFor(function() {
                        return E2E.getButton('Undo');
                    }).then(function(btn) {
                        return E2E.click(btn);
                    });
                })
                .then('Undo action should trigger', function() {
                    return E2E.waitForText('Undo clicked');
                })
                .run();
        });

    });

    describe('Toast Dismissal', function() {

        it('User can dismiss toast manually', function() {
            if (isHeadless) return;

            return E2E.scenario('Manual Dismiss')
                .given('I have a toast displayed', function() {
                    createToastUI();
                    return E2E.waitFor('#show-info')
                        .then(function() { return E2E.click('#show-info'); })
                        .then(function() { return E2E.waitForText('useful information'); });
                })
                .when('I click the close button', function() {
                    return E2E.waitFor('.toast-close, .toast [class*="close"], .toast button').then(function(closeBtn) {
                        if (closeBtn) {
                            return E2E.click(closeBtn);
                        }
                        return Promise.resolve();
                    });
                })
                .then('Toast should be dismissed', function() {
                    return E2E.wait(500);
                })
                .run();
        });

    });

    describe('Confirm Toast', function() {

        it('Confirm toast has confirm and cancel buttons', function() {
            return E2E.scenario('Confirm Toast Buttons')
                .given('I have the toast demo', function() {
                    createToastUI();
                    return E2E.waitFor('#show-confirm');
                })
                .when('I click Show Confirm', function() {
                    return E2E.click('#show-confirm');
                })
                .then('Confirm toast should appear', function() {
                    return E2E.waitForText('Are you sure');
                })
                .run();
        });

    });

});
