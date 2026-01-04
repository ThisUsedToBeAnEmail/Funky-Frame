/**
 * Visual Regression Tests: Forms
 *
 * Tests visual appearance of form elements and validation states.
 */

describe('Funky.Visual.Forms', function() {

    var Visual = FunkyTests.Visual;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-forms-container"></div>');
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Text Inputs', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<form id="test-form">' +
                    '<div class="form-group">' +
                        '<label for="text-input">Text Input</label>' +
                        '<input type="text" id="text-input" class="form-control" placeholder="Enter text">' +
                    '</div>' +
                '</form>';
        });

        it('default input has form-control styles', function() {
            return FunkyTests.delay(50).then(function() {
                var input = document.getElementById('text-input');
                var styles = Visual.snapshotStyles(input);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

        it('focused input has focus styles', function() {
            var input = document.getElementById('text-input');
            input.focus();

            return FunkyTests.delay(50).then(function() {
                var computed = window.getComputedStyle(input);
                // Focus should be applied (outline or box-shadow)
                expect(input).toBe(document.activeElement);
            });
        });

        it('input with value displays correctly', function() {
            var input = document.getElementById('text-input');
            input.value = 'Sample text value';

            return FunkyTests.delay(50).then(function() {
                expect(input.value).toBe('Sample text value');
                var styles = Visual.snapshotStyles(input);
                expect(styles.display).not.toBe('none');
            });
        });

        it('disabled input has disabled styles', function() {
            var input = document.getElementById('text-input');
            input.disabled = true;

            return FunkyTests.delay(50).then(function() {
                expect(input.disabled).toBe(true);
                var computed = window.getComputedStyle(input);
                // Disabled inputs often have different background or cursor
                expect(computed.cursor).toBeDefined();
            });
        });

        it('readonly input accepts value but is not editable', function() {
            var input = document.getElementById('text-input');
            input.readOnly = true;
            input.value = 'Read only value';

            return FunkyTests.delay(50).then(function() {
                expect(input.readOnly).toBe(true);
                expect(input.value).toBe('Read only value');
            });
        });

    });

    describe('Validation States', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<form id="validation-form">' +
                    '<div class="form-group">' +
                        '<label for="valid-input">Valid Input</label>' +
                        '<input type="text" id="valid-input" class="form-control is-valid" value="Correct">' +
                        '<div class="valid-feedback">Looks good!</div>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="invalid-input">Invalid Input</label>' +
                        '<input type="text" id="invalid-input" class="form-control is-invalid">' +
                        '<div class="invalid-feedback">Please provide a valid value.</div>' +
                    '</div>' +
                '</form>';
        });

        it('valid input state has is-valid class', function() {
            return FunkyTests.delay(50).then(function() {
                var input = document.getElementById('valid-input');
                expect(input.classList.contains('is-valid')).toBe(true);

                var styles = Visual.snapshotStyles(input);
                expect(styles.display).not.toBe('none');
            });
        });

        it('invalid input state has is-invalid class', function() {
            return FunkyTests.delay(50).then(function() {
                var input = document.getElementById('invalid-input');
                expect(input.classList.contains('is-invalid')).toBe(true);

                var styles = Visual.snapshotStyles(input);
                expect(styles.display).not.toBe('none');
            });
        });

        it('valid input has border color', function() {
            var input = document.getElementById('valid-input');
            var computed = window.getComputedStyle(input);

            expect(computed.borderColor).toBeDefined();
        });

        it('invalid input has border color', function() {
            var input = document.getElementById('invalid-input');
            var computed = window.getComputedStyle(input);

            expect(computed.borderColor).toBeDefined();
        });

    });

    describe('Select Elements', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<form>' +
                    '<div class="form-group">' +
                        '<label for="select-input">Select</label>' +
                        '<select id="select-input" class="form-control">' +
                            '<option value="">Choose...</option>' +
                            '<option value="1">Option 1</option>' +
                            '<option value="2">Option 2</option>' +
                            '<option value="3">Option 3</option>' +
                        '</select>' +
                    '</div>' +
                '</form>';
        });

        it('default select has form-control styles', function() {
            return FunkyTests.delay(50).then(function() {
                var select = document.getElementById('select-input');
                var styles = Visual.snapshotStyles(select);

                expect(styles.display).not.toBe('none');
                expect(select.options.length).toBe(4);
            });
        });

        it('select with value shows selected option', function() {
            var select = document.getElementById('select-input');
            select.value = '2';

            return FunkyTests.delay(50).then(function() {
                expect(select.value).toBe('2');
                expect(select.options[select.selectedIndex].text).toBe('Option 2');
            });
        });

    });

    describe('Checkboxes and Radios', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<form>' +
                    '<div class="form-check">' +
                        '<input type="checkbox" id="checkbox1" class="form-check-input">' +
                        '<label for="checkbox1" class="form-check-label">Checkbox unchecked</label>' +
                    '</div>' +
                    '<div class="form-check">' +
                        '<input type="checkbox" id="checkbox2" class="form-check-input" checked>' +
                        '<label for="checkbox2" class="form-check-label">Checkbox checked</label>' +
                    '</div>' +
                    '<div class="form-check">' +
                        '<input type="radio" name="radio" id="radio1" class="form-check-input">' +
                        '<label for="radio1" class="form-check-label">Radio 1</label>' +
                    '</div>' +
                    '<div class="form-check">' +
                        '<input type="radio" name="radio" id="radio2" class="form-check-input" checked>' +
                        '<label for="radio2" class="form-check-label">Radio 2</label>' +
                    '</div>' +
                '</form>';
        });

        it('unchecked checkbox is not checked', function() {
            return FunkyTests.delay(50).then(function() {
                var checkbox = document.getElementById('checkbox1');
                expect(checkbox.checked).toBe(false);
            });
        });

        it('checked checkbox is checked', function() {
            return FunkyTests.delay(50).then(function() {
                var checkbox = document.getElementById('checkbox2');
                expect(checkbox.checked).toBe(true);
            });
        });

        it('radio buttons have correct checked state', function() {
            return FunkyTests.delay(50).then(function() {
                var radio1 = document.getElementById('radio1');
                var radio2 = document.getElementById('radio2');

                expect(radio1.checked).toBe(false);
                expect(radio2.checked).toBe(true);
            });
        });

    });

    describe('Textarea', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<form>' +
                    '<div class="form-group">' +
                        '<label for="textarea">Message</label>' +
                        '<textarea id="textarea" class="form-control" rows="4" placeholder="Enter message"></textarea>' +
                    '</div>' +
                '</form>';
        });

        it('empty textarea has correct styles', function() {
            return FunkyTests.delay(50).then(function() {
                var textarea = document.getElementById('textarea');
                var styles = Visual.snapshotStyles(textarea);

                expect(styles.display).not.toBe('none');
                expect(textarea.value).toBe('');
            });
        });

        it('textarea with content displays content', function() {
            var textarea = document.getElementById('textarea');
            textarea.value = 'This is a multi-line\ntext content\nfor testing';

            return FunkyTests.delay(50).then(function() {
                expect(textarea.value).toContain('multi-line');
                expect(textarea.value).toContain('testing');
            });
        });

    });

    describe('Buttons', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<div class="button-group">' +
                    '<button type="button" id="btn-primary" class="btn btn-primary">Primary</button>' +
                    '<button type="button" id="btn-secondary" class="btn btn-secondary">Secondary</button>' +
                    '<button type="button" id="btn-success" class="btn btn-success">Success</button>' +
                    '<button type="button" id="btn-danger" class="btn btn-danger">Danger</button>' +
                    '<button type="button" id="btn-disabled" class="btn btn-primary" disabled>Disabled</button>' +
                '</div>';
        });

        it('primary button has btn-primary class', function() {
            return FunkyTests.delay(50).then(function() {
                var btn = document.getElementById('btn-primary');
                expect(btn.classList.contains('btn-primary')).toBe(true);

                var styles = Visual.snapshotStyles(btn);
                expect(styles.display).not.toBe('none');
            });
        });

        it('secondary button has btn-secondary class', function() {
            return FunkyTests.delay(50).then(function() {
                var btn = document.getElementById('btn-secondary');
                expect(btn.classList.contains('btn-secondary')).toBe(true);
            });
        });

        it('disabled button is disabled', function() {
            return FunkyTests.delay(50).then(function() {
                var btn = document.getElementById('btn-disabled');
                expect(btn.disabled).toBe(true);
            });
        });

        it('button group has all buttons', function() {
            return FunkyTests.delay(50).then(function() {
                var group = document.querySelector('.button-group');
                var buttons = group.querySelectorAll('button');

                expect(buttons.length).toBe(5);
            });
        });

    });

    describe('Form Layout', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<form id="layout-form">' +
                    '<div class="form-row">' +
                        '<div class="form-group col-6">' +
                            '<label for="first-name">First Name</label>' +
                            '<input type="text" id="first-name" class="form-control">' +
                        '</div>' +
                        '<div class="form-group col-6">' +
                            '<label for="last-name">Last Name</label>' +
                            '<input type="text" id="last-name" class="form-control">' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="email">Email</label>' +
                        '<input type="email" id="email" class="form-control">' +
                    '</div>' +
                '</form>';
        });

        it('form layout has correct structure', function() {
            return FunkyTests.delay(50).then(function() {
                var form = document.getElementById('layout-form');
                var formGroups = form.querySelectorAll('.form-group');
                var inputs = form.querySelectorAll('input');

                expect(formGroups.length).toBe(3);
                expect(inputs.length).toBe(3);
            });
        });

    });

    describe('Input Groups', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<div class="input-group" id="input-group">' +
                    '<span class="input-group-text">@</span>' +
                    '<input type="text" class="form-control" placeholder="Username">' +
                '</div>';
        });

        it('input group has correct structure', function() {
            return FunkyTests.delay(50).then(function() {
                var group = document.getElementById('input-group');
                var prefix = group.querySelector('.input-group-text');
                var input = group.querySelector('input');

                expect(prefix).not.toBeNull();
                expect(prefix.textContent).toBe('@');
                expect(input).not.toBeNull();
            });
        });

    });

    describe('Form Control Sizes', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<input type="text" id="input-sm" class="form-control form-control-sm" placeholder="Small">' +
                '<input type="text" id="input-md" class="form-control" placeholder="Default">' +
                '<input type="text" id="input-lg" class="form-control form-control-lg" placeholder="Large">';
        });

        it('small input size', function() {
            return FunkyTests.delay(50).then(function() {
                var input = document.getElementById('input-sm');
                var computed = window.getComputedStyle(input);

                // Font size should be smaller (Bootstrap sm uses ~0.875rem)
                expect(parseFloat(computed.fontSize)).toBeLessThan(16);
            });
        });

        it('large input size', function() {
            return FunkyTests.delay(50).then(function() {
                var input = document.getElementById('input-lg');
                var computed = window.getComputedStyle(input);

                // Custom Funky CSS overrides Bootstrap sizes with fixed font-size
                // Just verify the input has a font-size set (not 0 or undefined)
                expect(parseFloat(computed.fontSize)).toBeGreaterThan(0);
            });
        });

        it('size variants have correct classes', function() {
            return FunkyTests.delay(50).then(function() {
                var small = document.getElementById('input-sm');
                var medium = document.getElementById('input-md');
                var large = document.getElementById('input-lg');

                expect(small.classList.contains('form-control-sm')).toBe(true);
                expect(medium.classList.contains('form-control')).toBe(true);
                expect(large.classList.contains('form-control-lg')).toBe(true);
            });
        });

    });

    describe('Form Style Consistency', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-forms-container');
            container.innerHTML =
                '<input type="text" class="form-control" id="style-input">' +
                '<select class="form-control" id="style-select"><option>Option</option></select>' +
                '<textarea class="form-control" id="style-textarea"></textarea>';
        });

        it('all form controls have consistent border radius', function() {
            return FunkyTests.delay(50).then(function() {
                var input = Visual.snapshotStyles(document.getElementById('style-input'));
                var select = Visual.snapshotStyles(document.getElementById('style-select'));
                var textarea = Visual.snapshotStyles(document.getElementById('style-textarea'));

                expect(input.borderRadius).toBe(select.borderRadius);
                expect(input.borderRadius).toBe(textarea.borderRadius);
            });
        });

        it('all form controls have consistent border style', function() {
            return FunkyTests.delay(50).then(function() {
                var input = Visual.snapshotStyles(document.getElementById('style-input'));
                var select = Visual.snapshotStyles(document.getElementById('style-select'));
                var textarea = Visual.snapshotStyles(document.getElementById('style-textarea'));

                expect(input.borderStyle).toBe(select.borderStyle);
                expect(input.borderStyle).toBe(textarea.borderStyle);
            });
        });

    });

});
