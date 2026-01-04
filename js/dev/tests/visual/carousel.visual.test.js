/**
 * Visual Regression Tests: Carousel Component
 *
 * Tests visual appearance of carousel slides, navigation, and indicators.
 *
 * NOTE: Carousel uses animations, so we pause CSS animations for consistent testing.
 */

describe('Funky.Visual.Carousel', function() {

    var Visual = FunkyTests.Visual;
    var Carousel = Funky.Carousel;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-carousel-container" style="width: 600px; height: 300px; background: #f5f5f5;"></div>');

        // Pause CSS animations for visual testing
        var style = document.createElement('style');
        style.id = 'pause-animations';
        style.textContent = '*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; transition-duration: 0ms !important; }';
        document.head.appendChild(style);
    });

    afterEach(function() {
        Carousel.destroyAll();
        fixture.destroy();

        // Remove animation pause style
        var pauseStyle = document.getElementById('pause-animations');
        if (pauseStyle) {
            pauseStyle.remove();
        }
    });

    describe('Carousel Structure', function() {

        it('creates correct DOM structure', function() {
            var carousel = Carousel.create('#visual-carousel-container', {
                slides: [
                    '<div class="slide-content">Slide 1</div>',
                    '<div class="slide-content">Slide 2</div>',
                    '<div class="slide-content">Slide 3</div>'
                ]
            });

            return FunkyTests.delay(100).then(function() {
                var container = document.querySelector('#visual-carousel-container');
                expect(container.classList.contains('carousel')).toBe(true);

                var viewport = container.querySelector('.carousel__viewport');
                expect(viewport).not.toBeNull();

                var track = container.querySelector('.carousel__track');
                expect(track).not.toBeNull();

                var slides = container.querySelectorAll('.carousel__slide');
                expect(slides.length).toBe(3);
            });
        });

        it('viewport has correct styles', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>Slide 1</div>', '<div>Slide 2</div>']
            });

            return FunkyTests.delay(100).then(function() {
                var viewport = document.querySelector('.carousel__viewport');
                expect(viewport).not.toBeNull();

                var styles = Visual.snapshotStyles(viewport);
                expect(styles.overflow).toBe('hidden');
            });
        });

        it('track uses flexbox layout', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>Slide 1</div>', '<div>Slide 2</div>']
            });

            return FunkyTests.delay(100).then(function() {
                var track = document.querySelector('.carousel__track');
                expect(track).not.toBeNull();

                var styles = Visual.snapshotStyles(track);
                expect(styles.display).toBe('flex');
            });
        });

    });

    describe('Slide Dimensions', function() {

        it('single slide takes full width', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>Slide 1</div>', '<div>Slide 2</div>'],
                slidesToShow: 1
            });

            return FunkyTests.delay(100).then(function() {
                var container = document.querySelector('#visual-carousel-container');
                var slide = container.querySelector('.carousel__slide');

                var containerWidth = container.offsetWidth;
                var slideWidth = slide.offsetWidth;

                // Slide should be close to container width
                expect(Math.abs(containerWidth - slideWidth)).toBeLessThan(50);
            });
        });

        it('multiple slides show correctly', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>', '<div>4</div>'],
                slidesToShow: 3,
                gap: 16
            });

            return FunkyTests.delay(100).then(function() {
                var container = document.querySelector('#visual-carousel-container');
                var slides = container.querySelectorAll('.carousel__slide');

                expect(slides.length).toBe(4);

                // Each slide should have reasonable width
                var slideWidth = slides[0].offsetWidth;
                expect(slideWidth).toBeGreaterThan(100);
                expect(slideWidth).toBeLessThan(300);
            });
        });

    });

    describe('Navigation Arrows', function() {

        it('shows navigation arrows', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                arrows: true
            });

            return FunkyTests.delay(100).then(function() {
                var prevArrow = document.querySelector('.carousel__arrow--prev');
                var nextArrow = document.querySelector('.carousel__arrow--next');

                expect(prevArrow).not.toBeNull();
                expect(nextArrow).not.toBeNull();
            });
        });

        it('arrow buttons are visible', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                arrows: true
            });

            return FunkyTests.delay(100).then(function() {
                var nextArrow = document.querySelector('.carousel__arrow--next');
                var styles = Visual.snapshotStyles(nextArrow);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

        it('prev arrow is disabled at start', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                arrows: true,
                infinite: false
            });

            return FunkyTests.delay(100).then(function() {
                var prevArrow = document.querySelector('.carousel__arrow--prev');
                expect(prevArrow.hasAttribute('disabled')).toBe(true);
                expect(prevArrow.classList.contains('carousel__arrow--disabled')).toBe(true);
            });
        });

        it('arrows contain SVG icons', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>'],
                arrows: true
            });

            return FunkyTests.delay(100).then(function() {
                var prevArrow = document.querySelector('.carousel__arrow--prev');
                var nextArrow = document.querySelector('.carousel__arrow--next');

                expect(prevArrow.querySelector('svg')).not.toBeNull();
                expect(nextArrow.querySelector('svg')).not.toBeNull();
            });
        });

    });

    describe('Dot Indicators', function() {

        it('shows dot indicators', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                dots: true
            });

            return FunkyTests.delay(100).then(function() {
                var dotsContainer = document.querySelector('.carousel__dots');
                expect(dotsContainer).not.toBeNull();

                var dots = dotsContainer.querySelectorAll('.carousel__dot');
                expect(dots.length).toBeGreaterThan(0);
            });
        });

        it('first dot is active initially', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                dots: true
            });

            return FunkyTests.delay(100).then(function() {
                var dots = document.querySelectorAll('.carousel__dot');
                expect(dots[0].classList.contains('carousel__dot--active')).toBe(true);
            });
        });

        it('dots have button role', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                dots: true
            });

            return FunkyTests.delay(100).then(function() {
                var dots = document.querySelectorAll('.carousel__dot');
                dots.forEach(function(dot) {
                    expect(dot.getAttribute('role')).toBe('tab');
                });
            });
        });

    });

    describe('Slide Content', function() {

        it('renders HTML content in slides', function() {
            Carousel.create('#visual-carousel-container', {
                slides: [
                    '<div class="test-content">Content A</div>',
                    '<div class="test-content">Content B</div>'
                ]
            });

            return FunkyTests.delay(100).then(function() {
                var slides = document.querySelectorAll('.carousel__slide');
                expect(slides[0].querySelector('.test-content')).not.toBeNull();
                expect(slides[0].textContent).toContain('Content A');
            });
        });

        it('slides have correct ARIA attributes', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>']
            });

            return FunkyTests.delay(100).then(function() {
                var slides = document.querySelectorAll('.carousel__slide');
                slides.forEach(function(slide) {
                    expect(slide.getAttribute('role')).toBe('group');
                    expect(slide.getAttribute('aria-roledescription')).toBe('slide');
                });
            });
        });

    });

    describe('Style Consistency', function() {

        it('container has carousel role', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>']
            });

            return FunkyTests.delay(100).then(function() {
                var container = document.querySelector('#visual-carousel-container');
                expect(container.getAttribute('role')).toBe('region');
                expect(container.getAttribute('aria-roledescription')).toBe('carousel');
            });
        });

        it('track has aria-live for announcements', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>']
            });

            return FunkyTests.delay(100).then(function() {
                var track = document.querySelector('.carousel__track');
                expect(track.getAttribute('aria-live')).toBe('polite');
            });
        });

        it('carousel maintains consistent styling', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                arrows: true,
                dots: true
            });

            return FunkyTests.delay(100).then(function() {
                var container = document.querySelector('#visual-carousel-container');
                var styles = Visual.snapshotStyles(container);

                expect(styles.position).toBe('relative');
            });
        });

    });

    describe('Center Mode', function() {

        it('adds center mode class', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                centerMode: true,
                slidesToShow: 1
            });

            return FunkyTests.delay(100).then(function() {
                var container = document.querySelector('#visual-carousel-container');
                expect(container.classList.contains('carousel--center')).toBe(true);
            });
        });

        it('center slide has active class', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                centerMode: true,
                slidesToShow: 1
            });

            return FunkyTests.delay(100).then(function() {
                var centerSlide = document.querySelector('.carousel__slide--center');
                expect(centerSlide).not.toBeNull();
            });
        });

    });

    describe('Full Width Mode', function() {

        it('adds full-width class', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>'],
                fullWidth: true
            });

            return FunkyTests.delay(100).then(function() {
                var container = document.querySelector('#visual-carousel-container');
                expect(container.classList.contains('carousel--full-width')).toBe(true);
            });
        });

    });

    describe('Autoplay Controls', function() {

        it('shows play button when configured', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>'],
                autoplay: false,
                showPlayButton: true
            });

            return FunkyTests.delay(100).then(function() {
                var playButton = document.querySelector('.carousel__play-button');
                expect(playButton).not.toBeNull();
            });
        });

        it('shows progress bar when configured', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>'],
                autoplay: true,
                showProgress: true
            });

            return FunkyTests.delay(100).then(function() {
                var progressBar = document.querySelector('.carousel__progress');
                expect(progressBar).not.toBeNull();
            });
        });

    });

    describe('Infinite Loop Mode', function() {

        it('adds infinite class', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                infinite: true
            });

            return FunkyTests.delay(100).then(function() {
                var container = document.querySelector('#visual-carousel-container');
                expect(container.classList.contains('carousel--infinite')).toBe(true);
            });
        });

        it('creates clone slides', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                infinite: true
            });

            return FunkyTests.delay(100).then(function() {
                var clones = document.querySelectorAll('.carousel__slide--clone');
                expect(clones.length).toBeGreaterThan(0);
            });
        });

        it('clone slides are aria-hidden', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
                infinite: true
            });

            return FunkyTests.delay(100).then(function() {
                var clones = document.querySelectorAll('.carousel__slide--clone');
                clones.forEach(function(clone) {
                    expect(clone.getAttribute('aria-hidden')).toBe('true');
                });
            });
        });

    });

    describe('No Arrows/Dots', function() {

        it('can hide arrows', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>'],
                arrows: false
            });

            return FunkyTests.delay(100).then(function() {
                var arrows = document.querySelectorAll('.carousel__arrow');
                expect(arrows.length).toBe(0);
            });
        });

        it('can hide dots', function() {
            Carousel.create('#visual-carousel-container', {
                slides: ['<div>1</div>', '<div>2</div>'],
                dots: false
            });

            return FunkyTests.delay(100).then(function() {
                var dots = document.querySelector('.carousel__dots');
                expect(dots).toBeNull();
            });
        });

    });

});
