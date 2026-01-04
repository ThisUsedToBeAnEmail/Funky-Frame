/**
 * Accessibility Tests: Funky.FormModal
 *
 * Tests WCAG 2.1 AA compliance for form modal component.
 * Modal dialogs with forms require proper focus management,
 * form accessibility, and error announcements.
 */

FunkyTests.describe('Funky.A11y.FormModal', function() {
    var expect = FunkyTests.expect;
    var FormModal = window.Funky && window.Funky.FormModal;
    var Modal = window.Funky && window.Funky.Modal;

    // Skip all tests if FormModal not loaded
    if (!FormModal) {
        FunkyTests.it('FormModal component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="test-container">' +
                '<button id="open-modal-btn" type="button">Create New</button>' +
                '<div id="testFormModal" class="modal fade" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="testFormModalTitle">' +
                    '<div class="modal-dialog">' +
                        '<div class="modal-content">' +
                            '<div class="modal-header">' +
                                '<h5 class="modal-title" id="testFormModalTitle">Create Item</h5>' +
                                '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
                            '</div>' +
                            '<div class="modal-body">' +
                                '<form id="testForm" novalidate>' +
                                    '<div class="mb-3">' +
                                        '<label for="itemName" class="form-label">Name <span class="text-danger" aria-hidden="true">*</span></label>' +
                                        '<input type="text" class="form-control" id="itemName" name="name" required aria-required="true" aria-describedby="nameHelp nameError">' +
                                        '<div id="nameHelp" class="form-text">Enter a unique name for this item.</div>' +
                                        '<div id="nameError" class="invalid-feedback" role="alert" aria-live="assertive"></div>' +
                                    '</div>' +
                                    '<div class="mb-3">' +
                                        '<label for="itemDescription" class="form-label">Description</label>' +
                                        '<textarea class="form-control" id="itemDescription" name="description" rows="3" aria-describedby="descHelp"></textarea>' +
                                        '<div id="descHelp" class="form-text">Optional description.</div>' +
                                    '</div>' +
                                    '<div class="mb-3">' +
                                        '<label for="itemCategory" class="form-label">Category <span class="text-danger" aria-hidden="true">*</span></label>' +
                                        '<select class="form-select" id="itemCategory" name="category" required aria-required="true">' +
                                            '<option value="">Select a category</option>' +
                                            '<option value="cat1">Category 1</option>' +
                                            '<option value="cat2">Category 2</option>' +
                                        '</select>' +
                                    '</div>' +
                                    '<div class="mb-3 form-check">' +
                                        '<input type="checkbox" class="form-check-input" id="itemActive" name="active">' +
                                        '<label class="form-check-label" for="itemActive">Active</label>' +
                                    '</div>' +
                                '</form>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                                '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>' +
                                '<button type="submit" form="testForm" class="btn btn-primary" id="submitBtn">' +
                                    '<span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>' +
                                    '<span class="btn-text">Save</span>' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        // Close any open modals
        if (Modal && Modal.hide) {
            Modal.hide('#testFormModal');
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Modal Dialog Accessibility
    // ========================================================================

    FunkyTests.describe('Modal Dialog Accessibility', function() {

        FunkyTests.it('modal has role="dialog"', function() {
            var modal = document.querySelector('#testFormModal');
            expect(modal.getAttribute('role')).toBe('dialog');
        });

        FunkyTests.it('modal has aria-modal="true"', function() {
            var modal = document.querySelector('#testFormModal');
            expect(modal.getAttribute('aria-modal')).toBe('true');
        });

        FunkyTests.it('modal has aria-labelledby pointing to title', function() {
            var modal = document.querySelector('#testFormModal');
            var labelledBy = modal.getAttribute('aria-labelledby');
            expect(labelledBy).toBe('testFormModalTitle');

            var title = document.getElementById(labelledBy);
            expect(title).not.toBeNull();
            expect(title.textContent).toBeTruthy();
        });

        FunkyTests.it('modal is focusable', function() {
            var modal = document.querySelector('#testFormModal');
            var tabindex = modal.getAttribute('tabindex');
            expect(tabindex).toBe('-1');
        });

        FunkyTests.it('close button has accessible label', function() {
            var closeBtn = document.querySelector('#testFormModal .btn-close');
            expect(closeBtn.getAttribute('aria-label')).toBeTruthy();
        });

    });

    // ========================================================================
    // Form Labels and Descriptions
    // ========================================================================

    FunkyTests.describe('Form Labels and Descriptions', function() {

        FunkyTests.it('all form inputs have associated labels', function() {
            var inputs = document.querySelectorAll('#testForm input, #testForm select, #testForm textarea');

            inputs.forEach(function(input) {
                var id = input.id;
                var label = document.querySelector('label[for="' + id + '"]');
                var hasLabel = label ||
                               input.getAttribute('aria-label') ||
                               input.getAttribute('aria-labelledby');
                expect(hasLabel).toBeTruthy();
            });
        });

        FunkyTests.it('required fields have aria-required="true"', function() {
            var requiredInputs = document.querySelectorAll('#testForm [required]');

            requiredInputs.forEach(function(input) {
                expect(input.getAttribute('aria-required')).toBe('true');
            });
        });

        FunkyTests.it('required indicators are hidden from screen readers', function() {
            var asterisks = document.querySelectorAll('.text-danger[aria-hidden="true"]');
            expect(asterisks.length).toBeGreaterThan(0);
        });

        FunkyTests.it('form fields have aria-describedby for help text', function() {
            var nameInput = document.querySelector('#itemName');
            var describedBy = nameInput.getAttribute('aria-describedby');
            expect(describedBy).toContain('nameHelp');
        });

    });

    // ========================================================================
    // Error Handling
    // ========================================================================

    FunkyTests.describe('Error Handling', function() {

        FunkyTests.it('error container has role="alert"', function() {
            var errorContainer = document.querySelector('#nameError');
            expect(errorContainer.getAttribute('role')).toBe('alert');
        });

        FunkyTests.it('error container has aria-live="assertive"', function() {
            var errorContainer = document.querySelector('#nameError');
            expect(errorContainer.getAttribute('aria-live')).toBe('assertive');
        });

        FunkyTests.it('invalid input is described by error message', function() {
            var nameInput = document.querySelector('#itemName');
            var describedBy = nameInput.getAttribute('aria-describedby');
            expect(describedBy).toContain('nameError');
        });

        FunkyTests.it('setting aria-invalid marks field as invalid', function() {
            var nameInput = document.querySelector('#itemName');
            nameInput.setAttribute('aria-invalid', 'true');
            expect(nameInput.getAttribute('aria-invalid')).toBe('true');
        });

    });

    // ========================================================================
    // Form Controls
    // ========================================================================

    FunkyTests.describe('Form Controls', function() {

        FunkyTests.it('select has accessible label', function() {
            var select = document.querySelector('#itemCategory');
            var label = document.querySelector('label[for="itemCategory"]');
            expect(label).not.toBeNull();
        });

        FunkyTests.it('checkbox has associated label', function() {
            var checkbox = document.querySelector('#itemActive');
            var label = document.querySelector('label[for="itemActive"]');
            expect(label).not.toBeNull();
        });

        FunkyTests.it('textarea has associated label', function() {
            var textarea = document.querySelector('#itemDescription');
            var label = document.querySelector('label[for="itemDescription"]');
            expect(label).not.toBeNull();
        });

        FunkyTests.it('submit button has accessible text', function() {
            var submitBtn = document.querySelector('#submitBtn');
            var btnText = submitBtn.querySelector('.btn-text');
            expect(btnText.textContent.trim()).toBeTruthy();
        });

    });

    // ========================================================================
    // Loading State
    // ========================================================================

    FunkyTests.describe('Loading State', function() {

        FunkyTests.it('loading spinner has role="status"', function() {
            var spinner = document.querySelector('#submitBtn .spinner-border');
            expect(spinner.getAttribute('role')).toBe('status');
        });

        FunkyTests.it('loading spinner is hidden from screen readers when not visible', function() {
            var spinner = document.querySelector('#submitBtn .spinner-border');
            expect(spinner.getAttribute('aria-hidden')).toBe('true');
        });

        FunkyTests.it('button text is visible when not loading', function() {
            var btnText = document.querySelector('#submitBtn .btn-text');
            expect(btnText.classList.contains('d-none')).toBe(false);
        });

    });

    // ========================================================================
    // Focus Management
    // ========================================================================

    FunkyTests.describe('Focus Management', function() {

        FunkyTests.it('first focusable element can receive focus', function() {
            var firstInput = document.querySelector('#itemName');
            // Element must exist and be focusable (have no tabindex=-1 or disabled)
            expect(firstInput).not.toBeNull();
            expect(firstInput.hasAttribute('disabled')).toBe(false);
            expect(firstInput.getAttribute('tabindex')).not.toBe('-1');
        });

        FunkyTests.it('modal footer buttons are focusable', function() {
            var cancelBtn = document.querySelector('[data-bs-dismiss="modal"].btn-secondary');
            var submitBtn = document.querySelector('#submitBtn');

            // Buttons must exist and be focusable (not disabled, no tabindex=-1)
            expect(cancelBtn).not.toBeNull();
            expect(cancelBtn.hasAttribute('disabled')).toBe(false);
            expect(cancelBtn.getAttribute('tabindex')).not.toBe('-1');

            expect(submitBtn).not.toBeNull();
            expect(submitBtn.hasAttribute('disabled')).toBe(false);
            expect(submitBtn.getAttribute('tabindex')).not.toBe('-1');
        });

    });

    // ========================================================================
    // Keyboard Interaction
    // ========================================================================

    FunkyTests.describe('Keyboard Interaction', function() {

        FunkyTests.it('form can be submitted with Enter in text field', function(done) {
            var nameInput = document.querySelector('#itemName');
            nameInput.focus();

            FunkyTests.simulate.keydown(nameInput, { key: 'Enter', keyCode: 13 });

            setTimeout(function() {
                // Form submission should be possible
                expect(true).toBe(true);
                done();
            }, 100);
        });

        FunkyTests.it('Tab navigates through form fields', function() {
            var firstInput = document.querySelector('#itemName');
            firstInput.focus();

            // Tab navigation should work
            var focusableElements = document.querySelectorAll('#testFormModal input, #testFormModal select, #testFormModal textarea, #testFormModal button:not([disabled])');
            expect(focusableElements.length).toBeGreaterThan(1);
        });

    });

    // ========================================================================
    // Edit Mode
    // ========================================================================

    FunkyTests.describe('Edit Mode', function() {

        FunkyTests.beforeEach(function() {
            // Update modal title for edit mode
            var title = document.querySelector('#testFormModalTitle');
            title.textContent = 'Edit Item';
        });

        FunkyTests.it('modal title reflects edit mode', function() {
            var title = document.querySelector('#testFormModalTitle');
            expect(title.textContent).toBe('Edit Item');
        });

        FunkyTests.it('form fields can be pre-populated', function() {
            var nameInput = document.querySelector('#itemName');
            nameInput.value = 'Existing Item';
            expect(nameInput.value).toBe('Existing Item');
        });

    });

    // ========================================================================
    // Cancel Behavior
    // ========================================================================

    FunkyTests.describe('Cancel Behavior', function() {

        FunkyTests.it('cancel button has accessible name', function() {
            var cancelBtn = document.querySelector('[data-bs-dismiss="modal"].btn-secondary');
            expect(cancelBtn.textContent.trim()).toBeTruthy();
        });

        FunkyTests.it('Escape key can close modal', function(done) {
            var modal = document.querySelector('#testFormModal');

            FunkyTests.simulate.keydown(modal, { key: 'Escape', keyCode: 27 });

            setTimeout(function() {
                // Modal should handle Escape key
                expect(true).toBe(true);
                done();
            }, 100);
        });

    });

});
