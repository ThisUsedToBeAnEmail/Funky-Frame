/**
 * Funky.Stepper Tests
 */
describe('Funky.Component.Stepper', function() {

    var Stepper = Funky.Stepper;
    var fixture;
    var instance;

    var defaultSteps = [
        { id: 'step1', label: 'Step 1' },
        { id: 'step2', label: 'Step 2' },
        { id: 'step3', label: 'Step 3' }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-stepper"></div>');
    });

    afterEach(function() {
        if (instance && instance.destroy) {
            instance.destroy();
        }
        fixture.destroy();
        instance = null;
    });

    // =====================
    // Module Availability
    // =====================
    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Stepper')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof Stepper.init).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof Stepper.getInstance).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof Stepper.destroyAll).toBe('function');
        });

    });

    // =====================
    // Initialization Tests
    // =====================
    describe('initialization', function() {

        it('should create instance with default options', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps
            });

            expect(instance).toBeTruthy();
            expect(instance.id).toBeTruthy();
        });

        it('should render step elements', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps
            });

            var stepEls = fixture.el.querySelectorAll('.funky-stepper__step');
            expect(stepEls.length).toBe(3);
        });

        it('should apply initial current step', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                current: 1
            });

            expect(instance.getCurrent()).toBe(1);
            var currentEl = fixture.el.querySelector('.funky-stepper__step--current');
            expect(currentEl).toBeTruthy();
        });

        it('should apply initial completed steps', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                current: 2,
                completed: [0, 1]
            });

            var completedEls = fixture.el.querySelectorAll('.funky-stepper__step--completed');
            expect(completedEls.length).toBe(2);
        });

        it('should render horizontal orientation by default', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps
            });

            var nav = fixture.el.querySelector('.funky-stepper');
            expect(nav.classList.contains('funky-stepper--horizontal')).toBe(true);
        });

        it('should render vertical orientation when specified', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                orientation: 'vertical'
            });

            var nav = fixture.el.querySelector('.funky-stepper');
            expect(nav.classList.contains('funky-stepper--vertical')).toBe(true);
        });

        it('should render step labels when showLabels is true', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                showLabels: true
            });

            var labels = fixture.el.querySelectorAll('.funky-stepper__label');
            expect(labels.length).toBe(3);
            expect(labels[0].textContent).toBe('Step 1');
        });

        it('should render step numbers when showNumbers is true', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                showNumbers: true
            });

            var indicators = fixture.el.querySelectorAll('.funky-stepper__indicator');
            expect(indicators[0].textContent.trim()).toBe('1');
        });

        it('should render custom icons when provided', function() {
            instance = Stepper.init('#test-stepper', {
                steps: [
                    { id: 's1', label: 'Step 1', icon: 'fas fa-user' }
                ],
                showIcons: true
            });

            var icon = fixture.el.querySelector('.funky-stepper__indicator i');
            expect(icon).toBeTruthy();
            expect(icon.classList.contains('fa-user')).toBe(true);
        });

        it('should render descriptions when provided', function() {
            instance = Stepper.init('#test-stepper', {
                steps: [
                    { id: 's1', label: 'Step 1', description: 'First step details' }
                ],
                showDescription: true
            });

            var desc = fixture.el.querySelector('.funky-stepper__description');
            expect(desc).toBeTruthy();
            expect(desc.textContent).toBe('First step details');
        });

    });

    // =====================
    // Navigation Tests
    // =====================
    describe('navigation', function() {

        beforeEach(function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                current: 0
            });
        });

        it('should get current step index', function() {
            expect(instance.getCurrent()).toBe(0);
        });

        it('should set current step', function() {
            instance.setCurrent(2);
            expect(instance.getCurrent()).toBe(2);
        });

        it('should go to next step', function() {
            instance.next();
            expect(instance.getCurrent()).toBe(1);
        });

        it('should go to previous step', function() {
            instance.setCurrent(2);
            instance.prev();
            expect(instance.getCurrent()).toBe(1);
        });

        it('should not go below 0', function() {
            instance.prev();
            expect(instance.getCurrent()).toBe(0);
        });

        it('should not go beyond last step', function() {
            instance.setCurrent(2);
            instance.next();
            expect(instance.getCurrent()).toBe(2);
        });

        it('should reset to first step', function() {
            instance.setCurrent(2);
            instance.complete(0);
            instance.complete(1);
            instance.reset();

            expect(instance.getCurrent()).toBe(0);
            expect(instance.getProgress()).toBe(0);
        });

    });

    // =====================
    // State Management Tests
    // =====================
    describe('state management', function() {

        beforeEach(function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps
            });
        });

        it('should mark step as completed by index', function() {
            // Complete step 1 (not step 0 which is current)
            instance.complete(1);

            var completedEl = fixture.el.querySelector('.funky-stepper__step--completed');
            expect(completedEl).toBeTruthy();
        });

        it('should mark step as completed by id', function() {
            // Complete step 2 (not step 1 which is current by default)
            instance.complete('step2');

            var completedEl = fixture.el.querySelector('.funky-stepper__step--completed');
            expect(completedEl).toBeTruthy();
        });

        it('should set error on step', function() {
            instance.setError(1, 'Validation failed');

            var errorEl = fixture.el.querySelector('.funky-stepper__step--error');
            expect(errorEl).toBeTruthy();

            var errorMsg = fixture.el.querySelector('.funky-stepper__error');
            expect(errorMsg.textContent).toBe('Validation failed');
        });

        it('should clear error on step', function() {
            instance.setError(1, 'Error');
            instance.clearError(1);

            var errorEl = fixture.el.querySelector('.funky-stepper__step--error');
            expect(errorEl).toBeFalsy();
        });

        it('should calculate progress percentage', function() {
            expect(instance.getProgress()).toBe(0);

            instance.complete(0);
            expect(instance.getProgress()).toBe(33);

            instance.complete(1);
            expect(instance.getProgress()).toBe(67);

            instance.complete(2);
            expect(instance.getProgress()).toBe(100);
        });

    });

    // =====================
    // Clickable Tests
    // =====================
    describe('clickable navigation', function() {

        it('should navigate on click when clickable is true', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                clickable: true,
                linear: false
            });

            var buttons = fixture.el.querySelectorAll('.funky-stepper__button');
            buttons[2].click();

            expect(instance.getCurrent()).toBe(2);
        });

        it('should respect linear mode - cannot skip steps', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                current: 0,
                clickable: true,
                linear: true
            });

            var buttons = fixture.el.querySelectorAll('.funky-stepper__button');
            buttons[2].click();

            expect(instance.getCurrent()).toBe(0);
        });

        it('should allow clicking completed steps in linear mode', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                current: 2,
                completed: [0, 1],
                clickable: true,
                linear: true
            });

            var buttons = fixture.el.querySelectorAll('.funky-stepper__button');
            buttons[0].click();

            expect(instance.getCurrent()).toBe(0);
        });

    });

    // =====================
    // Callback Tests
    // =====================
    describe('callbacks', function() {

        it('should call onChange when step changes via click', function() {
            var called = false;
            var receivedStep = null;
            var receivedIndex = null;

            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                clickable: true,
                linear: false,
                onChange: function(step, index) {
                    called = true;
                    receivedStep = step;
                    receivedIndex = index;
                }
            });

            var buttons = fixture.el.querySelectorAll('.funky-stepper__button');
            buttons[1].click();

            expect(called).toBe(true);
            expect(receivedStep.id).toBe('step2');
            expect(receivedIndex).toBe(1);
        });

        it('should call onBeforeChange before navigation', function() {
            var beforeCalled = false;

            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                clickable: true,
                linear: false,
                onBeforeChange: function(from, to) {
                    beforeCalled = true;
                    return true;
                }
            });

            var buttons = fixture.el.querySelectorAll('.funky-stepper__button');
            buttons[1].click();

            expect(beforeCalled).toBe(true);
        });

        it('should prevent navigation when onBeforeChange returns false', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                clickable: true,
                linear: false,
                onBeforeChange: function(from, to) {
                    return false;
                }
            });

            var buttons = fixture.el.querySelectorAll('.funky-stepper__button');
            buttons[1].click();

            expect(instance.getCurrent()).toBe(0);
        });

    });

    // =====================
    // Event Tests
    // =====================
    describe('events', function() {

        it('should emit funky.stepper.change event', function(done) {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                clickable: true,
                linear: false
            });

            fixture.el.addEventListener('funky.stepper.change', function(e) {
                expect(e.detail.index).toBe(1);
                expect(e.detail.step.id).toBe('step2');
                done();
            });

            var buttons = fixture.el.querySelectorAll('.funky-stepper__button');
            buttons[1].click();
        });

    });

    // =====================
    // LiveBinding Interface Tests
    // =====================
    describe('LiveBinding interface', function() {

        beforeEach(function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps
            });
        });

        it('should have setData method', function() {
            expect(typeof instance.setData).toBe('function');
        });

        it('should have getData method', function() {
            expect(typeof instance.getData).toBe('function');
        });

        it('should update state via setData', function() {
            instance.setData({
                current: 2,
                completed: [0, 1],
                errors: { 2: 'Error message' }
            });

            expect(instance.getCurrent()).toBe(2);
            expect(instance.getProgress()).toBe(67);

            var errorEl = fixture.el.querySelector('.funky-stepper__step--error');
            expect(errorEl).toBeTruthy();
        });

        it('should return state via getData', function() {
            instance.setCurrent(1);
            instance.complete(0);

            var data = instance.getData();

            expect(data.current).toBe(1);
            expect(data.completed).toContain(0);
            expect(data.progress).toBe(33);
        });

    });

    // =====================
    // Accessibility Tests
    // =====================
    describe('accessibility', function() {

        beforeEach(function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                current: 1
            });
        });

        it('should have role="navigation"', function() {
            var nav = fixture.el.querySelector('.funky-stepper');
            expect(nav.getAttribute('role')).toBe('navigation');
        });

        it('should have aria-label', function() {
            var nav = fixture.el.querySelector('.funky-stepper');
            expect(nav.getAttribute('aria-label')).toBe('Progress');
        });

        it('should set aria-current="step" on current step', function() {
            var currentButton = fixture.el.querySelector('.funky-stepper__step--current .funky-stepper__button');
            expect(currentButton.getAttribute('aria-current')).toBe('step');
        });

        it('should disable upcoming steps in linear mode', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                current: 0,
                linear: true
            });

            var buttons = fixture.el.querySelectorAll('.funky-stepper__button');
            expect(buttons[2].disabled).toBe(true);
        });

    });

    // =====================
    // Size Variants Tests
    // =====================
    describe('size variants', function() {

        it('should apply sm size class', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                size: 'sm'
            });

            var nav = fixture.el.querySelector('.funky-stepper');
            expect(nav.classList.contains('funky-stepper--sm')).toBe(true);
        });

        it('should apply lg size class', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                size: 'lg'
            });

            var nav = fixture.el.querySelector('.funky-stepper');
            expect(nav.classList.contains('funky-stepper--lg')).toBe(true);
        });

    });

    // =====================
    // Progress Bar Tests
    // =====================
    describe('progress bar', function() {

        it('should render progress bar when showProgress is true', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                showProgress: true,
                completed: [0]
            });

            var progressBar = fixture.el.querySelector('.funky-stepper__progress-bar');
            expect(progressBar).toBeTruthy();
        });

        it('should update progress bar width', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps,
                showProgress: true
            });

            instance.complete(0);
            instance.complete(1);

            var progressBar = fixture.el.querySelector('.funky-stepper__progress-bar');
            expect(progressBar.style.width).toBe('67%');
        });

    });

    // =====================
    // Sub-steps Tests
    // =====================
    describe('sub-steps', function() {

        it('should render sub-steps when provided', function() {
            instance = Stepper.init('#test-stepper', {
                steps: [
                    {
                        id: 's1',
                        label: 'Step 1',
                        substeps: [
                            { label: 'Sub-step A' },
                            { label: 'Sub-step B' }
                        ]
                    }
                ]
            });

            var substeps = fixture.el.querySelectorAll('.funky-stepper__substep');
            expect(substeps.length).toBe(2);
        });

        it('should mark sub-steps as completed', function() {
            instance = Stepper.init('#test-stepper', {
                steps: [
                    {
                        id: 's1',
                        label: 'Step 1',
                        substeps: [
                            { label: 'Sub-step A' },
                            { label: 'Sub-step B' }
                        ]
                    }
                ]
            });

            instance.complete('0-0');

            var completedSubstep = fixture.el.querySelector('.funky-stepper__substep--completed');
            expect(completedSubstep).toBeTruthy();
        });

    });

    // =====================
    // Cleanup Tests
    // =====================
    describe('cleanup', function() {

        it('should cleanup on destroy', function() {
            instance = Stepper.init('#test-stepper', {
                steps: defaultSteps
            });
            var id = instance.id;

            instance.destroy();

            expect(Stepper.getInstance(id)).toBeNull();
        });

        it('should destroy all instances', function() {
            var container2 = document.createElement('div');
            container2.id = 'test-stepper-2';
            document.body.appendChild(container2);

            var instance1 = Stepper.init('#test-stepper', { steps: defaultSteps });
            var instance2 = Stepper.init('#test-stepper-2', { steps: defaultSteps });

            Stepper.destroyAll();

            expect(Stepper.getInstance(instance1.id)).toBeNull();
            expect(Stepper.getInstance(instance2.id)).toBeNull();

            container2.parentNode.removeChild(container2);
            instance = null;
        });

    });

});
