/**
 * Funky.Toast Tests
 *
 * Tests for the toast notification system.
 */

describe('Funky.Component.Toast', function() {

    var Toast = Funky.Toast;

    afterEach(function() {
        // Clean up any toasts
        var container = document.getElementById('funky-toast-container');
        if (container) {
            container.innerHTML = '';
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Toast')).toBe(true);
        });

        it('has success method', function() {
            expect(typeof Toast.success).toBe('function');
        });

        it('has error method', function() {
            expect(typeof Toast.error).toBe('function');
        });

        it('has warning method', function() {
            expect(typeof Toast.warning).toBe('function');
        });

        it('has info method', function() {
            expect(typeof Toast.info).toBe('function');
        });

        it('has confirm method', function() {
            expect(typeof Toast.confirm).toBe('function');
        });

        it('has show method', function() {
            expect(typeof Toast.show).toBe('function');
        });

    });

    describe('Toast container', function() {

        it('creates container on init', function() {
            var container = document.getElementById('funky-toast-container');
            expect(container).toBeInDocument();
        });

        it('container has correct positioning', function() {
            var container = document.getElementById('funky-toast-container');
            expect(container.classList.contains('position-fixed')).toBe(true);
        });

    });

    describe('success()', function() {

        it('creates success toast', function() {
            Toast.success('Test message');

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast-success');
                expect(toast).toBeInDocument();
            });
        });

        it('shows message in toast body', function() {
            Toast.success('Success message here');

            return FunkyTests.delay(50).then(function() {
                var body = document.querySelector('.funky-toast-success .toast-body');
                expect(body.textContent).toContain('Success message here');
            });
        });

        it('shows default title', function() {
            Toast.success('Test');

            return FunkyTests.delay(50).then(function() {
                var header = document.querySelector('.funky-toast-success .toast-header');
                expect(header.textContent).toContain('Success');
            });
        });

        it('shows custom title', function() {
            Toast.success('Test', 'Custom Title');

            return FunkyTests.delay(50).then(function() {
                var header = document.querySelector('.funky-toast-success .toast-header');
                expect(header.textContent).toContain('Custom Title');
            });
        });

    });

    describe('error()', function() {

        it('creates error toast', function() {
            Toast.error('Error message');

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast-error');
                expect(toast).toBeInDocument();
            });
        });

    });

    describe('warning()', function() {

        it('creates warning toast', function() {
            Toast.warning('Warning message');

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast-warning');
                expect(toast).toBeInDocument();
            });
        });

    });

    describe('info()', function() {

        it('creates info toast', function() {
            Toast.info('Info message');

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast-info');
                expect(toast).toBeInDocument();
            });
        });

    });

    describe('show()', function() {

        it('accepts options object', function() {
            Toast.show({
                message: 'Custom toast',
                type: 'success',
                title: 'Custom'
            });

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast-success');
                expect(toast).toBeInDocument();
            });
        });

        it('returns toast element', function() {
            var toast = Toast.show({
                message: 'Test',
                type: 'info'
            });

            expect(toast).toBeDefined();
            expect(toast.tagName).toBe('DIV');
        });

    });

    describe('confirm()', function() {

        it('creates confirm toast', function() {
            Toast.confirm({
                message: 'Are you sure?'
            });

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast-confirm');
                expect(toast).toBeInDocument();
            });
        });

        it('has Yes and No buttons', function() {
            Toast.confirm({
                message: 'Confirm action?'
            });

            return FunkyTests.delay(50).then(function() {
                var confirmBtn = document.querySelector('.toast-confirm');
                var cancelBtn = document.querySelector('.toast-cancel');

                expect(confirmBtn).toBeInDocument();
                expect(cancelBtn).toBeInDocument();
            });
        });

        it('calls onConfirm when confirmed', function() {
            var confirmed = false;

            Toast.confirm({
                message: 'Confirm?',
                onConfirm: function() {
                    confirmed = true;
                }
            });

            return FunkyTests.delay(50).then(function() {
                var confirmBtn = document.querySelector('.toast-confirm');
                FunkyTests.simulate.click(confirmBtn);

                return FunkyTests.delay(50);
            }).then(function() {
                expect(confirmed).toBe(true);
            });
        });

        it('calls onCancel when cancelled', function() {
            var cancelled = false;

            Toast.confirm({
                message: 'Confirm?',
                onCancel: function() {
                    cancelled = true;
                }
            });

            return FunkyTests.delay(50).then(function() {
                var cancelBtn = document.querySelector('.toast-cancel');
                FunkyTests.simulate.click(cancelBtn);

                return FunkyTests.delay(50);
            }).then(function() {
                expect(cancelled).toBe(true);
            });
        });

        it('uses custom button text', function() {
            Toast.confirm({
                message: 'Delete?',
                confirmText: 'Delete',
                cancelText: 'Keep'
            });

            return FunkyTests.delay(50).then(function() {
                var confirmBtn = document.querySelector('.toast-confirm');
                var cancelBtn = document.querySelector('.toast-cancel');

                expect(confirmBtn.textContent).toBe('Delete');
                expect(cancelBtn.textContent).toBe('Keep');
            });
        });

    });

    describe('Accessibility', function() {

        it('info toast has role="status" for polite announcements', function() {
            Toast.info('Accessible toast');

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast');
                expect(toast.getAttribute('role')).toBe('status');
            });
        });

        it('error toast has role="alert" for urgent announcements', function() {
            Toast.error('Error toast');

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast');
                expect(toast.getAttribute('role')).toBe('alert');
            });
        });

        it('info toast has aria-live="polite"', function() {
            Toast.info('Live region toast');

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast');
                expect(toast.getAttribute('aria-live')).toBe('polite');
            });
        });

        it('error toast has aria-live="assertive"', function() {
            Toast.error('Urgent toast');

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast');
                expect(toast.getAttribute('aria-live')).toBe('assertive');
            });
        });

        it('toast has aria-atomic="true"', function() {
            Toast.info('Atomic toast');

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast');
                expect(toast.getAttribute('aria-atomic')).toBe('true');
            });
        });

        it('close button has aria-label', function() {
            Toast.info('Toast with close');

            return FunkyTests.delay(50).then(function() {
                var closeBtn = document.querySelector('.btn-close');
                expect(closeBtn.getAttribute('aria-label')).toBe('Close');
            });
        });

    });

    describe('Close behavior', function() {

        it('close button hides toast', function() {
            Toast.info('Closeable toast');

            return FunkyTests.delay(50).then(function() {
                var closeBtn = document.querySelector('.btn-close');
                FunkyTests.simulate.click(closeBtn);

                return FunkyTests.delay(200);
            }).then(function() {
                var toast = document.querySelector('.funky-toast-info');
                expect(toast).toBeNull();
            });
        });

    });

    describe('Bindable Interface - addData()', function() {

        it('has addData method', function() {
            expect(typeof Toast.addData).toBe('function');
        });

        it('shows notification from data', function() {
            Toast.addData({
                message: 'Streamed notification',
                type: 'success'
            });

            return FunkyTests.delay(50).then(function() {
                var toast = document.querySelector('.funky-toast-success');
                expect(toast).toBeInDocument();
            });
        });

        it('handles array of notifications', function() {
            Toast.addData([
                { message: 'First', type: 'info' },
                { message: 'Second', type: 'success' }
            ]);

            return FunkyTests.delay(50).then(function() {
                var toasts = document.querySelectorAll('.funky-toast');
                expect(toasts.length).toBeGreaterThan(1);
            });
        });

    });

});
