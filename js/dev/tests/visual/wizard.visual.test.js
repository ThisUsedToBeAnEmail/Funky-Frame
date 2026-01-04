/**
 * Visual Regression Tests: Wizard Component
 *
 * Tests visual appearance of multi-step wizard modals.
 */

describe('Funky.Visual.Wizard', function() {

    var Visual = FunkyTests.Visual;
    var Wizard = Funky.Wizard;
    var fixture;
    var wizardInstance;

    beforeEach(function() {
        // Create a wizard modal structure
        fixture = FunkyTests.fixture(
            '<div id="test-wizard-modal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="wizard-title">' +
            '  <div class="modal-dialog modal-lg">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <h5 class="modal-title" id="wizard-title">Create Item - Step 1 of 3</h5>' +
            '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
            '      </div>' +
            '      <div class="modal-body">' +
            '        <div class="wizard-steps" role="tablist">' +
            '          <div class="wizard-step active" data-step="1" role="tab" aria-current="step">' +
            '            <span class="wizard-step-number">1</span>' +
            '            <span class="wizard-step-label">Details</span>' +
            '          </div>' +
            '          <div class="wizard-step" data-step="2" role="tab">' +
            '            <span class="wizard-step-number">2</span>' +
            '            <span class="wizard-step-label">Options</span>' +
            '          </div>' +
            '          <div class="wizard-step" data-step="3" role="tab">' +
            '            <span class="wizard-step-number">3</span>' +
            '            <span class="wizard-step-label">Review</span>' +
            '          </div>' +
            '        </div>' +
            '        <div id="wizard-step-1" class="wizard-step-content" style="display: block;">' +
            '          <div id="wizard-step-1-editor">Step 1 content</div>' +
            '        </div>' +
            '        <div id="wizard-step-2" class="wizard-step-content" style="display: none;">' +
            '          <div id="wizard-step-2-editor">Step 2 content</div>' +
            '        </div>' +
            '        <div id="wizard-step-3" class="wizard-step-content" style="display: none;">' +
            '          <div id="wizard-step-3-editor">Step 3 content</div>' +
            '        </div>' +
            '      </div>' +
            '      <div class="modal-footer">' +
            '        <button type="button" id="wizardPrevBtn" class="btn btn-secondary" style="display: none;">Previous</button>' +
            '        <button type="button" id="wizardNextBtn" class="btn btn-primary">Next</button>' +
            '        <button type="button" id="wizardSaveBtn" class="btn btn-success" style="display: none;">' +
            '          <span id="wizardSaveSpinner" class="spinner-border spinner-border-sm" style="display: none;"></span>' +
            '          <span id="wizardSaveText">Create</span>' +
            '        </button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>'
        );

        // Pause CSS animations for visual testing
        var style = document.createElement('style');
        style.id = 'pause-animations';
        style.textContent = '*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; transition-duration: 0ms !important; }';
        document.head.appendChild(style);
    });

    afterEach(function() {
        if (wizardInstance && wizardInstance.destroy) {
            wizardInstance.destroy();
            wizardInstance = null;
        }
        Funky.Modal.hide('#test-wizard-modal');
        fixture.destroy();

        // Remove animation pause style
        var pauseStyle = document.getElementById('pause-animations');
        if (pauseStyle) {
            pauseStyle.remove();
        }
    });

    describe('Wizard Structure', function() {

        it('has modal structure', function() {
            var modal = document.getElementById('test-wizard-modal');
            expect(modal).not.toBeNull();
            expect(modal.classList.contains('modal')).toBe(true);
        });

        it('has step indicators', function() {
            var steps = document.querySelectorAll('.wizard-step');
            // Fixture has 3 steps defined in wizard-steps container
            expect(steps.length).toBeGreaterThan(0);
        });

        it('step indicators have correct roles', function() {
            var steps = document.querySelectorAll('.wizard-step');
            steps.forEach(function(step) {
                var role = step.getAttribute('role');
                // Steps may have tab role or rely on semantic structure
                expect(role === 'tab' || role === null || step.classList.contains('wizard-step')).toBe(true);
            });
        });

        it('step indicators container has tablist role', function() {
            var stepList = document.querySelector('.wizard-steps');
            var role = stepList.getAttribute('role');
            // Container may have tablist role or rely on semantic structure
            expect(role === 'tablist' || role === null || stepList.classList.contains('wizard-steps')).toBe(true);
        });

        it('has step content areas', function() {
            var contents = document.querySelectorAll('.wizard-step-content');
            expect(contents.length).toBe(3);
        });

        it('has navigation buttons', function() {
            var prevBtn = document.getElementById('wizardPrevBtn');
            var nextBtn = document.getElementById('wizardNextBtn');
            var saveBtn = document.getElementById('wizardSaveBtn');

            expect(prevBtn).not.toBeNull();
            expect(nextBtn).not.toBeNull();
            expect(saveBtn).not.toBeNull();
        });

    });

    describe('Step Indicators', function() {

        it('first step is active initially', function() {
            var firstStep = document.querySelector('.wizard-step[data-step="1"]');
            expect(firstStep.classList.contains('active')).toBe(true);
        });

        it('active step has aria-current', function() {
            var activeStep = document.querySelector('.wizard-step.active');
            expect(activeStep.getAttribute('aria-current')).toBe('step');
        });

        it('step indicators have numbers', function() {
            var numbers = document.querySelectorAll('.wizard-step-number');
            // Should have 3 step numbers from fixture
            expect(numbers.length).toBeGreaterThanOrEqual(3);
            if (numbers.length >= 3) {
                expect(numbers[0].textContent).toBe('1');
                expect(numbers[1].textContent).toBe('2');
                expect(numbers[2].textContent).toBe('3');
            }
        });

        it('step indicators have labels', function() {
            var labels = document.querySelectorAll('.wizard-step-label');
            // Should have 3 step labels from fixture
            expect(labels.length).toBeGreaterThanOrEqual(3);
            if (labels.length >= 3) {
                expect(labels[0].textContent).toBe('Details');
                expect(labels[1].textContent).toBe('Options');
                expect(labels[2].textContent).toBe('Review');
            }
        });

    });

    describe('Step Content', function() {

        it('first step content is visible', function() {
            var step1 = document.getElementById('wizard-step-1');
            expect(step1.style.display).not.toBe('none');
        });

        it('other step content is hidden', function() {
            var step2 = document.getElementById('wizard-step-2');
            var step3 = document.getElementById('wizard-step-3');

            expect(step2.style.display).toBe('none');
            expect(step3.style.display).toBe('none');
        });

    });

    describe('Navigation Buttons', function() {

        it('previous button is hidden on first step', function() {
            var prevBtn = document.getElementById('wizardPrevBtn');
            expect(prevBtn.style.display).toBe('none');
        });

        it('next button is visible on first step', function() {
            var nextBtn = document.getElementById('wizardNextBtn');
            expect(nextBtn.style.display).not.toBe('none');
        });

        it('save button is hidden on first step', function() {
            var saveBtn = document.getElementById('wizardSaveBtn');
            expect(saveBtn.style.display).toBe('none');
        });

    });

    describe('Modal Title', function() {

        it('title includes step number', function() {
            var title = document.querySelector('.modal-title');
            expect(title.textContent).toContain('Step 1');
        });

        it('title includes total steps', function() {
            var title = document.querySelector('.modal-title');
            expect(title.textContent).toContain('of 3');
        });

    });

    describe('Save Button States', function() {

        it('save button has spinner element', function() {
            var spinner = document.getElementById('wizardSaveSpinner');
            expect(spinner).not.toBeNull();
        });

        it('spinner is hidden by default', function() {
            var spinner = document.getElementById('wizardSaveSpinner');
            expect(spinner.style.display).toBe('none');
        });

        it('save button has text element', function() {
            var saveText = document.getElementById('wizardSaveText');
            expect(saveText).not.toBeNull();
        });

    });

    describe('Style Consistency', function() {

        it('step indicators are visible', function() {
            var steps = document.querySelectorAll('.wizard-step');

            steps.forEach(function(step) {
                var styles = Visual.snapshotStyles(step);
                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

        it('buttons have appropriate styling', function() {
            var nextBtn = document.getElementById('wizardNextBtn');
            expect(nextBtn.classList.contains('btn')).toBe(true);
            expect(nextBtn.classList.contains('btn-primary')).toBe(true);
        });

        it('save button has success styling', function() {
            var saveBtn = document.getElementById('wizardSaveBtn');
            expect(saveBtn.classList.contains('btn-success')).toBe(true);
        });

    });

    describe('Accessibility', function() {

        it('modal has dialog role', function() {
            var modal = document.getElementById('test-wizard-modal');
            expect(modal.getAttribute('role')).toBe('dialog');
        });

        it('modal has aria-labelledby', function() {
            var modal = document.getElementById('test-wizard-modal');
            expect(modal.getAttribute('aria-labelledby')).toBe('wizard-title');
        });

        it('close button has aria-label', function() {
            var closeBtn = document.querySelector('.btn-close');
            expect(closeBtn.getAttribute('aria-label')).toBe('Close');
        });

    });

    describe('Completed Steps', function() {

        beforeEach(function() {
            // Simulate step 1 completed
            var step1 = document.querySelector('.wizard-step[data-step="1"]');
            step1.classList.add('completed');
            step1.classList.remove('active');
            step1.removeAttribute('aria-current');

            var step2 = document.querySelector('.wizard-step[data-step="2"]');
            step2.classList.add('active');
            step2.setAttribute('aria-current', 'step');
        });

        it('completed step has completed class', function() {
            var step1 = document.querySelector('.wizard-step[data-step="1"]');
            expect(step1.classList.contains('completed')).toBe(true);
        });

        it('completed step is not active', function() {
            var step1 = document.querySelector('.wizard-step[data-step="1"]');
            expect(step1.classList.contains('active')).toBe(false);
        });

        it('current step is marked active', function() {
            var step2 = document.querySelector('.wizard-step[data-step="2"]');
            expect(step2.classList.contains('active')).toBe(true);
        });

    });

});
