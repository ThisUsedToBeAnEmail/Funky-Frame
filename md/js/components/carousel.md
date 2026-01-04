# Funky.Carousel

Responsive slide/card carousel with touch, keyboard, and autoplay support.

## Overview

`Funky.Carousel` creates a fully-featured carousel/slider component with:
- Touch/swipe and mouse drag support via GestureTracker
- Keyboard navigation
- Autoplay with pause controls
- Responsive breakpoints
- Center mode and peek mode
- Lazy loading for images
- Infinite loop option
- Fullscreen mode
- Full-width layouts
- ARIA accessibility

## Quick Start

```javascript
// Basic carousel
var carousel = Funky.Carousel.init('#my-carousel', {
  slidesToShow: 3,
  slidesToScroll: 1,
  gap: 16
});

// From existing markup
Funky.Carousel.init('.product-slider');
```

## API Reference

### Factory Methods

#### `Funky.Carousel.init(container, options)`

Initialize a carousel instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string/Element | Yes | Container element or selector |
| options | object | No | Configuration options |

**Returns:** `FunkyCarousel` instance

---

#### `Funky.Carousel.getInstance(idOrElement)`

Get carousel by ID or element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| idOrElement | string/Element | Yes | Container element ID or element |

**Returns:** `FunkyCarousel` or `null`

---

#### `Funky.Carousel.destroy(idOrElement)`

Destroy carousel by ID or element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| idOrElement | string/Element | Yes | Container element ID or element |

---

#### `Funky.Carousel.getAll()`

Get all carousel instances.

**Returns:** `{ id: FunkyCarousel }` map

---

#### `Funky.Carousel.destroyAll()`

Destroy all carousel instances.

---

### Configuration Options

#### Core Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| slidesToShow | number | `1` | Slides visible at once |
| slidesToScroll | number | `1` | Slides to move per action |
| initialSlide | number | `0` | Starting slide index |
| gap | number/string | `16` | Gap between slides (px) |
| slides | array | `null` | Array of slide content |
| slideSelector | string | `'.carousel__slide'` | Selector for existing slides |

#### Animation
| Name | Type | Default | Description |
|------|------|---------|-------------|
| speed | number | `400` | Transition duration (ms) |
| easing | string | `'ease-out'` | CSS easing function |

#### Navigation
| Name | Type | Default | Description |
|------|------|---------|-------------|
| arrows | boolean | `true` | Show prev/next arrows |
| arrowsInside | boolean | `false` | Place arrows inside viewport |
| dots | boolean | `true` | Show dot indicators |
| dotsPosition | string | `'bottom'` | Dots position: `'bottom'`, `'top'`, `'outside'` |
| keyboard | boolean | `true` | Enable keyboard navigation |
| keyboardScope | string | `'focused'` | Keyboard nav scope: `'focused'` or `'always'` |
| swipe | boolean | `true` | Enable swipe gestures |
| draggable | boolean | `true` | Enable mouse drag |

#### Autoplay
| Name | Type | Default | Description |
|------|------|---------|-------------|
| autoplay | boolean | `false` | Enable autoplay |
| autoplaySpeed | number | `5000` | Interval between slides (ms) |
| pauseOnHover | boolean | `true` | Pause on mouse hover |
| pauseOnFocus | boolean | `true` | Pause when focused |
| pauseOnInteraction | boolean | `true` | Stop after user action |
| showPlayButton | boolean | `false` | Show play/pause toggle |
| showProgress | boolean | `false` | Show progress bar |

#### Layout Modes
| Name | Type | Default | Description |
|------|------|---------|-------------|
| infinite | boolean | `false` | Enable infinite loop |
| centerMode | boolean | `false` | Center active slide |
| centerPadding | string | `'50px'` | Side padding in center mode |
| fullscreen | boolean | `false` | Show fullscreen button |
| fullWidth | boolean | `false` | Stretch carousel to full viewport width |
| fullWidthSlides | boolean | `false` | Each slide takes 100% width (one at a time) |

#### Lazy Loading
| Name | Type | Default | Description |
|------|------|---------|-------------|
| lazyLoad | boolean/string | `false` | `'ondemand'` or `'progressive'` |
| lazyLoadAhead | number | `1` | Slides ahead to preload |

#### Responsive
| Name | Type | Default | Description |
|------|------|---------|-------------|
| responsive | array | `null` | Breakpoint configurations |
| autoResponsive | boolean | `true` | Auto-generate breakpoints when `slidesToShow > 1` |

#### Accessibility
| Name | Type | Default | Description |
|------|------|---------|-------------|
| ariaLabel | string | `'Carousel'` | Accessible carousel label |
| respectReducedMotion | boolean | `true` | Honor prefers-reduced-motion |

---

### Instance Methods

#### Navigation

##### `next()`
Go to next slide(s).

---

