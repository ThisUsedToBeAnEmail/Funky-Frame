/**
 * Responsive Testing Utilities
 *
 * Helper library for testing responsive behavior across breakpoints.
 * Works with FunkyTests.simulate.resize() and simulate.matchMedia().
 *
 * @example
 *   var RTU = window.ResponsiveTestUtils;
 *   RTU.testAtBreakpoint('shows 1 slide', 'mobile', function() {
 *       expect(carousel.getSlidesPerView()).toBe(1);
 *   });
 */
(function(window) {
    'use strict';

    var ResponsiveTestUtils = {

        /**
         * Standard breakpoint definitions
         * Matches common device sizes and Funky.MediaQuery breakpoints
         */
        breakpoints: {
            mobile: { width: 375, height: 667, maxWidth: 767 },
            tablet: { width: 768, height: 1024, maxWidth: 1023 },
            desktop: { width: 1280, height: 800, maxWidth: 1919 },
            large: { width: 1920, height: 1080, maxWidth: null }
        },

        /**
         * Media query strings for each breakpoint
         */
        mediaQueries: {
            mobile: '(max-width: 767px)',
            tablet: '(min-width: 768px) and (max-width: 1023px)',
            desktop: '(min-width: 1024px) and (max-width: 1919px)',
            large: '(min-width: 1920px)',
            portrait: '(orientation: portrait)',
            landscape: '(orientation: landscape)',
            touch: '(pointer: coarse)',
            mouse: '(pointer: fine)',
            hover: '(hover: hover)',
            reducedMotion: '(prefers-reduced-motion: reduce)',
            darkMode: '(prefers-color-scheme: dark)',
            lightMode: '(prefers-color-scheme: light)'
        },

        /**
         * Run a test at a specific breakpoint
         * @param {string} name - Test name
         * @param {string} breakpoint - Breakpoint name (mobile, tablet, desktop, large)
         * @param {Function} testFn - Test function to execute
         */
        testAtBreakpoint: function(name, breakpoint, testFn) {
            var self = this;
            var bp = this.breakpoints[breakpoint];

            if (!bp) {
                throw new Error('Unknown breakpoint: ' + breakpoint);
            }

            FunkyTests.it(name + ' at ' + breakpoint + ' (' + bp.width + 'x' + bp.height + ')', function(done) {
                var restore = FunkyTests.simulate.resize(bp.width, bp.height);

                try {
                    var result = testFn();
                    // Handle async tests
                    if (result && typeof result.then === 'function') {
                        result.then(function() {
                            restore();
                            done();
                        }).catch(function(err) {
                            restore();
                            done(err);
                        });
                    } else {
                        restore();
                        done();
                    }
                } catch (e) {
                    restore();
                    throw e;
                }
            });
        },

        /**
         * Run a test at all standard breakpoints
         * @param {string} name - Test name prefix
         * @param {Function} testFn - Test function, receives breakpoint name as argument
         */
        testAllBreakpoints: function(name, testFn) {
            var self = this;
            var breakpointNames = Object.keys(this.breakpoints);

            breakpointNames.forEach(function(bpName) {
                self.testAtBreakpoint(name, bpName, function() {
                    return testFn(bpName);
                });
            });
        },

        /**
         * Run a test with a specific media query mocked
         * @param {string} name - Test name
         * @param {string} query - Media query string or preset name
         * @param {boolean} matches - Whether the query should match
         * @param {Function} testFn - Test function to execute
         */
        testWithMediaQuery: function(name, query, matches, testFn) {
            var self = this;
            // Resolve preset name to actual query
            var actualQuery = this.mediaQueries[query] || query;

            FunkyTests.it(name + ' when ' + query + ' = ' + matches, function(done) {
                var restore = FunkyTests.simulate.matchMedia(actualQuery, matches);

                try {
                    var result = testFn();
                    if (result && typeof result.then === 'function') {
                        result.then(function() {
                            restore();
                            done();
                        }).catch(function(err) {
                            restore();
                            done(err);
                        });
                    } else {
                        restore();
                        done();
                    }
                } catch (e) {
                    restore();
                    throw e;
                }
            });
        },

        /**
         * Create a resize observer mock for testing
         * @returns {Object} Mock ResizeObserver with observe/unobserve/disconnect
         */
        mockResizeObserver: function() {
            var callbacks = [];
            var observed = [];

            var MockResizeObserver = function(callback) {
                callbacks.push(callback);
                return {
                    observe: function(el) {
                        observed.push({ el: el, callback: callback });
                    },
                    unobserve: function(el) {
                        observed = observed.filter(function(item) {
                            return item.el !== el;
                        });
                    },
                    disconnect: function() {
                        observed = observed.filter(function(item) {
                            return item.callback !== callback;
                        });
                    }
                };
            };

            var originalResizeObserver = window.ResizeObserver;
            window.ResizeObserver = MockResizeObserver;

            return {
                /**
                 * Trigger resize callbacks for an element
                 * @param {HTMLElement} el - Element to report resize for
                 * @param {number} width - New width
                 * @param {number} height - New height
                 */
                trigger: function(el, width, height) {
                    observed.forEach(function(item) {
                        if (!el || item.el === el) {
                            item.callback([{
                                target: item.el,
                                contentRect: {
                                    width: width,
                                    height: height,
                                    top: 0,
                                    left: 0,
                                    bottom: height,
                                    right: width
                                },
                                borderBoxSize: [{ blockSize: height, inlineSize: width }],
                                contentBoxSize: [{ blockSize: height, inlineSize: width }]
                            }]);
                        }
                    });
                },

                /**
                 * Restore original ResizeObserver
                 */
                restore: function() {
                    window.ResizeObserver = originalResizeObserver;
                }
            };
        },

        /**
         * Assert element is visible at current viewport
         * @param {HTMLElement|string} el - Element or selector
         * @returns {boolean} Whether element is visible
         */
        isVisibleAtViewport: function(el) {
            if (typeof el === 'string') {
                el = document.querySelector(el);
            }
            if (!el) return false;

            var rect = el.getBoundingClientRect();
            var style = window.getComputedStyle(el);

            return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0' &&
                rect.width > 0 &&
                rect.height > 0
            );
        },

        /**
         * Get current simulated viewport size
         * @returns {Object} { width, height }
         */
        getViewportSize: function() {
            return {
                width: window.innerWidth,
                height: window.innerHeight
            };
        },

        /**
         * Check if current viewport matches a breakpoint
         * @param {string} breakpoint - Breakpoint name
         * @returns {boolean} Whether viewport matches breakpoint
         */
        isBreakpoint: function(breakpoint) {
            var bp = this.breakpoints[breakpoint];
            if (!bp) return false;

            var width = window.innerWidth;

            switch (breakpoint) {
                case 'mobile':
                    return width <= 767;
                case 'tablet':
                    return width >= 768 && width <= 1023;
                case 'desktop':
                    return width >= 1024 && width <= 1919;
                case 'large':
                    return width >= 1920;
                default:
                    return false;
            }
        }
    };

    // Export
    window.ResponsiveTestUtils = ResponsiveTestUtils;

    // Alias for convenience
    window.RTU = ResponsiveTestUtils;

})(window);
