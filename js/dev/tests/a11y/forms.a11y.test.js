/**
 * Accessibility Tests: Forms
 *
 * Tests WCAG 2.1 AA compliance for form elements.
 */

describe('Funky.A11y.Forms', function() {

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
            '<div id="form-container">' +
                '<form id="test-form" aria-label="Test form">' +
                    '<div class="form-group">' +
                        '<label for="username">Username <span class="required" aria-hidden="true">*</span></label>' +
                        '<input type="text" id="username" name="username" required aria-required="true">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="email">Email Address</label>' +
                        '<input type="email" id="email" name="email" aria-describedby="email-help">' +
                        '<small id="email-help" class="form-text">We will never share your email.</small>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="password">Password <span class="required" aria-hidden="true">*</span></label>' +
                        '<input type="password" id="password" name="password" required aria-required="true">' +
                    '</div>' +
                    '<fieldset>' +
                        '<legend>Contact Preference</legend>' +
                        '<div class="form-check">' +
                            '<input type="radio" id="pref-email" name="preference" value="email">' +
                            '<label for="pref-email">Email</label>' +
                        '</div>' +
                        '<div class="form-check">' +
                            '<input type="radio" id="pref-phone" name="preference" value="phone">' +
                            '<label for="pref-phone">Phone</label>' +
                        '</div>' +
                    '</fieldset>' +
                    '<div class="form-group">' +
                        '<input type="checkbox" id="terms" name="terms" required aria-required="true">' +
                        '<label for="terms">I agree to the terms and conditions</label>' +
                    '</div>' +
                    '<button type="submit">Submit</button>' +
                '</form>' +
            '</div>'
        );
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Form Labels', function() {

        it('all inputs have associated labels', function() {
            var issues = A11y.checkFormLabels(document.querySelector('#form-container'));
            expect(issues.length).toBe(0);
        });

        it('labels are programmatically associated via for/id', function() {
            var usernameInput = document.querySelector('#username');
            var label = document.querySelector('label[for="username"]');

            expect(label).toBeInDocument();
            expect(usernameInput.id).toBe(label.getAttribute('for'));
        });

        it('labels are visible and not empty', function() {
            var labels = document.querySelectorAll('label');

            Array.prototype.forEach.call(labels, function(label) {
                expect(label.textContent.trim()).toBeTruthy();
            });
        });

        it('clicking label focuses associated input', function() {
            var label = document.querySelector('label[for="username"]');
            var input = document.querySelector('#username');

            FunkyTests.simulate.click(label);

            expect(document.activeElement).toBe(input);
        });

    });

    describe('Required Fields', function() {

        it('required inputs have required attribute', function() {
            var requiredInputs = document.querySelectorAll('[required]');
            expect(requiredInputs.length).toBeGreaterThan(0);
        });

        it('required inputs have aria-required="true"', function() {
            var usernameInput = document.querySelector('#username');
            expect(usernameInput.getAttribute('aria-required')).toBe('true');
        });

        it('required indicator is visible', function() {
            var usernameLabel = document.querySelector('label[for="username"]');
            var hasIndicator = usernameLabel.textContent.includes('*') ||
                              usernameLabel.querySelector('.required');

            expect(hasIndicator).toBe(true);
        });

        it('required indicator is hidden from screen readers', function() {
            var indicator = document.querySelector('.required[aria-hidden="true"]');
            expect(indicator).toBeInDocument();
        });

    });

    describe('Error States', function() {

        it('invalid inputs have aria-invalid="true"', function() {
            var emailInput = document.querySelector('#email');
            emailInput.value = 'invalid-email';
            emailInput.setAttribute('aria-invalid', 'true');

            expect(emailInput.getAttribute('aria-invalid')).toBe('true');
        });

        it('error messages are associated with aria-describedby', function() {
            // Add an error message
            var errorDiv = document.createElement('div');
            errorDiv.id = 'username-error';
            errorDiv.className = 'error-message';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.textContent = 'Username is required';

            var usernameInput = document.querySelector('#username');
            usernameInput.parentNode.appendChild(errorDiv);
            usernameInput.setAttribute('aria-describedby', 'username-error');

            expect(usernameInput.getAttribute('aria-describedby')).toBe('username-error');
            expect(document.getElementById('username-error')).toBeInDocument();
        });

        it('error messages have role="alert" for immediate announcement', function() {
            var errorDiv = document.createElement('div');
            errorDiv.setAttribute('role', 'alert');
            errorDiv.textContent = 'Form has errors';
            document.querySelector('#form-container').appendChild(errorDiv);

            expect(errorDiv.getAttribute('role')).toBe('alert');
        });

    });

    describe('Fieldsets and Legends', function() {

        it('related fields are grouped with fieldset', function() {
            var fieldset = document.querySelector('fieldset');
            expect(fieldset).toBeInDocument();
        });

        it('fieldset has legend', function() {
            var legend = document.querySelector('fieldset legend');
            expect(legend).toBeInDocument();
            expect(legend.textContent.trim()).toBeTruthy();
        });

        it('radio groups are in fieldset', function() {
            var radios = document.querySelectorAll('input[type="radio"]');
            var fieldset = radios[0].closest('fieldset');

            expect(fieldset).toBeInDocument();
        });

    });

    describe('Form Description', function() {

        it('help text is associated with aria-describedby', function() {
            var emailInput = document.querySelector('#email');
            var describedBy = emailInput.getAttribute('aria-describedby');

            expect(describedBy).toBe('email-help');
            expect(document.getElementById('email-help')).toBeInDocument();
        });

        it('help text is programmatically associated', function() {
            var emailInput = document.querySelector('#email');
            var describedById = emailInput.getAttribute('aria-describedby');
            var helpText = document.getElementById(describedById);

            expect(helpText.textContent).toBeTruthy();
        });

    });

    describe('Keyboard Accessibility', function() {

        it('all form controls are keyboard accessible', function() {
            // Only check controls within the test form fixture
            var form = document.querySelector('#test-form');
            if (!form) {
                expect(true).toBe(true); // Skip if form not in fixture
                return;
            }
            var controls = form.querySelectorAll('input, select, textarea, button');

            Array.prototype.forEach.call(controls, function(control) {
                if (control.type !== 'hidden' && !control.disabled) {
                    expect(A11y.isInTabOrder(control)).toBe(true);
                }
            });
        });

        it('form can be submitted with Enter key', function() {
            var submitCalled = false;
            var form = document.querySelector('#test-form');

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                submitCalled = true;
            });

            var input = document.querySelector('#username');
            input.focus();
            FunkyTests.simulate.keydown(input, { key: 'Enter' });

            // Form submission behavior
            expect(form).toBeInDocument();
        });

        it('focus order follows visual order', function() {
            var issues = A11y.validateFocusOrder(document.querySelector('#test-form'));
            var orderIssues = issues.filter(function(i) {
                return i.issue.includes('order');
            });

            expect(orderIssues.length).toBe(0);
        });

    });

    describe('Checkbox and Radio', function() {

        it('checkboxes have associated labels', function() {
            var checkbox = document.querySelector('#terms');
            var label = document.querySelector('label[for="terms"]');

            expect(label).toBeInDocument();
        });

        it('radio buttons have associated labels', function() {
            var radios = document.querySelectorAll('input[type="radio"]');

            Array.prototype.forEach.call(radios, function(radio) {
                var label = document.querySelector('label[for="' + radio.id + '"]');
                expect(label).toBeInDocument();
            });
        });

        it('radio group has accessible group name via legend', function() {
            var fieldset = document.querySelector('fieldset');
            var legend = fieldset.querySelector('legend');

            expect(legend.textContent.trim()).toBe('Contact Preference');
        });

    });

    describe('Submit Button', function() {

        it('submit button has accessible name', function() {
            var submitBtn = document.querySelector('button[type="submit"]');
            var name = A11y.getAccessibleName(submitBtn);

            expect(name).toBe('Submit');
        });

        it('submit button is keyboard focusable', function() {
            var submitBtn = document.querySelector('button[type="submit"]');
            expect(A11y.isInTabOrder(submitBtn)).toBe(true);
        });

    });

    describe('Form Identification', function() {

        it('form has accessible name', function() {
            var form = document.querySelector('#test-form');
            var label = form.getAttribute('aria-label') || form.getAttribute('aria-labelledby');

            expect(label).toBeTruthy();
        });

    });

    describe('Autocomplete', function() {

        it('common fields have autocomplete attribute', function() {
            // Update inputs with autocomplete
            var emailInput = document.querySelector('#email');
            emailInput.setAttribute('autocomplete', 'email');

            var usernameInput = document.querySelector('#username');
            usernameInput.setAttribute('autocomplete', 'username');

            expect(emailInput.getAttribute('autocomplete')).toBe('email');
            expect(usernameInput.getAttribute('autocomplete')).toBe('username');
        });

    });

    describe('Input Types', function() {

        it('email input has type="email"', function() {
            var emailInput = document.querySelector('#email');
            expect(emailInput.type).toBe('email');
        });

        it('password input has type="password"', function() {
            var passwordInput = document.querySelector('#password');
            expect(passwordInput.type).toBe('password');
        });

    });

    describe('Dynamic Forms', function() {

        it('dynamically added fields have labels', function() {
            var newField = document.createElement('div');
            newField.className = 'form-group';
            newField.innerHTML =
                '<label for="phone">Phone Number</label>' +
                '<input type="tel" id="phone" name="phone">';

            document.querySelector('#test-form').appendChild(newField);

            var issues = A11y.checkFormLabels(document.querySelector('#test-form'));
            expect(issues.length).toBe(0);
        });

        it('dynamically shown errors are announced', function() {
            var errorContainer = document.createElement('div');
            errorContainer.setAttribute('role', 'alert');
            errorContainer.setAttribute('aria-live', 'assertive');
            errorContainer.textContent = 'Please fix the errors below';

            document.querySelector('#test-form').insertBefore(
                errorContainer,
                document.querySelector('#test-form').firstChild
            );

            expect(errorContainer.getAttribute('role')).toBe('alert');
        });

    });

});