##### `prev()`
Go to previous slide(s).

---

##### `goTo(index, animate)`
Go to specific slide.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| index | number | - | Target slide index |
| animate | boolean | `true` | Animate transition |

---

#### State

##### `getCurrentIndex()`
**Returns:** Current slide index (number)

---

##### `getSlideCount()`
**Returns:** Total slide count (number)

---

##### `canGoNext()`
**Returns:** `true` if can advance

---

##### `canGoPrev()`
**Returns:** `true` if can go back

---

#### Autoplay Control

##### `toggleAutoplay()`
Toggle autoplay on/off.

**Returns:** `boolean` - New autoplay state (`true` = playing)

---

##### `startAutoplay()`
Start autoplay if not already running.

---

##### `stopAutoplay()`
Stop autoplay completely.

---

##### `isAutoplayActive()`
Check if autoplay is currently active.

**Returns:** `boolean`

---

#### Fullscreen Control

##### `enterFullscreen()`
Enter fullscreen mode (requires `fullscreen: true` option).

---

##### `exitFullscreen()`
Exit fullscreen mode.

---

##### `toggleFullscreen()`
Toggle fullscreen mode.

**Returns:** `boolean` - New fullscreen state

---

##### `isFullscreen()`
Check if currently in fullscreen mode.

**Returns:** `boolean`

---

#### Lifecycle

##### `refresh()`
Recalculate dimensions (call after container resize).

---

##### `destroy()`
Destroy carousel and clean up.

---

## Events (PubSub)

Subscribe to carousel events via `Funky.PubSub.on()`:

### Navigation Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:carousel:beforeChange` | `{ carousel, currentIndex, nextIndex }` | Before slide change |
| `funky:carousel:change` | `{ carousel, index, previousIndex }` | Slide changed |

### Touch/Drag Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:carousel:drag:start` | `{ carousel, x }` | Drag started |
| `funky:carousel:drag` | `{ carousel, deltaX, direction }` | During drag |
| `funky:carousel:drag:end` | `{ carousel, fromIndex, toIndex }` | Drag ended |
| `funky:carousel:swipe` | `{ carousel, direction }` | Quick swipe detected |

### Keyboard Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:carousel:keyboard` | `{ carousel, key }` | Keyboard navigation used |

### Autoplay Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:carousel:autoplay:start` | `{ carousel }` | Autoplay started |
| `funky:carousel:autoplay:stop` | `{ carousel }` | Autoplay stopped |
| `funky:carousel:autoplay:pause` | `{ carousel, reason }` | Autoplay paused |
| `funky:carousel:autoplay:resume` | `{ carousel, reason }` | Autoplay resumed |

### Advanced Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:carousel:breakpoint` | `{ carousel, breakpoint, settings }` | Breakpoint changed |
| `funky:carousel:lazyload` | `{ carousel, slide, image }` | Image lazy loaded |
| `funky:carousel:fullscreen` | `{ carousel, isFullscreen }` | Fullscreen toggled |

### Lifecycle Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:carousel:init` | `{ carousel }` | Carousel initialized |
| `funky:carousel:destroy` | `{ carousel }` | Carousel destroyed |

---

## CSS Classes

| Class | Description |
|-------|-------------|
| `.carousel` | Main container |
| `.carousel__viewport` | Overflow container |
| `.carousel__track` | Slide track |
| `.carousel__slide` | Individual slide |
| `.carousel__slide--active` | Currently active slide |
| `.carousel__slide--center` | Centered slide (center mode) |
| `.carousel__slide--clone` | Cloned slide (infinite mode) |
| `.carousel__slide--lazy` | Lazy loading slide |
| `.carousel__slide--loaded` | Lazy loaded slide |
| `.carousel__arrow` | Arrow button |
| `.carousel__arrow--prev` | Previous arrow |
| `.carousel__arrow--next` | Next arrow |
| `.carousel__arrow--disabled` | Disabled arrow state |
| `.carousel__dots` | Dot container |
| `.carousel__dot` | Individual dot |
| `.carousel__dot--active` | Active dot |
| `.carousel__play-button` | Play/pause button |
| `.carousel__progress` | Progress bar container |
| `.carousel__progress-fill` | Progress bar fill |
| `.carousel__fullscreen-button` | Fullscreen toggle |
| `.carousel--dragging` | During drag/swipe |
| `.carousel--autoplay` | Autoplay active |
| `.carousel--center` | Center mode enabled |
| `.carousel--infinite` | Infinite mode enabled |
| `.carousel--fullscreen` | Fullscreen mode |
| `.carousel--full-width` | Full viewport width mode |
| `.carousel--cards` | Card-style slides |
| `.carousel--images` | Full-bleed images |

---

## CSS Custom Properties

