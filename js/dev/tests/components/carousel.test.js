/**
 * Tests for Funky.Carousel
 * Responsive slide/card carousel component
 */
FunkyTests.describe('Funky.Component.Carousel', function() {
  var expect = FunkyTests.expect;
  var container;
  var carousel;
  var Carousel;

  FunkyTests.beforeEach(function() {
    Carousel = Funky.Carousel;
    container = document.createElement('div');
    container.id = 'carousel-test-container';
    container.style.width = '600px';
    document.body.appendChild(container);
  });

  FunkyTests.afterEach(function() {
    if (carousel && carousel.destroy) {
      carousel.destroy();
      carousel = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  });

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.Carousel exists', function() {
      expect(Carousel !== undefined).toBe(true);
    });

    FunkyTests.it('is registered with Funky', function() {
      expect(Funky.isRegistered('Carousel')).toBe(true);
    });

    FunkyTests.it('has create method', function() {
      expect(typeof Carousel.create).toBe('function');
    });

    FunkyTests.it('has getInstance method', function() {
      expect(typeof Carousel.getInstance).toBe('function');
    });

    FunkyTests.it('has getAll method', function() {
      expect(typeof Carousel.getAll).toBe('function');
    });

    FunkyTests.it('has destroyAll method', function() {
      expect(typeof Carousel.destroyAll).toBe('function');
    });

    FunkyTests.it('has defaults object', function() {
      expect(typeof Carousel.defaults).toBe('object');
    });
  });

  FunkyTests.describe('Instance Creation', function() {
    FunkyTests.it('creates instance with slides array', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Slide 1</div>', '<div>Slide 2</div>', '<div>Slide 3</div>']
      });

      expect(carousel).not.toBeNull();
      expect(carousel.getSlideCount()).toBe(3);
    });

    FunkyTests.it('creates instance with selector string', function() {
      carousel = Carousel.create('#carousel-test-container', {
        slides: ['<div>A</div>', '<div>B</div>']
      });

      expect(carousel).not.toBeNull();
    });

    FunkyTests.it('creates instance from existing DOM slides', function() {
      container.innerHTML = '<div class="carousel__slide">First</div><div class="carousel__slide">Second</div>';

      carousel = Carousel.create(container);

      expect(carousel.getSlideCount()).toBe(2);
    });

    FunkyTests.it('getInstance returns the carousel by ID', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      var id = container.id;
      var retrieved = Carousel.getInstance(id);

      expect(retrieved).toBe(carousel);
    });

    FunkyTests.it('getAll returns all instances', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      var all = Carousel.getAll();

      expect(typeof all).toBe('object');
      expect(Object.keys(all).length >= 1).toBe(true);
    });
  });

  FunkyTests.describe('Configuration', function() {
    FunkyTests.it('respects initialSlide option', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        initialSlide: 1
      });

      expect(carousel.getCurrentIndex()).toBe(1);
    });

    FunkyTests.it('respects slidesToShow option', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>', '<div>4</div>'],
        slidesToShow: 2
      });

      expect(carousel.config.slidesToShow).toBe(2);
    });

    FunkyTests.it('calls onInit callback', function() {
      var initCalled = false;
      var receivedCarousel = null;

      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>'],
        onInit: function(c) {
          initCalled = true;
          receivedCarousel = c;
        }
      });

      expect(initCalled).toBe(true);
      // The callback receives the carousel instance
      expect(receivedCarousel).toBe(carousel);
    });
  });

  FunkyTests.describe('Navigation', function() {
    FunkyTests.it('next() advances to next slide', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        slidesToShow: 1
      });

      expect(carousel.getCurrentIndex()).toBe(0);

      carousel.next();

      expect(carousel.getCurrentIndex()).toBe(1);
    });

    FunkyTests.it('prev() goes to previous slide', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        slidesToShow: 1,
        initialSlide: 2
      });

      expect(carousel.getCurrentIndex()).toBe(2);

      carousel.prev();

      expect(carousel.getCurrentIndex()).toBe(1);
    });

    FunkyTests.it('goTo() navigates to specific slide', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>', '<div>4</div>'],
        slidesToShow: 1
      });

      carousel.goTo(2);

      expect(carousel.getCurrentIndex()).toBe(2);
    });

    FunkyTests.it('goTo() clamps to valid range', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        slidesToShow: 1,
        infinite: false
      });

      // Use animate: false to avoid animation blocking
      carousel.goTo(10, false);
      expect(carousel.getCurrentIndex()).toBe(2); // Max index

      carousel.goTo(-5, false);
      expect(carousel.getCurrentIndex()).toBe(0); // Min index
    });

    FunkyTests.it('calls onSlideChange callback', function() {
      var changeCalled = false;
      var newIndex = null;
      var oldIndex = null;

      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        slidesToShow: 1,
        onSlideChange: function(idx, prev) {
          changeCalled = true;
          newIndex = idx;
          oldIndex = prev;
        }
      });

      carousel.next();

      expect(changeCalled).toBe(true);
      expect(newIndex).toBe(1);
      expect(oldIndex).toBe(0);
    });
  });

  FunkyTests.describe('canGoNext and canGoPrev', function() {
    FunkyTests.it('canGoNext returns true when not at end', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        slidesToShow: 1
      });

      expect(carousel.canGoNext()).toBe(true);
    });

    FunkyTests.it('canGoNext returns false at end', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        slidesToShow: 1,
        initialSlide: 2
      });

      expect(carousel.canGoNext()).toBe(false);
    });

    FunkyTests.it('canGoPrev returns false at start', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        slidesToShow: 1
      });

      expect(carousel.canGoPrev()).toBe(false);
    });

    FunkyTests.it('canGoPrev returns true when not at start', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        slidesToShow: 1,
        initialSlide: 1
      });

      expect(carousel.canGoPrev()).toBe(true);
    });
  });

  FunkyTests.describe('DOM Structure', function() {
    FunkyTests.it('creates viewport element', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      var viewport = container.querySelector('.carousel__viewport');
      expect(viewport).not.toBeNull();
    });

    FunkyTests.it('creates track element', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      var track = container.querySelector('.carousel__track');
      expect(track).not.toBeNull();
    });

    FunkyTests.it('creates slide elements', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>']
      });

      var slides = container.querySelectorAll('.carousel__slide');
      expect(slides.length).toBe(2);
    });

    FunkyTests.it('adds carousel class to container', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      expect(container.classList.contains('carousel')).toBe(true);
    });
  });

  FunkyTests.describe('Arrows Navigation', function() {
    FunkyTests.it('creates prev and next arrows when enabled', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>'],
        arrows: true
      });

      var prevArrow = container.querySelector('.carousel__arrow--prev');
      var nextArrow = container.querySelector('.carousel__arrow--next');

      expect(prevArrow).not.toBeNull();
      expect(nextArrow).not.toBeNull();
    });

    FunkyTests.it('does not create arrows when disabled', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>'],
        arrows: false
      });

      var arrows = container.querySelectorAll('.carousel__arrow');
      expect(arrows.length).toBe(0);
    });

    FunkyTests.it('prev arrow is disabled at start', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>'],
        arrows: true,
        infinite: false
      });

      var prevArrow = container.querySelector('.carousel__arrow--prev');
      expect(prevArrow.hasAttribute('disabled')).toBe(true);
    });

    FunkyTests.it('clicking next arrow advances carousel', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        arrows: true,
        slidesToShow: 1
      });

      var nextArrow = container.querySelector('.carousel__arrow--next');
      nextArrow.click();

      expect(carousel.getCurrentIndex()).toBe(1);
    });
  });

  FunkyTests.describe('Dots Navigation', function() {
    FunkyTests.it('creates dots when enabled', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        dots: true,
        slidesToShow: 1
      });

      var dotsContainer = container.querySelector('.carousel__dots');
      expect(dotsContainer).not.toBeNull();
    });

    FunkyTests.it('creates correct number of dots', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        dots: true,
        slidesToShow: 1
      });

      var dots = container.querySelectorAll('.carousel__dot');
      expect(dots.length).toBe(3);
    });

    FunkyTests.it('does not create dots when disabled', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>'],
        dots: false
      });

      var dotsContainer = container.querySelector('.carousel__dots');
      expect(dotsContainer).toBeNull();
    });

    FunkyTests.it('clicking dot navigates to slide', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        dots: true,
        slidesToShow: 1
      });

      var dots = container.querySelectorAll('.carousel__dot');
      dots[2].click();

      expect(carousel.getCurrentIndex()).toBe(2);
    });

    FunkyTests.it('active dot has active class', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        dots: true,
        slidesToShow: 1,
        initialSlide: 1
      });

      var dots = container.querySelectorAll('.carousel__dot');
      expect(dots[1].classList.contains('carousel__dot--active')).toBe(true);
      expect(dots[0].classList.contains('carousel__dot--active')).toBe(false);
    });
  });

  FunkyTests.describe('ARIA Accessibility', function() {
    FunkyTests.it('container has role region', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      expect(container.getAttribute('role')).toBe('region');
    });

    FunkyTests.it('container has aria-roledescription carousel', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      expect(container.getAttribute('aria-roledescription')).toBe('carousel');
    });

    FunkyTests.it('slides have role group', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      var slide = container.querySelector('.carousel__slide');
      expect(slide.getAttribute('role')).toBe('group');
    });

    FunkyTests.it('slides have aria-roledescription slide', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      var slide = container.querySelector('.carousel__slide');
      expect(slide.getAttribute('aria-roledescription')).toBe('slide');
    });

    FunkyTests.it('arrows have aria-label', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>'],
        arrows: true
      });

      var prevArrow = container.querySelector('.carousel__arrow--prev');
      var nextArrow = container.querySelector('.carousel__arrow--next');

      expect(prevArrow.getAttribute('aria-label')).toBe('Previous slide');
      expect(nextArrow.getAttribute('aria-label')).toBe('Next slide');
    });
  });

  FunkyTests.describe('Refresh', function() {
    FunkyTests.it('refresh() recalculates dimensions', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>']
      });

      // Change container width
      container.style.width = '800px';

      var noError = true;
      try {
        carousel.refresh();
      } catch (e) {
        noError = false;
      }

      expect(noError).toBe(true);
    });
  });

  FunkyTests.describe('Destroy', function() {
    FunkyTests.it('destroy() removes carousel class', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      carousel.destroy();

      expect(container.classList.contains('carousel')).toBe(false);
      carousel = null; // Prevent double-destroy in afterEach
    });

    FunkyTests.it('destroy() clears container', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      carousel.destroy();

      expect(container.innerHTML).toBe('');
      carousel = null;
    });

    FunkyTests.it('destroy() removes from getInstance', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>']
      });

      var id = container.id;
      carousel.destroy();
      carousel = null;

      var retrieved = Carousel.getInstance(id);
      expect(retrieved).toBeNull();
    });

    FunkyTests.it('destroy() calls onDestroy callback', function() {
      var destroyCalled = false;

      carousel = Carousel.create(container, {
        slides: ['<div>Test</div>'],
        onDestroy: function() {
          destroyCalled = true;
        }
      });

      carousel.destroy();
      carousel = null;

      expect(destroyCalled).toBe(true);
    });
  });

  FunkyTests.describe('SlidesToScroll', function() {
    FunkyTests.it('next() scrolls by slidesToScroll amount', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>', '<div>4</div>', '<div>5</div>'],
        slidesToShow: 1,
        slidesToScroll: 2
      });

      carousel.next();

      expect(carousel.getCurrentIndex()).toBe(2);
    });

    FunkyTests.it('prev() scrolls by slidesToScroll amount', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>', '<div>4</div>', '<div>5</div>'],
        slidesToShow: 1,
        slidesToScroll: 2,
        initialSlide: 4
      });

      carousel.prev();

      expect(carousel.getCurrentIndex()).toBe(2);
    });
  });

  FunkyTests.describe('Center Mode', function() {
    FunkyTests.it('adds center mode class when enabled', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        centerMode: true
      });

      expect(container.classList.contains('carousel--center')).toBe(true);
    });

    FunkyTests.it('center slide has center class', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        centerMode: true,
        slidesToShow: 1
      });

      var slides = container.querySelectorAll('.carousel__slide');
      expect(slides[0].classList.contains('carousel__slide--center')).toBe(true);
    });
  });

  FunkyTests.describe('Infinite Mode', function() {
    FunkyTests.it('adds infinite class when enabled', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        infinite: true
      });

      expect(container.classList.contains('carousel--infinite')).toBe(true);
    });

    FunkyTests.it('creates clone slides for infinite loop', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        infinite: true,
        slidesToShow: 1
      });

      var clones = container.querySelectorAll('.carousel__slide--clone');
      expect(clones.length > 0).toBe(true);
    });

    FunkyTests.it('arrows are not disabled in infinite mode', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>1</div>', '<div>2</div>', '<div>3</div>'],
        infinite: true,
        arrows: true
      });

      var prevArrow = container.querySelector('.carousel__arrow--prev');
      expect(prevArrow.hasAttribute('disabled')).toBe(false);
    });
  });

  FunkyTests.describe('Edge Cases', function() {
    FunkyTests.it('handles single slide carousel', function() {
      carousel = Carousel.create(container, {
        slides: ['<div>Only One</div>']
      });

      expect(carousel.getSlideCount()).toBe(1);
      expect(carousel.getCurrentIndex()).toBe(0);
    });

    FunkyTests.it('handles empty slides array gracefully', function() {
      carousel = Carousel.create(container, {
        slides: []
      });

      expect(carousel.getSlideCount()).toBe(0);
    });

    FunkyTests.it('handles HTML content in slides', function() {
      carousel = Carousel.create(container, {
        slides: ['<div><h2>Title</h2><p>Content</p></div>']
      });

      var h2 = container.querySelector('.carousel__slide h2');
      expect(h2).not.toBeNull();
      expect(h2.textContent).toBe('Title');
    });
  });
});
