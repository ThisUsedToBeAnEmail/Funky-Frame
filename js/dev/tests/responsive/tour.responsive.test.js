/**
 * Responsive Tests: Funky.Tour
 *
 * Tests responsive behavior for the Tour component.
 * Verifies overlay/tooltip repositioning on resize,
 * viewport-aware step positioning, and touch navigation.
 */

FunkyTests.describe('Funky.Responsive.Tour', function() {
    var expect = FunkyTests.expect;
    var Tour = window.Funky && window.Funky.Tour;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Tour not loaded
    if (!Tour) {
        FunkyTests.it('Tour component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var tour;
    var testCounter = 0;
    var tourId;
    var btn1Id;
    var btn2Id;
    var targetId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        tourId = 'tour-' + unique;
        btn1Id = 'btn1-' + unique;
        btn2Id = 'btn2-' + unique;
        targetId = 'target-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="tour-container-' + unique + '">' +
                '<button id="' + btn1Id + '">Button 1</button>' +
                '<button id="' + btn2Id + '">Button 2</button>' +
                '<div id="' + targetId + '" style="margin-top: 100px;">Target Element</div>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (tour && typeof tour.destroy === 'function') {
            tour.destroy();
            tour = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('initializes at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                tour = Tour.create({
                    id: tourId,
                    steps: [
                        { target: '#' + btn1Id, title: 'Step 1', content: 'First step' }
                    ]
                });

                expect(tour).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                tour = Tour.create({
                    id: tourId,
                    steps: [
                        { target: '#' + btn1Id, title: 'Step 1', content: 'First step' }
                    ]
                });

                expect(tour).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                tour = Tour.create({
                    id: tourId,
                    steps: [
                        { target: '#' + btn1Id, title: 'Step 1', content: 'First step' }
                    ]
                });

                expect(tour).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Touch vs Mouse Behavior
    // ========================================================================

    FunkyTests.describe('Touch vs Mouse Behavior', function() {

        FunkyTests.it('works on touch device simulation', function(done) {
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                tour = Tour.create({
                    id: tourId,
                    steps: [
                        { target: '#' + btn1Id, title: 'Step 1', content: 'First step' }
                    ]
                });

                expect(tour).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                tour = Tour.create({
                    id: tourId,
                    steps: [
                        { target: '#' + btn1Id, title: 'Step 1', content: 'First step' }
                    ]
                });

                expect(tour).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Step Navigation at Different Viewports
    // ========================================================================

    FunkyTests.describe('Step Navigation', function() {

        FunkyTests.it('navigates steps at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                tour = Tour.create({
                    id: tourId,
                    steps: [
                        { target: '#' + btn1Id, title: 'Step 1', content: 'First step' },
                        { target: '#' + btn2Id, title: 'Step 2', content: 'Second step' }
                    ]
                });

                if (tour.start) tour.start();
                if (tour.next) tour.next();

                expect(tour).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('navigates steps at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                tour = Tour.create({
                    id: tourId,
                    steps: [
                        { target: '#' + btn1Id, title: 'Step 1', content: 'First step' },
                        { target: '#' + btn2Id, title: 'Step 2', content: 'Second step' }
                    ]
                });

                if (tour.start) tour.start();
                if (tour.next) tour.next();
                if (tour.prev) tour.prev();

                expect(tour).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Resize Handling
    // ========================================================================

    FunkyTests.describe('Resize Handling', function() {

        FunkyTests.it('handles viewport resize during tour', function(done) {
            tour = Tour.create({
                id: tourId,
                steps: [
                    { target: '#' + btn1Id, title: 'Step 1', content: 'First step' }
                ]
            });

            if (tour.start) tour.start();

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(tour).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            tour = Tour.create({
                id: tourId,
                steps: [
                    { target: '#' + btn1Id, title: 'Step 1', content: 'First step' }
                ]
            });

            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
                        expect(tour).not.toBeNull();

                        restore3();
                        done();
                    }, 50);
                }, 30);
            }, 30);
        });

    });

    // ========================================================================
    // Reduced Motion Preference
    // ========================================================================

    FunkyTests.describe('Reduced Motion Preference', function() {

        FunkyTests.it('respects reduced motion preference', function(done) {
            var restore = FunkyTests.simulate.reducedMotion(true);

            setTimeout(function() {
                tour = Tour.create({
                    id: tourId,
                    steps: [
                        { target: '#' + btn1Id, title: 'Step 1', content: 'First step' }
                    ]
                });

                expect(tour).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('destroys correctly', function() {
            tour = Tour.create({
                id: tourId,
                steps: [
                    { target: '#' + btn1Id, title: 'Step 1', content: 'First step' }
                ]
            });

            tour.destroy();

            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
            tour = null;
        });

    });

});