```css
:root {
  /* Layout */
  --carousel-gap: 16px;
  --carousel-border-radius: var(--pro-radius-md, 8px);
  
  /* Slide */
  --carousel-slide-bg: var(--pro-surface-bg, #ffffff);
  --carousel-slide-border: var(--pro-border-color, #e1e4e8);
  --carousel-slide-shadow: var(--pro-shadow-sm);
  
  /* Animation */
  --carousel-transition-speed: 400ms;
  --carousel-easing: ease-out;
}
```

---

## Callbacks

| Name | Parameters | Description |
|------|------------|-------------|
| onInit | `(carousel)` | After initialization |
| onDestroy | `()` | Before destruction |
| onSlideChange | `(index, previousIndex)` | After slide changes |
| onSwipe | `(direction)` | After swipe gesture |
| onDragStart | `()` | When drag starts |
| onDragEnd | `(fromIndex, toIndex)` | When drag ends |
| onArrowClick | `(direction)` | When arrow clicked |
| onAutoplayStart | `()` | When autoplay starts |
| onAutoplayStop | `()` | When autoplay stops |
| onAutoplayPause | `(reason)` | When autoplay pauses |
| onAutoplayResume | `(reason)` | When autoplay resumes |
| onBreakpoint | `(breakpoint)` | Breakpoint changed |
| onLazyLoad | `(slide, image)` | When image lazy loaded |
| onFullscreenChange | `(isFullscreen)` | Fullscreen toggled |

---

## Examples

### Basic Image Carousel

```javascript
var carousel = Funky.Carousel.init('#gallery', {
  slidesToShow: 1,
  dots: true,
  arrows: true,
  lazyLoad: 'ondemand'
});
```

### Product Cards

```javascript
var carousel = Funky.Carousel.init('#products', {
  slidesToShow: 4,
  slidesToScroll: 2,
  gap: 24,
  responsive: [
    { breakpoint: 1200, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 480, settings: { slidesToShow: 1 } }
  ]
});
```

### Autoplay Hero Slider

```javascript
var carousel = Funky.Carousel.init('#hero', {
  slidesToShow: 1,
  autoplay: true,
  autoplaySpeed: 6000,
  pauseOnHover: true,
  showProgress: true,
  infinite: true
});

// Programmatic autoplay control
carousel.toggleAutoplay();  // Toggle on/off
carousel.startAutoplay();   // Start
carousel.stopAutoplay();    // Stop
```

### Thumbnail Gallery

```javascript
// Main carousel
var main = Funky.Carousel.init('#main-gallery', {
  slidesToShow: 1,
  fade: true,
  syncWith: '#thumb-gallery'
});

// Thumbnail carousel
var thumbs = Funky.Carousel.init('#thumb-gallery', {
  slidesToShow: 5,
  gap: 8,
  syncWith: '#main-gallery'
});
```

### Center Mode Showcase

```javascript
var carousel = Funky.Carousel.init('#showcase', {
  centerMode: true,
  centerPadding: '80px',
  slidesToShow: 1,
  infinite: true
});
```

### Fullscreen Gallery

```javascript
var carousel = Funky.Carousel.init('#gallery', {
  slidesToShow: 1,
  fullscreen: true,  // Show fullscreen button
  dots: true,
  arrows: true
});

// Programmatic fullscreen control
carousel.enterFullscreen();   // Enter fullscreen
carousel.exitFullscreen();    // Exit fullscreen
carousel.toggleFullscreen();  // Toggle
```

### Full-Width Hero Carousel

```javascript
// Carousel stretches edge-to-edge across the viewport
var carousel = Funky.Carousel.init('#hero', {
  fullWidth: true,        // Container fills viewport width
  fullWidthSlides: true,  // Each slide takes 100% width
  infinite: true,
  autoplay: true,
  autoplaySpeed: 5000,
  arrows: true,
  dots: true
});
```

### Dynamic Slides

```javascript
var carousel = Funky.Carousel.init('#dynamic');

// Add slide
document.getElementById('add').onclick = function() {
  carousel.addSlide('<div class="slide">New Slide</div>');
};

// Remove current slide
document.getElementById('remove').onclick = function() {
  carousel.removeSlide(carousel.getCurrentIndex());
};
```

---

## Accessibility

- Container has `role="region"` with `aria-roledescription="carousel"`
- Track has `aria-live="polite"` for screen reader announcements
- Slides have `role="group"` with `aria-roledescription="slide"`
- Non-visible slides have `aria-hidden="true"`
- Arrow buttons have `aria-label` and `aria-controls`
- Dots use `role="tablist"` with `role="tab"` buttons
- Keyboard navigation: Arrow keys, Home, End
- Focus management for dots and arrows
- Respects `prefers-reduced-motion` media query

---

## Dependencies

- **Required:** Funky.Dom, Funky.PubSub
- **Optional:** Funky.GestureTracker (for enhanced touch support)
- **Optional:** Funky.Preferences (for persisting user settings)
