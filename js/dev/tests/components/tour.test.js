/**
 * Funky.Tour Tests
 *
 * Tests for the interactive onboarding and feature discovery component.
 */

describe('Funky.Component.Tour', function() {

    var Tour;
    var fixture;
    var activeTours = [];

    // Helper to create and track tour instances
    function createTour(options) {
        if (!Tour) return undefined;
        var tour = Tour.create(options);
        if (tour) {
            activeTours.push(tour);
        }
        return tour;
    }

    beforeEach(function() {
        Tour = Funky.Tour;
        fixture = FunkyTests.fixture();
        activeTours = [];
    });

    afterEach(function() {
        // Clean up all created tours
        activeTours.forEach(function(tour) {
            if (tour && tour.destroy) {
                try {
                    tour.destroy();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        });
        activeTours = [];

        // Also call destroyAll if available
        if (Tour && Tour.destroyAll) {
            Tour.destroyAll();
        }

        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Tour')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof Tour.create).toBe('function');
        });

        it('has get method', function() {
            expect(typeof Tour.get).toBe('function');
        });

        it('has start method', function() {
            expect(typeof Tour.start).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof Tour.destroyAll).toBe('function');
        });

        it('has isCompleted method', function() {
            expect(typeof Tour.isCompleted).toBe('function');
        });

        it('has reset method', function() {
            expect(typeof Tour.reset).toBe('function');
        });

    });

    describe('Tour.create()', function() {

        it('creates a tour with required options', function() {
            fixture.html('<div id="step1">Step 1 Target</div>');

            var tour = createTour({
                id: 'test-tour-1',
                steps: [
                    { target: '#step1', title: 'Step 1' }
                ]
            });

            expect(tour).toBeDefined();
        });

        it('requires tour ID', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = Tour.create({
                steps: [{ target: '#step1' }]
            });

            // Tour constructor returns early without proper init when ID is missing
            // The tour is created but not registered or functional
            expect(tour.id).toBeUndefined();
        });

        it('requires at least one step', function() {
            var tour = Tour.create({
                id: 'empty-steps-tour',
                steps: []
            });

            // Tour constructor returns early without proper init when steps are empty
            // The tour is created but not registered or functional
            expect(tour.steps).toBeUndefined();
        });

        it('returns existing tour if ID already exists', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour1 = createTour({
                id: 'duplicate-test',
                steps: [{ target: '#step1' }]
            });

            var tour2 = Tour.create({
                id: 'duplicate-test',
                steps: [{ target: '#step1' }]
            });

            expect(tour2).toBe(tour1);
        });

        it('normalizes string step to object', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'string-step-tour',
                steps: ['#step1']
            });

            expect(tour).toBeDefined();
        });

    });

    describe('Tour.get()', function() {

        it('returns registered tour by ID', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'get-test-tour',
                steps: [{ target: '#step1' }]
            });

            var retrieved = Tour.get('get-test-tour');
            expect(retrieved).toBe(tour);
        });

        it('returns null for non-existent tour', function() {
            var result = Tour.get('non-existent-tour');
            expect(result).toBeNull();
        });

    });

    describe('Tour instance', function() {

        it('has start method', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'instance-test',
                steps: [{ target: '#step1' }]
            });

            expect(typeof tour.start).toBe('function');
        });

        it('has end method', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'stop-test',
                steps: [{ target: '#step1' }]
            });

            expect(typeof tour.end).toBe('function');
        });

        it('has next method', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'next-test',
                steps: [{ target: '#step1' }]
            });

            expect(typeof tour.next).toBe('function');
        });

        it('has prev method', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'prev-test',
                steps: [{ target: '#step1' }]
            });

            expect(typeof tour.prev).toBe('function');
        });

        it('has goTo method', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'goto-test',
                steps: [{ target: '#step1' }]
            });

            expect(typeof tour.goTo).toBe('function');
        });

        it('has destroy method', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'destroy-test',
                steps: [{ target: '#step1' }]
            });

            expect(typeof tour.destroy).toBe('function');
        });

        it('has id property', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'id-prop-test',
                steps: [{ target: '#step1' }]
            });

            expect(tour.id).toBe('id-prop-test');
        });

        it('has steps array', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'steps-prop-test',
                steps: [
                    { target: '#step1', title: 'First' }
                ]
            });

            expect(Array.isArray(tour.steps)).toBe(true);
            expect(tour.steps.length).toBe(1);
        });

    });

    describe('Tour options', function() {

        it('supports showProgress option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'progress-test',
                showProgress: true,
                steps: [{ target: '#step1' }]
            });

            expect(tour.options.showProgress).toBe(true);
        });

        it('supports showSkip option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'skip-test',
                showSkip: true,
                steps: [{ target: '#step1' }]
            });

            expect(tour.options.showSkip).toBe(true);
        });

        it('supports showPrevious option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'prev-option-test',
                showPrevious: true,
                steps: [{ target: '#step1' }]
            });

            expect(tour.options.showPrevious).toBe(true);
        });

        it('supports showClose option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'close-option-test',
                showClose: true,
                steps: [{ target: '#step1' }]
            });

            expect(tour.options.showClose).toBe(true);
        });

        it('supports overlayEnabled option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'overlay-test',
                overlayEnabled: false,
                steps: [{ target: '#step1' }]
            });

            expect(tour.options.overlayEnabled).toBe(false);
        });

        it('supports animate option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'animate-test',
                animate: false,
                steps: [{ target: '#step1' }]
            });

            expect(tour.options.animate).toBe(false);
        });

        it('supports persist option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'persist-test',
                persist: true,
                steps: [{ target: '#step1' }]
            });

            expect(tour.options.persist).toBe(true);
        });

        it('supports showOnce option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'showonce-test',
                showOnce: true,
                steps: [{ target: '#step1' }]
            });

            expect(tour.options.showOnce).toBe(true);
        });

    });

    describe('Step configuration', function() {

        it('supports target option', function() {
            fixture.html('<div id="target1">Target</div>');

            var tour = createTour({
                id: 'target-test',
                steps: [{ target: '#target1' }]
            });

            expect(tour.steps[0].target).toBe('#target1');
        });

        it('supports title option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'title-test',
                steps: [{ target: '#step1', title: 'Welcome' }]
            });

            expect(tour.steps[0].title).toBe('Welcome');
        });

        it('supports content option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'content-test',
                steps: [{ target: '#step1', content: 'This is the content' }]
            });

            expect(tour.steps[0].content).toBe('This is the content');
        });

        it('supports position option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'position-test',
                steps: [{ target: '#step1', position: 'bottom' }]
            });

            expect(tour.steps[0].position).toBe('bottom');
        });

        it('supports action option', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var actionFn = function() {};
            var tour = createTour({
                id: 'action-test',
                steps: [{
                    target: '#step1',
                    action: { text: 'Try It', onClick: actionFn }
                }]
            });

            expect(tour.steps[0].action).toBeDefined();
            expect(tour.steps[0].action.text).toBe('Try It');
        });

    });

    describe('Tour.isCompleted()', function() {

        it('returns false for new tour', function() {
            var completed = Tour.isCompleted('never-run-tour');
            expect(completed).toBe(false);
        });

    });

    describe('Tour.reset()', function() {

        it('clears completion status', function() {
            // Should not throw
            Tour.reset('some-tour-id');
            expect(Tour.isCompleted('some-tour-id')).toBe(false);
        });

    });

    describe('Tour.destroyAll()', function() {

        it('destroys all tours', function() {
            fixture.html(
                '<div id="step1">Step 1</div>' +
                '<div id="step2">Step 2</div>'
            );

            Tour.create({
                id: 'tour-to-destroy-1',
                steps: [{ target: '#step1' }]
            });

            Tour.create({
                id: 'tour-to-destroy-2',
                steps: [{ target: '#step2' }]
            });

            Tour.destroyAll();

            expect(Tour.get('tour-to-destroy-1')).toBeNull();
            expect(Tour.get('tour-to-destroy-2')).toBeNull();
        });

    });

    describe('Tour.start() static method', function() {

        it('starts tour by ID', function() {
            fixture.html('<div id="step1">Step 1</div>');

            createTour({
                id: 'static-start-test',
                steps: [{ target: '#step1' }]
            });

            // Should not throw
            Tour.start('static-start-test');
        });

        it('returns null for non-existent tour', function() {
            var result = Tour.start('non-existent');
            // start() returns the tour from registry which is null if not found
            expect(result).toBeFalsy();
        });

    });

    describe('Lifecycle callbacks', function() {

        it('supports onStart callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var startCalled = false;
            var tour = createTour({
                id: 'onstart-test',
                steps: [{ target: '#step1' }],
                onStart: function() {
                    startCalled = true;
                }
            });

            expect(tour.options.onStart).toBeDefined();
        });

        it('supports onEnd callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'onend-test',
                steps: [{ target: '#step1' }],
                onEnd: function() {}
            });

            expect(tour.options.onEnd).toBeDefined();
        });

        it('supports onComplete callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'oncomplete-test',
                steps: [{ target: '#step1' }],
                onComplete: function() {}
            });

            expect(tour.options.onComplete).toBeDefined();
        });

        it('supports onSkip callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'onskip-test',
                steps: [{ target: '#step1' }],
                onSkip: function() {}
            });

            expect(tour.options.onSkip).toBeDefined();
        });

        it('supports onStepShow callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'onstepshow-test',
                steps: [{ target: '#step1' }],
                onStepShow: function() {}
            });

            expect(tour.options.onStepShow).toBeDefined();
        });

        it('supports onStepHide callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'onstephide-test',
                steps: [{ target: '#step1' }],
                onStepHide: function() {}
            });

            expect(tour.options.onStepHide).toBeDefined();
        });

    });

    describe('Step lifecycle callbacks', function() {

        it('supports beforeShow callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'beforeshow-test',
                steps: [{
                    target: '#step1',
                    beforeShow: function() {}
                }]
            });

            expect(tour.steps[0].beforeShow).toBeDefined();
        });

        it('supports afterShow callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'aftershow-test',
                steps: [{
                    target: '#step1',
                    afterShow: function() {}
                }]
            });

            expect(tour.steps[0].afterShow).toBeDefined();
        });

        it('supports beforeHide callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'beforehide-test',
                steps: [{
                    target: '#step1',
                    beforeHide: function() {}
                }]
            });

            expect(tour.steps[0].beforeHide).toBeDefined();
        });

        it('supports afterHide callback', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'afterhide-test',
                steps: [{
                    target: '#step1',
                    afterHide: function() {}
                }]
            });

            expect(tour.steps[0].afterHide).toBeDefined();
        });

    });

    describe('Conditional steps', function() {

        it('supports showIf function', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'showif-test',
                steps: [{
                    target: '#step1',
                    showIf: function() { return true; }
                }]
            });

            expect(typeof tour.steps[0].showIf).toBe('function');
        });

        it('supports skipIf function', function() {
            fixture.html('<div id="step1">Step 1</div>');

            var tour = createTour({
                id: 'skipif-test',
                steps: [{
                    target: '#step1',
                    skipIf: function() { return false; }
                }]
            });

            expect(typeof tour.steps[0].skipIf).toBe('function');
        });

    });

});
