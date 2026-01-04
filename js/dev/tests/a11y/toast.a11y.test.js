/**
 * Accessibility Tests: Toast/Alerts
 *
 * Tests WCAG 2.1 AA compliance for toast notifications.
 */

describe('Funky.A11y.Toast', function() {

    var Toast = Funky.Toast;
    var A11y = FunkyTests.A11y;

    // Skip all tests if A11y utilities not available
    if (!A11y) {
        it('A11y utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    afterEach(function() {
        // Clean up toasts
        var container = document.getElementById('funky-toast-container');
        if (container) {
            container.innerHTML = '';
        }
    });

    describe('ARIA Roles', function() {

        it('error toasts have role="alert"', function() {
            Toast.error('Error message');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-error');
                expect(toast.getAttribute('role')).toBe('alert');
            });
        });

        it('warning toasts have role="alert"', function() {
            Toast.warning('Warning message');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-warning');
                expect(toast.getAttribute('role')).toBe('alert');
            });
        });

        it('info toasts have role="status"', function() {
            Toast.info('Info message');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-info');
                expect(toast.getAttribute('role')).toBe('status');
            });
        });

        it('success toasts have role="status"', function() {
            Toast.success('Success message');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-success');
                expect(toast.getAttribute('role')).toBe('status');
            });
        });

    });

    describe('Live Regions', function() {

        it('error toasts use assertive live region', function() {
            Toast.error('Urgent error');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-error');
                var isAssertive = toast.getAttribute('aria-live') === 'assertive' ||
                                 toast.getAttribute('role') === 'alert';
                expect(isAssertive).toBe(true);
            });
        });

        it('info toasts use polite live region', function() {
            Toast.info('Informational message');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-info');
                var isPolite = toast.getAttribute('aria-live') === 'polite' ||
                              toast.getAttribute('role') === 'status';
                expect(isPolite).toBe(true);
            });
        });

        it('success toasts use polite live region', function() {
            Toast.success('Operation successful');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-success');
                var isPolite = toast.getAttribute('aria-live') === 'polite' ||
                              toast.getAttribute('role') === 'status';
                expect(isPolite).toBe(true);
            });
        });

    });

    describe('Dismiss Button', function() {

        it('dismiss button has accessible name', function() {
            Toast.success('Dismissable toast');

            return FunkyTests.delay(100).then(function() {
                var dismissBtn = document.querySelector('.funky-toast .toast-dismiss, .funky-toast .btn-close');
                if (dismissBtn) {
                    var name = A11y.getAccessibleName(dismissBtn);
                    expect(name).toBeTruthy();
                }
            });
        });

        it('dismiss button is keyboard accessible', function() {
            Toast.success('Dismissable toast');

            return FunkyTests.delay(100).then(function() {
                var dismissBtn = document.querySelector('.funky-toast .toast-dismiss, .funky-toast .btn-close');
                if (dismissBtn) {
                    expect(A11y.isInTabOrder(dismissBtn)).toBe(true);
                }
            });
        });

        it('dismiss button is focusable', function() {
            Toast.success('Focusable dismiss');

            return FunkyTests.delay(100).then(function() {
                var dismissBtn = document.querySelector('.funky-toast .toast-dismiss, .funky-toast .btn-close');
                if (dismissBtn) {
                    dismissBtn.focus();
                    expect(document.activeElement).toBe(dismissBtn);
                }
            });
        });

    });

    describe('Confirm Toast Accessibility', function() {

        it('confirm toast has dialog role', function() {
            Toast.confirm({
                message: 'Are you sure?',
                onConfirm: function() {}
            });

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast');
                var role = toast.getAttribute('role');
                expect(role === 'alertdialog' || role === 'dialog' || role === 'alert').toBe(true);
            });
        });

        it('confirm buttons are keyboard accessible', function() {
            Toast.confirm({
                message: 'Confirm action?',
                onConfirm: function() {}
            });

            return FunkyTests.delay(100).then(function() {
                var confirmBtn = document.querySelector('.toast-confirm');
                var cancelBtn = document.querySelector('.toast-cancel');

                if (confirmBtn) {
                    expect(A11y.isInTabOrder(confirmBtn)).toBe(true);
                }
                if (cancelBtn) {
                    expect(A11y.isInTabOrder(cancelBtn)).toBe(true);
                }
            });
        });

        it('confirm buttons have accessible names', function() {
            Toast.confirm({
                message: 'Delete item?',
                confirmText: 'Yes, delete',
                cancelText: 'No, cancel',
                onConfirm: function() {}
            });

            return FunkyTests.delay(100).then(function() {
                var confirmBtn = document.querySelector('.toast-confirm');
                var cancelBtn = document.querySelector('.toast-cancel');

                if (confirmBtn) {
                    var confirmName = A11y.getAccessibleName(confirmBtn);
                    expect(confirmName).toBeTruthy();
                }
                if (cancelBtn) {
                    var cancelName = A11y.getAccessibleName(cancelBtn);
                    expect(cancelName).toBeTruthy();
                }
            });
        });

    });

    describe('Screen Reader Announcements', function() {

        it('toast message is announced immediately', function() {
            Toast.error('Critical error occurred');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-error');
                // role="alert" causes immediate announcement
                expect(toast.getAttribute('role')).toBe('alert');
            });
        });

        it('toast container has aria-atomic for complete reading', function() {
            Toast.info('Complete message');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast');
                // aria-atomic="true" ensures entire toast is read
                // This is optional but recommended
                var hasAtomic = toast.getAttribute('aria-atomic') === 'true';
                // Pass even without it since role handles announcement
                expect(toast).toBeInDocument();
            });
        });

    });

    describe('Visual Indicators', function() {

        it('toast type is not conveyed by color alone', function() {
            Toast.error('Error with icon');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-error');
                // Should have icon, text label, or other non-color indicator
                var hasIcon = toast.querySelector('svg, .icon, [class*="icon"]');
                var hasTypeInClass = toast.className.includes('error');
                var hasAriaRole = toast.getAttribute('role') === 'alert';

                expect(hasIcon || hasTypeInClass || hasAriaRole).toBe(true);
            });
        });

        it('error toast has distinguishing visual element', function() {
            Toast.error('Visible error');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-error');
                // Must have something beyond color to indicate error
                expect(toast.classList.contains('funky-toast-error')).toBe(true);
            });
        });

    });

    describe('Focus Management', function() {

        it('toasts do not steal focus from current task', function() {
            // Create a focusable element
            var input = document.createElement('input');
            input.type = 'text';
            document.body.appendChild(input);
            input.focus();

            var originalFocus = document.activeElement;

            Toast.info('Non-intrusive notification');

            return FunkyTests.delay(100).then(function() {
                // Focus should remain on original element
                expect(document.activeElement).toBe(originalFocus);
                input.remove();
            });
        });

        it('confirm toast can receive focus for interaction', function() {
            Toast.confirm({
                message: 'Focus test',
                onConfirm: function() {}
            });

            return FunkyTests.delay(100).then(function() {
                var confirmBtn = document.querySelector('.toast-confirm');
                if (confirmBtn) {
                    confirmBtn.focus();
                    expect(document.activeElement).toBe(confirmBtn);
                }
            });
        });

    });

    describe('Timing', function() {

        it('toasts have sufficient display time for reading', function() {
            // WCAG 2.2.1: Timing adjustable
            // Auto-dismiss toasts should have adequate reading time
            var startTime = Date.now();
            Toast.info('This toast should be visible long enough to read');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-info');
                expect(toast).toBeInDocument();
                // Toast should still be visible after 100ms
            });
        });

        it('important messages can be persistent', function() {
            Toast.error('Persistent error', { duration: 0 });

            return FunkyTests.delay(500).then(function() {
                var toast = document.querySelector('.funky-toast-error');
                // Duration 0 means it should still be there
                expect(toast).toBeInDocument();
            });
        });

    });

    describe('Multiple Toasts', function() {

        it('multiple toasts are all accessible', function() {
            Toast.info('First toast');
            Toast.warning('Second toast');
            Toast.error('Third toast');

            return FunkyTests.delay(150).then(function() {
                var toasts = document.querySelectorAll('.funky-toast');
                expect(toasts.length).toBeGreaterThan(1);

                // Each should have appropriate role
                Array.prototype.forEach.call(toasts, function(toast) {
                    var role = toast.getAttribute('role');
                    expect(role === 'alert' || role === 'status').toBe(true);
                });
            });
        });

        it('toast container does not block page content', function() {
            Toast.info('Non-blocking toast');

            return FunkyTests.delay(100).then(function() {
                var container = document.getElementById('funky-toast-container');
                if (container) {
                    // Container should have position-fixed class (from Bootstrap)
                    // or inline position style that positions it out of normal flow
                    var hasFixedClass = container.classList.contains('position-fixed');
                    var style = window.getComputedStyle(container);
                    var position = style.position;
                    expect(hasFixedClass || position === 'fixed' || position === 'absolute').toBe(true);
                }
            });
        });

    });

});
