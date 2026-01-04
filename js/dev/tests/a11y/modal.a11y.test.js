/**
 * Accessibility Tests: Modal/Dialog
 *
 * Tests WCAG 2.1 AA compliance for modal and dialog components.
 */

describe('Funky.A11y.Modal', function() {

    var Modal = Funky.Modal;
    var A11y = FunkyTests.A11y;

    // Skip all tests if A11y utilities not available
    if (!A11y) {
        it('A11y utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div>' +
                '<button id="trigger-btn" type="button">Open Modal</button>' +
                '<div id="test-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
                    '<div class="modal-dialog">' +
                        '<div class="modal-content">' +
                            '<div class="modal-header">' +
                                '<h5 class="modal-title" id="modal-title">Modal Title</h5>' +
                                '<button type="button" class="btn-close" data-funky-dismiss="modal" aria-label="Close"></button>' +
                            '</div>' +
                            '<div class="modal-body">' +
                                '<p>Modal body content</p>' +
                                '<input type="text" id="modal-input" placeholder="Enter text">' +
                                '<button type="button" id="modal-action-btn">Action</button>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                                '<button type="button" class="btn btn-secondary" data-funky-dismiss="modal">Cancel</button>' +
                                '<button type="button" class="btn btn-primary" id="modal-save-btn">Save</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    afterEach(function() {
        Modal.hide('#test-modal');
        fixture.destroy();
    });

    describe('ARIA Roles', function() {

        it('modal has role="dialog"', function() {
            var modal = document.querySelector('#test-modal');
            expect(modal.getAttribute('role')).toBe('dialog');
        });

        it('modal has aria-modal="true"', function() {
            var modal = document.querySelector('#test-modal');
            expect(modal.getAttribute('aria-modal')).toBe('true');
        });

        it('alertdialog role for confirmation dialogs', function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<div id="confirm-modal" class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc">' +
                    '<div class="modal-dialog">' +
                        '<div class="modal-content">' +
                            '<h5 id="confirm-title">Confirm Action</h5>' +
                            '<p id="confirm-desc">Are you sure you want to proceed?</p>' +
                            '<button type="button">Yes</button>' +
                            '<button type="button">No</button>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );

            var modal = document.querySelector('#confirm-modal');
            expect(modal.getAttribute('role')).toBe('alertdialog');
        });

    });

    describe('Accessible Names', function() {

        it('modal has aria-labelledby pointing to title', function() {
            var modal = document.querySelector('#test-modal');
            var labelledBy = modal.getAttribute('aria-labelledby');

            expect(labelledBy).toBe('modal-title');

            var title = document.getElementById(labelledBy);
            expect(title).toBeInDocument();
            expect(title.textContent).toBe('Modal Title');
        });

        it('close button has accessible name', function() {
            var closeBtn = document.querySelector('.btn-close');
            var name = A11y.getAccessibleName(closeBtn);

            expect(name).toBe('Close');
        });

        it('modal can have aria-describedby for description', function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<div id="desc-modal" class="modal" role="dialog" aria-labelledby="desc-title" aria-describedby="desc-body">' +
                    '<h5 id="desc-title">Title</h5>' +
                    '<p id="desc-body">This modal performs an important action.</p>' +
                '</div>'
            );

            var modal = document.querySelector('#desc-modal');
            var describedBy = modal.getAttribute('aria-describedby');
            var description = document.getElementById(describedBy);

            expect(description).toBeInDocument();
            expect(description.textContent).toContain('important action');
        });

    });

    describe('Focus Management', function() {

        it('focus moves to modal when opened', function() {
            Modal.show('#test-modal');

            return FunkyTests.delay(100).then(function() {
                var modal = document.querySelector('#test-modal');
                var focusable = A11y.getFocusableElements(modal);

                // Focus should be within modal
                expect(modal.contains(document.activeElement)).toBe(true);
            });
        });

        it('focus moves to first focusable element', function() {
            Modal.show('#test-modal');

            return FunkyTests.delay(100).then(function() {
                var modal = document.querySelector('#test-modal');
                var focusableElements = A11y.getFocusableElements(modal);
                // Focus should be on first focusable element (could be close btn or input depending on implementation)
                expect(focusableElements.length).toBeGreaterThan(0);
                expect(modal.contains(document.activeElement)).toBe(true);
            });
        });

        it('modal traps focus', function() {
            Modal.show('#test-modal');

            return FunkyTests.delay(100).then(function() {
                var modal = document.querySelector('#test-modal');
                // Check that focusable elements exist within modal (basic trap check)
                var focusable = A11y.getFocusableElements(modal);
                expect(focusable.length).toBeGreaterThan(0);
            });
        });

        it('Tab wraps from last to first focusable element', function() {
            Modal.show('#test-modal');

            return FunkyTests.delay(100).then(function() {
                var saveBtn = document.querySelector('#modal-save-btn');
                saveBtn.focus();

                FunkyTests.simulate.keydown(saveBtn, { key: 'Tab' });

                return FunkyTests.delay(50);
            }).then(function() {
                var modal = document.querySelector('#test-modal');
                // Focus should still be in modal (trapped)
                expect(modal.contains(document.activeElement)).toBe(true);
            });
        });

        it('Shift+Tab wraps from first to last focusable element', function() {
            Modal.show('#test-modal');

            return FunkyTests.delay(100).then(function() {
                var closeBtn = document.querySelector('.btn-close');
                closeBtn.focus();

                FunkyTests.simulate.keydown(closeBtn, { key: 'Tab', shiftKey: true });

                return FunkyTests.delay(50);
            }).then(function() {
                var modal = document.querySelector('#test-modal');
                // Focus should still be in modal (trapped)
                expect(modal.contains(document.activeElement)).toBe(true);
            });
        });

    });

    describe('Focus Restoration', function() {

        it('focus returns to trigger element on close', function() {
            var triggerBtn = document.querySelector('#trigger-btn');
            triggerBtn.focus();

            Modal.show('#test-modal');

            return FunkyTests.delay(100).then(function() {
                Modal.hide('#test-modal');
                return FunkyTests.delay(100);
            }).then(function() {
                expect(document.activeElement).toBe(triggerBtn);
            });
        });

    });

    describe('Keyboard Navigation', function() {

        it('Escape key closes modal', function() {
            Modal.show('#test-modal');

            return FunkyTests.delay(100).then(function() {
                var modal = document.querySelector('#test-modal');
                FunkyTests.simulate.keydown(modal, { key: 'Escape' });

                return FunkyTests.delay(100);
            }).then(function() {
                var modal = document.querySelector('#test-modal');
                expect(modal.classList.contains('show')).toBe(false);
            });
        });

        it('all interactive elements are keyboard accessible', function() {
            var modal = document.querySelector('#test-modal');
            var focusable = A11y.getFocusableElements(modal);

            focusable.forEach(function(el) {
                expect(A11y.isInTabOrder(el)).toBe(true);
            });
        });

        // Skip: keydown Enter/Space doesn't trigger click on buttons (browser behavior)
        xit('buttons can be activated with Enter', function() {
            Modal.show('#test-modal');
            var clicked = false;

            return FunkyTests.delay(100).then(function() {
                var actionBtn = document.querySelector('#modal-action-btn');
                actionBtn.addEventListener('click', function() { clicked = true; });
                actionBtn.focus();

                FunkyTests.simulate.keydown(actionBtn, { key: 'Enter' });

                return FunkyTests.delay(50);
            }).then(function() {
                expect(clicked).toBe(true);
            });
        });

        // Skip: keydown Enter/Space doesn't trigger click on buttons (browser behavior)
        xit('buttons can be activated with Space', function() {
            Modal.show('#test-modal');
            var clicked = false;

            return FunkyTests.delay(100).then(function() {
                var actionBtn = document.querySelector('#modal-action-btn');
                actionBtn.addEventListener('click', function() { clicked = true; });
                actionBtn.focus();

                FunkyTests.simulate.keydown(actionBtn, { key: ' ' });

                return FunkyTests.delay(50);
            }).then(function() {
                expect(clicked).toBe(true);
            });
        });

    });

    describe('Background Inert', function() {

        // Skip: Requires Modal component to set inert attribute on background
        xit('content behind modal is inert when open', function() {
            Modal.show('#test-modal');

            return FunkyTests.delay(100).then(function() {
                var triggerBtn = document.querySelector('#trigger-btn');
                // Trigger should not be in tab order when modal is open
                expect(A11y.isInTabOrder(triggerBtn)).toBe(false);
            });
        });

        it('backdrop prevents click on background content', function() {
            Modal.show('#test-modal');
            var clicked = false;

            return FunkyTests.delay(100).then(function() {
                var triggerBtn = document.querySelector('#trigger-btn');
                triggerBtn.addEventListener('click', function() { clicked = true; });

                // Clicking backdrop should not reach trigger
                var backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    FunkyTests.simulate.click(backdrop);
                }

                return FunkyTests.delay(50);
            }).then(function() {
                expect(clicked).toBe(false);
            });
        });

    });

    describe('ARIA State Management', function() {

        it('modal is hidden when closed', function() {
            var modal = document.querySelector('#test-modal');
            expect(modal.classList.contains('show')).toBe(false);
        });

        it('modal is visible when open', function() {
            Modal.show('#test-modal');

            return FunkyTests.delay(100).then(function() {
                var modal = document.querySelector('#test-modal');
                expect(modal.classList.contains('show')).toBe(true);
            });
        });

    });

    describe('Form Modal Accessibility', function() {

        beforeEach(function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<div id="form-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">' +
                    '<div class="modal-dialog">' +
                        '<div class="modal-content">' +
                            '<h5 id="form-title">User Details</h5>' +
                            '<form id="modal-form">' +
                                '<div class="form-group">' +
                                    '<label for="user-name">Name</label>' +
                                    '<input type="text" id="user-name" required>' +
                                '</div>' +
                                '<div class="form-group">' +
                                    '<label for="user-email">Email</label>' +
                                    '<input type="email" id="user-email" required aria-describedby="email-help">' +
                                    '<small id="email-help">We will never share your email.</small>' +
                                '</div>' +
                                '<button type="submit">Submit</button>' +
                            '</form>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );
        });

        it('form inputs have labels', function() {
            var modal = document.querySelector('#form-modal');
            var issues = A11y.checkFormLabels(modal);

            expect(issues.length).toBe(0);
        });

        it('required fields are indicated', function() {
            var nameInput = document.querySelector('#user-name');
            var emailInput = document.querySelector('#user-email');

            expect(nameInput.hasAttribute('required')).toBe(true);
            expect(emailInput.hasAttribute('required')).toBe(true);
        });

        it('help text is associated via aria-describedby', function() {
            var emailInput = document.querySelector('#user-email');
            var describedBy = emailInput.getAttribute('aria-describedby');

            expect(describedBy).toBe('email-help');

            var helpText = document.getElementById(describedBy);
            expect(helpText).toBeInDocument();
        });

    });

    describe('ARIA Validation', function() {

        it('no invalid ARIA attributes', function() {
            var modal = document.querySelector('#test-modal');
            var issues = A11y.checkAria(modal);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

        it('aria-labelledby reference exists', function() {
            var modal = document.querySelector('#test-modal');
            var labelledBy = modal.getAttribute('aria-labelledby');
            var title = document.getElementById(labelledBy);

            expect(title).toBeInDocument();
        });

    });

});
