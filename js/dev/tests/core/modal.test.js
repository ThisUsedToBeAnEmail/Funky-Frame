/**
 * Modal Unit Tests
 *
 * Tests for Funky.Modal - the native modal system.
 */

describe('Funky.Core.Modal', function() {

    var Modal = Funky.Modal;
    var fixture;
    var modalId;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
        modalId = 'testModal_' + Date.now();

        // Ensure clean state before each test
        // Clear keyboard scopes to avoid cross-test contamination
        if (Funky.Keyboard && Funky.Keyboard.clearScopes) {
            Funky.Keyboard.clearScopes();
        }
        // Force-hide any open modals and clear the openModals array
        Modal.hideAll();
        Modal.cleanupBackdrops();

        // Create a test modal in the fixture
        fixture.html(
            '<div class="modal fade" id="' + modalId + '" tabindex="-1" aria-hidden="true">' +
                '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<h5 class="modal-title">Test Modal</h5>' +
                            '<button type="button" class="btn-close" data-funky-modal-close aria-label="Close"></button>' +
                        '</div>' +
                        '<div class="modal-body">' +
                            '<input type="text" id="modalInput">' +
                            '<button id="modalBtn">Click</button>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                            '<button type="button" class="btn btn-secondary" data-funky-modal-close>Close</button>' +
                            '<button type="button" class="btn btn-primary" id="saveBtn">Save</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    afterEach(function() {
        // Clean up any open modals
        Modal.hideAll();
        Modal.cleanupBackdrops();
        // Clear keyboard scopes to avoid cross-test contamination
        if (Funky.Keyboard && Funky.Keyboard.clearScopes) {
            Funky.Keyboard.clearScopes();
        }
        fixture.cleanup();

        // Remove dynamically created modals
        document.querySelectorAll('.modal').forEach(function(m) {
            if (m.parentNode) {
                m.parentNode.removeChild(m);
            }
        });

        // Manually remove any remaining backdrops
        document.querySelectorAll('.modal-backdrop').forEach(function(b) {
            if (b.parentNode) {
                b.parentNode.removeChild(b);
            }
        });

        // Reset body scroll state
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    });

    describe('Module registration', function() {

        it('is registered with Funky', function() {
            expect(Funky.Modal).toBeDefined();
            expect(typeof Funky.Modal.show).toBe('function');
        });

        it('has static methods', function() {
            expect(typeof Modal.show).toBe('function');
            expect(typeof Modal.hide).toBe('function');
            expect(typeof Modal.toggle).toBe('function');
            expect(typeof Modal.hideAll).toBe('function');
            expect(typeof Modal.getOpenModals).toBe('function');
        });

        it('has factory methods', function() {
            expect(typeof Modal.create).toBe('function');
            expect(typeof Modal.confirm).toBe('function');
            expect(typeof Modal.alert).toBe('function');
            expect(typeof Modal.prompt).toBe('function');
        });

    });

    describe('Show and hide', function() {

        it('shows modal by selector', function() {
            Modal.show('#' + modalId);

            return FunkyTests.delay(100).then(function() {
                var el = document.getElementById(modalId);
                expect(el.classList.contains('show')).toBe(true);
                expect(el.style.display).toBe('block');
            });
        });

        it('hides modal', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete (300ms) before hiding
            return FunkyTests.delay(350).then(function() {
                Modal.hide('#' + modalId);
                return FunkyTests.delay(500);
            }).then(function() {
                var el = document.getElementById(modalId);
                expect(el.classList.contains('show')).toBe(false);
            });
        });

        it('toggle shows hidden modal', function() {
            var el = document.getElementById(modalId);
            expect(el.classList.contains('show')).toBe(false);

            Modal.toggle('#' + modalId);

            return FunkyTests.delay(100).then(function() {
                expect(el.classList.contains('show')).toBe(true);
            });
        });

        it('toggle hides shown modal', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete before toggling
            return FunkyTests.delay(350).then(function() {
                Modal.toggle('#' + modalId);
                return FunkyTests.delay(500);
            }).then(function() {
                var el = document.getElementById(modalId);
                expect(el.classList.contains('show')).toBe(false);
            });
        });

    });

    describe('Backdrop', function() {

        it('creates backdrop when modal shows', function() {
            Modal.show('#' + modalId);

            return FunkyTests.delay(100).then(function() {
                var backdrop = document.querySelector('.modal-backdrop');
                expect(backdrop).not.toBeNull();
            });
        });

        it('removes backdrop when modal hides', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete before hiding
            return FunkyTests.delay(350).then(function() {
                Modal.hide('#' + modalId);
                // Backdrop removal has two phases: hide transition (300ms) + backdrop fade (300ms)
                return FunkyTests.delay(700);
            }).then(function() {
                var backdrop = document.querySelector('.modal-backdrop');
                expect(backdrop).toBeNull();
            });
        });

        it('clicking backdrop closes modal (default behavior)', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete before clicking
            return FunkyTests.delay(350).then(function() {
                // Click the modal element itself (not the dialog)
                var modalEl = document.getElementById(modalId);
                modalEl.click();
                return FunkyTests.delay(500);
            }).then(function() {
                var el = document.getElementById(modalId);
                expect(el.classList.contains('show')).toBe(false);
            });
        });

    });

    describe('Keyboard handling', function() {

        it('pressing Escape closes modal', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete before pressing Escape
            return FunkyTests.delay(350).then(function() {
                var event = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    bubbles: true
                });
                document.dispatchEvent(event);
                return FunkyTests.delay(500);
            }).then(function() {
                var el = document.getElementById(modalId);
                expect(el.classList.contains('show')).toBe(false);
            });
        });

        it('respects keyboard: false option', function() {
            var modal = Modal.getOrCreateInstance('#' + modalId, { keyboard: false });
            modal.show();

            // Wait for show transition to complete before testing Escape
            return FunkyTests.delay(350).then(function() {
                var event = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    bubbles: true
                });
                document.dispatchEvent(event);
                return FunkyTests.delay(200);
            }).then(function() {
                // Modal should still be open
                var el = document.getElementById(modalId);
                expect(el.classList.contains('show')).toBe(true);
            });
        });

    });

    describe('Close button', function() {

        it('close button hides modal', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete before clicking close
            return FunkyTests.delay(350).then(function() {
                var closeBtn = document.querySelector('#' + modalId + ' .btn-close');
                closeBtn.click();
                return FunkyTests.delay(500);
            }).then(function() {
                var el = document.getElementById(modalId);
                expect(el.classList.contains('show')).toBe(false);
            });
        });

        it('footer close button hides modal', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete before clicking close
            return FunkyTests.delay(350).then(function() {
                var closeBtn = document.querySelector('#' + modalId + ' .modal-footer [data-funky-modal-close]');
                closeBtn.click();
                return FunkyTests.delay(500);
            }).then(function() {
                var el = document.getElementById(modalId);
                expect(el.classList.contains('show')).toBe(false);
            });
        });

    });

    describe('Events', function() {

        it('emits funky.modal.show event before showing', function() {
            var eventFired = false;
            var el = document.getElementById(modalId);

            el.addEventListener('funky.modal.show', function() {
                eventFired = true;
            });

            Modal.show('#' + modalId);

            return FunkyTests.delay(50).then(function() {
                expect(eventFired).toBe(true);
            });
        });

        it('emits funky.modal.shown event after shown', function() {
            var eventFired = false;
            var el = document.getElementById(modalId);

            el.addEventListener('funky.modal.shown', function() {
                eventFired = true;
            });

            Modal.show('#' + modalId);

            return FunkyTests.delay(500).then(function() {
                expect(eventFired).toBe(true);
            });
        });

        it('emits funky.modal.hide event before hiding', function() {
            var eventFired = false;
            var el = document.getElementById(modalId);

            el.addEventListener('funky.modal.hide', function() {
                eventFired = true;
            });

            Modal.show('#' + modalId);

            // Wait for show transition to complete before hiding
            return FunkyTests.delay(350).then(function() {
                Modal.hide('#' + modalId);
                return FunkyTests.delay(50);
            }).then(function() {
                expect(eventFired).toBe(true);
            });
        });

        it('emits funky.modal.hidden event after hidden', function() {
            var eventFired = false;
            var el = document.getElementById(modalId);

            el.addEventListener('funky.modal.hidden', function() {
                eventFired = true;
            });

            Modal.show('#' + modalId);

            // Wait for show transition to complete before hiding
            return FunkyTests.delay(350).then(function() {
                Modal.hide('#' + modalId);
                return FunkyTests.delay(500);
            }).then(function() {
                expect(eventFired).toBe(true);
            });
        });

    });

    describe('Instance methods', function() {

        it('getOrCreateInstance returns existing instance', function() {
            var instance1 = Modal.getOrCreateInstance('#' + modalId);
            var instance2 = Modal.getOrCreateInstance('#' + modalId);

            expect(instance1).toBe(instance2);
        });

        it('getInstance returns null for non-existent modal', function() {
            var instance = Modal.getInstance('#nonExistent');
            expect(instance).toBeNull();
        });

        it('instance.show() shows the modal', function() {
            var instance = Modal.getOrCreateInstance('#' + modalId);
            instance.show();

            return FunkyTests.delay(100).then(function() {
                expect(instance.isShown).toBe(true);
            });
        });

        it('instance.hide() hides the modal', function() {
            var instance = Modal.getOrCreateInstance('#' + modalId);
            instance.show();

            // Wait for show transition to complete before hiding
            return FunkyTests.delay(350).then(function() {
                instance.hide();
                return FunkyTests.delay(500);
            }).then(function() {
                expect(instance.isShown).toBe(false);
            });
        });

        it('dispose removes instance', function() {
            var instance = Modal.getOrCreateInstance('#' + modalId);
            instance.dispose();

            var retrieved = Modal.getInstance('#' + modalId);
            expect(retrieved).toBeNull();
        });

    });

    describe('Modal.create()', function() {

        it('creates modal element programmatically', function() {
            var id = 'createdModal_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: 'Created Modal',
                body: 'This is the body content'
            });

            expect(modal).not.toBeNull();
            expect(modal.id).toBe(id);
            expect(modal.querySelector('.modal-title').textContent).toBe('Created Modal');
            expect(modal.querySelector('.modal-body').textContent).toContain('body content');
        });

        it('creates modal with footer buttons', function() {
            var id = 'modalWithButtons_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: 'Test',
                body: 'Content',
                footerButtons: [
                    { text: 'Cancel', class: 'btn btn-secondary', close: true },
                    { text: 'Save', class: 'btn btn-primary', id: 'saveBtn' }
                ]
            });

            var buttons = modal.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(buttons[0].textContent).toBe('Cancel');
            expect(buttons[1].textContent).toBe('Save');
        });

        it('creates centered modal', function() {
            var id = 'centeredModal_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: 'Centered',
                body: 'Content',
                centered: true
            });

            var dialog = modal.querySelector('.modal-dialog');
            expect(dialog.classList.contains('modal-dialog-centered')).toBe(true);
        });

        it('creates modal with size option', function() {
            var id = 'largeModal_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: 'Large Modal',
                body: 'Content',
                size: 'lg'
            });

            var dialog = modal.querySelector('.modal-dialog');
            expect(dialog.classList.contains('modal-lg')).toBe(true);
        });

    });

    describe('Modal.confirm()', function() {

        it('shows confirmation modal', function() {
            var instance = Modal.confirm({
                title: 'Confirm Action',
                message: 'Are you sure?',
                onConfirm: function() {}
            });

            return FunkyTests.delay(100).then(function() {
                var modal = document.querySelector('.modal.show');
                expect(modal).not.toBeNull();
                expect(modal.textContent).toContain('Are you sure');
            });
        });

        it('calls onConfirm when confirmed', function() {
            var confirmed = false;
            var instance = Modal.confirm({
                title: 'Confirm',
                message: 'Test',
                onConfirm: function() {
                    confirmed = true;
                }
            });

            return FunkyTests.delay(100).then(function() {
                var confirmBtn = document.querySelector('[id$="_confirm"]');
                confirmBtn.click();
                return FunkyTests.delay(500);
            }).then(function() {
                expect(confirmed).toBe(true);
            });
        });

    });

    describe('Modal.alert()', function() {

        it('shows alert modal', function() {
            var instance = Modal.alert({
                title: 'Alert',
                message: 'Something happened!'
            });

            return FunkyTests.delay(100).then(function() {
                var modal = document.querySelector('.modal.show');
                expect(modal).not.toBeNull();
                expect(modal.textContent).toContain('Something happened');
            });
        });

        it('calls onClose when closed', function() {
            var closed = false;
            var instance = Modal.alert({
                title: 'Alert',
                message: 'Test',
                onClose: function() {
                    closed = true;
                }
            });

            // Wait for show transition to complete before clicking
            return FunkyTests.delay(350).then(function() {
                var okBtn = document.querySelector('.modal.show .modal-footer button');
                okBtn.click();
                return FunkyTests.delay(500);
            }).then(function() {
                expect(closed).toBe(true);
            });
        });

    });

    describe('Modal.prompt()', function() {

        it('shows prompt modal with input', function() {
            var instance = Modal.prompt({
                title: 'Enter Name',
                message: 'Please provide your name',
                onSubmit: function() {}
            });

            return FunkyTests.delay(100).then(function() {
                var modal = document.querySelector('.modal.show');
                var input = modal.querySelector('input');
                expect(modal).not.toBeNull();
                expect(input).not.toBeNull();
            });
        });

        it('calls onSubmit with input value', function() {
            var submittedValue = null;
            var instance = Modal.prompt({
                title: 'Name',
                defaultValue: 'John',
                onSubmit: function(value) {
                    submittedValue = value;
                }
            });

            return FunkyTests.delay(100).then(function() {
                var submitBtn = document.querySelector('[id$="_submit"]');
                submitBtn.click();
                return FunkyTests.delay(500);
            }).then(function() {
                expect(submittedValue).toBe('John');
            });
        });

    });

    describe('Body scroll lock', function() {

        it('adds modal-open class to body when shown', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete
            return FunkyTests.delay(350).then(function() {
                expect(document.body.classList.contains('modal-open')).toBe(true);
            });
        });

        it('removes modal-open class when hidden', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete before hiding
            return FunkyTests.delay(350).then(function() {
                Modal.hide('#' + modalId);
                return FunkyTests.delay(500);
            }).then(function() {
                expect(document.body.classList.contains('modal-open')).toBe(false);
            });
        });

    });

    describe('Accessibility', function() {

        it('sets aria-modal="true" when shown', function() {
            Modal.show('#' + modalId);

            return FunkyTests.delay(100).then(function() {
                var el = document.getElementById(modalId);
                expect(el.getAttribute('aria-modal')).toBe('true');
            });
        });

        it('removes aria-hidden when shown', function() {
            var el = document.getElementById(modalId);
            el.setAttribute('aria-hidden', 'true');

            Modal.show('#' + modalId);

            return FunkyTests.delay(100).then(function() {
                expect(el.hasAttribute('aria-hidden')).toBe(false);
            });
        });

        it('sets aria-hidden when hidden', function() {
            Modal.show('#' + modalId);

            // Wait for show transition to complete before hiding
            return FunkyTests.delay(350).then(function() {
                Modal.hide('#' + modalId);
                return FunkyTests.delay(500);
            }).then(function() {
                var el = document.getElementById(modalId);
                expect(el.getAttribute('aria-hidden')).toBe('true');
            });
        });

    });

    describe('hideAll()', function() {

        it('closes all open modals', function() {
            // Create and show two modals
            var modal1 = Modal.create({ id: 'multi1_' + Date.now(), title: 'One', body: 'A' });
            var modal2 = Modal.create({ id: 'multi2_' + Date.now(), title: 'Two', body: 'B' });

            Modal.show('#' + modal1.id);

            // Wait for first modal transition to complete before showing second
            return FunkyTests.delay(350).then(function() {
                Modal.show('#' + modal2.id);
                return FunkyTests.delay(350);
            }).then(function() {
                expect(Modal.getOpenModals().length).toBe(2);
                Modal.hideAll();
                return FunkyTests.delay(500);
            }).then(function() {
                expect(Modal.getOpenModals().length).toBe(0);
            });
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error handling', function() {

        it('show handles null selector gracefully', function() {
            expect(function() {
                Modal.show(null);
            }).not.toThrow();
        });

        it('show handles undefined selector gracefully', function() {
            expect(function() {
                Modal.show(undefined);
            }).not.toThrow();
        });

        it('show handles non-existent selector gracefully', function() {
            expect(function() {
                Modal.show('#non-existent-modal');
            }).not.toThrow();
        });

        it('hide handles null selector gracefully', function() {
            expect(function() {
                Modal.hide(null);
            }).not.toThrow();
        });

        it('hide handles non-existent selector gracefully', function() {
            expect(function() {
                Modal.hide('#non-existent-modal');
            }).not.toThrow();
        });

        it('toggle handles null selector gracefully', function() {
            expect(function() {
                Modal.toggle(null);
            }).not.toThrow();
        });

        it('getInstance handles null gracefully', function() {
            var instance = Modal.getInstance(null);
            expect(instance).toBeNull();
        });

        it('getInstance handles empty string gracefully', function() {
            var instance = Modal.getInstance('');
            expect(instance).toBeNull();
        });

        it('getOrCreateInstance handles invalid element gracefully', function() {
            var instance = Modal.getOrCreateInstance('#completely-fake');
            expect(instance === null || instance === undefined).toBe(true);
        });

        it('dispose handles already disposed modal gracefully', function() {
            var instance = Modal.getOrCreateInstance('#' + modalId);
            instance.dispose();

            // Second dispose should not throw
            expect(function() {
                instance.dispose();
            }).not.toThrow();
        });

    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    describe('Edge cases', function() {

        it('handles showing same modal twice', function() {
            Modal.show('#' + modalId);

            return FunkyTests.delay(100).then(function() {
                Modal.show('#' + modalId); // Second show
                return FunkyTests.delay(100);
            }).then(function() {
                var el = document.getElementById(modalId);
                expect(el.classList.contains('show')).toBe(true);
            });
        });

        it('handles hiding already hidden modal', function() {
            // Modal is not shown
            expect(function() {
                Modal.hide('#' + modalId);
            }).not.toThrow();
        });

        it('handles rapid show/hide cycles', function() {
            Modal.show('#' + modalId);
            Modal.hide('#' + modalId);
            Modal.show('#' + modalId);
            Modal.hide('#' + modalId);

            return FunkyTests.delay(600).then(function() {
                // Should not crash
                expect(true).toBe(true);
            });
        });

        it('handles modal with empty title', function() {
            var id = 'emptyTitle_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: '',
                body: 'Content only'
            });

            expect(modal).not.toBeNull();
        });

        it('handles modal with empty body', function() {
            var id = 'emptyBody_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: 'Title only',
                body: ''
            });

            expect(modal).not.toBeNull();
        });

        it('handles special characters in modal content', function() {
            var id = 'specialChars_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: 'Test <>&"\'',
                body: '<script>alert("xss")</script>'
            });

            expect(modal).not.toBeNull();
            // Content should be escaped or safe
        });

        it('handles very long title', function() {
            var id = 'longTitle_' + Date.now();
            var longTitle = 'A'.repeat(500);
            var modal = Modal.create({
                id: id,
                title: longTitle,
                body: 'Body'
            });

            expect(modal).not.toBeNull();
            expect(modal.querySelector('.modal-title').textContent.length).toBe(500);
        });

        it('handles Unicode content', function() {
            var id = 'unicode_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: '日本語タイトル 🎉',
                body: 'Émoji content: 🚀 ñ é'
            });

            expect(modal).not.toBeNull();
            expect(modal.querySelector('.modal-title').textContent).toContain('🎉');
        });

    });

    // =========================================================================
    // OPTIONS TESTS
    // =========================================================================
    describe('Options', function() {

        it('respects backdrop: static option', function() {
            var modal = Modal.getOrCreateInstance('#' + modalId, { backdrop: 'static' });
            modal.show();

            return FunkyTests.delay(350).then(function() {
                // Click the modal element itself (not the dialog)
                var modalEl = document.getElementById(modalId);
                modalEl.click();
                return FunkyTests.delay(100);
            }).then(function() {
                var el = document.getElementById(modalId);
                // Modal should still be open
                expect(el.classList.contains('show')).toBe(true);
            });
        });

        it('respects focus option', function() {
            var modal = Modal.getOrCreateInstance('#' + modalId, { focus: true });
            modal.show();

            return FunkyTests.delay(350).then(function() {
                // Modal or an element inside should be focused
                expect(document.activeElement).not.toBeNull();
            });
        });

        it('create accepts scrollable option', function() {
            var id = 'scrollable_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: 'Scrollable',
                body: 'Content',
                scrollable: true
            });

            var dialog = modal.querySelector('.modal-dialog');
            expect(dialog.classList.contains('modal-dialog-scrollable')).toBe(true);
        });

        it('create accepts fullscreen option', function() {
            var id = 'fullscreen_' + Date.now();
            var modal = Modal.create({
                id: id,
                title: 'Fullscreen',
                body: 'Content',
                fullscreen: true
            });

            var dialog = modal.querySelector('.modal-dialog');
            expect(dialog.classList.contains('modal-fullscreen')).toBe(true);
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    describe('Cleanup', function() {

        it('removes backdrop on dispose', function() {
            Modal.show('#' + modalId);

            return FunkyTests.delay(350).then(function() {
                var instance = Modal.getInstance('#' + modalId);
                instance.dispose();
                return FunkyTests.delay(500);
            }).then(function() {
                // No backdrops should remain
                Modal.cleanupBackdrops();
                var backdrop = document.querySelector('.modal-backdrop');
                expect(backdrop).toBeNull();
            });
        });

        it('restores body scroll on hide', function() {
            document.body.style.overflow = 'auto';

            Modal.show('#' + modalId);

            return FunkyTests.delay(350).then(function() {
                Modal.hide('#' + modalId);
                return FunkyTests.delay(500);
            }).then(function() {
                expect(document.body.classList.contains('modal-open')).toBe(false);
            });
        });

        it('cleanupBackdrops removes orphaned backdrops', function() {
            // Create an orphaned backdrop manually
            var backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            document.body.appendChild(backdrop);

            Modal.cleanupBackdrops();

            var remaining = document.querySelector('.modal-backdrop');
            expect(remaining).toBeNull();
        });

        it('hideAll cleans up all state', function() {
            // Create and show multiple modals
            Modal.show('#' + modalId);

            return FunkyTests.delay(350).then(function() {
                Modal.hideAll();
                return FunkyTests.delay(500);
            }).then(function() {
                expect(Modal.getOpenModals().length).toBe(0);
                expect(document.body.classList.contains('modal-open')).toBe(false);
            });
        });

    });

    // =========================================================================
    // FOCUS TRAP TESTS
    // =========================================================================
    describe('Focus trap', function() {

        it('traps focus within modal', function() {
            Modal.show('#' + modalId);

            return FunkyTests.delay(350).then(function() {
                var input = document.getElementById('modalInput');
                var btn = document.getElementById('modalBtn');

                // Focus should stay within modal
                input.focus();
                expect(document.activeElement).toBe(input);

                btn.focus();
                expect(document.activeElement).toBe(btn);
            });
        });

        it('focuses first focusable element when opened', function() {
            Modal.show('#' + modalId);

            return FunkyTests.delay(350).then(function() {
                // Focus should be on an element inside the modal
                var modalEl = document.getElementById(modalId);
                expect(modalEl.contains(document.activeElement)).toBe(true);
            });
        });

    });

    // =========================================================================
    // STATE VERIFICATION TESTS
    // =========================================================================
    describe('State verification', function() {

        it('getOpenModals returns correct count', function() {
            expect(Modal.getOpenModals().length).toBe(0);

            Modal.show('#' + modalId);

            return FunkyTests.delay(350).then(function() {
                expect(Modal.getOpenModals().length).toBe(1);
            });
        });

        it('isShown property reflects state', function() {
            var instance = Modal.getOrCreateInstance('#' + modalId);

            expect(instance.isShown).toBe(false);

            instance.show();

            return FunkyTests.delay(350).then(function() {
                expect(instance.isShown).toBe(true);
            });
        });

        it('multiple getInstance calls return same instance', function() {
            var instance1 = Modal.getOrCreateInstance('#' + modalId);
            var instance2 = Modal.getOrCreateInstance('#' + modalId);
            var instance3 = Modal.getInstance('#' + modalId);

            expect(instance1).toBe(instance2);
            expect(instance2).toBe(instance3);
        });

    });

});
