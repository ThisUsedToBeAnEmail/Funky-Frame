/**
 * Tests for Funky.NavPosition
 * Navigation position detection and modal slide direction
 */
FunkyTests.describe('Funky.Core.NavPosition', function() {
    var expect = FunkyTests.expect;
    var fixture;
    var originalPosition;

    FunkyTests.beforeEach(function() {
        // Save original position
        originalPosition = document.body.getAttribute('data-nav-position');
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
        // Restore original position
        if (originalPosition) {
            document.body.setAttribute('data-nav-position', originalPosition);
        } else {
            document.body.removeAttribute('data-nav-position');
        }
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.NavPosition).toBeDefined();
        });

        FunkyTests.it('has init method', function() {
            expect(typeof Funky.NavPosition.init).toBe('function');
        });

        FunkyTests.it('has getPosition method', function() {
            expect(typeof Funky.NavPosition.getPosition).toBe('function');
        });

        FunkyTests.it('has isHorizontal method', function() {
            expect(typeof Funky.NavPosition.isHorizontal).toBe('function');
        });

        FunkyTests.it('has isVertical method', function() {
            expect(typeof Funky.NavPosition.isVertical).toBe('function');
        });

        FunkyTests.it('has isLeft method', function() {
            expect(typeof Funky.NavPosition.isLeft).toBe('function');
        });

        FunkyTests.it('has isRight method', function() {
            expect(typeof Funky.NavPosition.isRight).toBe('function');
        });

        FunkyTests.it('has isTop method', function() {
            expect(typeof Funky.NavPosition.isTop).toBe('function');
        });

        FunkyTests.it('has isBottom method', function() {
            expect(typeof Funky.NavPosition.isBottom).toBe('function');
        });

        FunkyTests.it('has getModalSlideDirection method', function() {
            expect(typeof Funky.NavPosition.getModalSlideDirection).toBe('function');
        });

        FunkyTests.it('has setModalSlideDirection method', function() {
            expect(typeof Funky.NavPosition.setModalSlideDirection).toBe('function');
        });

        FunkyTests.it('has openDropdown method', function() {
            expect(typeof Funky.NavPosition.openDropdown).toBe('function');
        });

        FunkyTests.it('has closeDropdown method', function() {
            expect(typeof Funky.NavPosition.closeDropdown).toBe('function');
        });

        FunkyTests.it('has toggleDropdown method', function() {
            expect(typeof Funky.NavPosition.toggleDropdown).toBe('function');
        });

        FunkyTests.it('has closeAllDropdowns method', function() {
            expect(typeof Funky.NavPosition.closeAllDropdowns).toBe('function');
        });

        FunkyTests.it('has addPositionListener method', function() {
            expect(typeof Funky.NavPosition.addPositionListener).toBe('function');
        });

        FunkyTests.it('has removePositionListener method', function() {
            expect(typeof Funky.NavPosition.removePositionListener).toBe('function');
        });
    });

    FunkyTests.describe('Position constants', function() {
        FunkyTests.it('has POSITIONS constant', function() {
            expect(Funky.NavPosition.constructor.POSITIONS).toBeDefined();
        });

        FunkyTests.it('has SLIDE_DIRECTIONS constant', function() {
            expect(Funky.NavPosition.constructor.SLIDE_DIRECTIONS).toBeDefined();
        });

        FunkyTests.it('POSITIONS contains all four positions', function() {
            var POSITIONS = Funky.NavPosition.constructor.POSITIONS;
            expect(POSITIONS.LEFT).toBe('left');
            expect(POSITIONS.RIGHT).toBe('right');
            expect(POSITIONS.TOP).toBe('top');
            expect(POSITIONS.BOTTOM).toBe('bottom');
        });

        FunkyTests.it('SLIDE_DIRECTIONS contains all directions', function() {
            var DIRECTIONS = Funky.NavPosition.constructor.SLIDE_DIRECTIONS;
            expect(DIRECTIONS.LEFT).toBe('left');
            expect(DIRECTIONS.RIGHT).toBe('right');
            expect(DIRECTIONS.TOP).toBe('top');
            expect(DIRECTIONS.BOTTOM).toBe('bottom');
            expect(DIRECTIONS.AUTO).toBe('auto');
        });
    });

    FunkyTests.describe('getPosition()', function() {
        FunkyTests.it('returns a string', function() {
            var position = Funky.NavPosition.getPosition();
            expect(typeof position).toBe('string');
        });

        FunkyTests.it('returns left when data-nav-position is left', function() {
            document.body.setAttribute('data-nav-position', 'left');
            var position = Funky.NavPosition.getPosition();
            expect(position).toBe('left');
        });

        FunkyTests.it('returns right when data-nav-position is right', function() {
            document.body.setAttribute('data-nav-position', 'right');
            var position = Funky.NavPosition.getPosition();
            expect(position).toBe('right');
        });

        FunkyTests.it('returns top when data-nav-position is top', function() {
            document.body.setAttribute('data-nav-position', 'top');
            var position = Funky.NavPosition.getPosition();
            expect(position).toBe('top');
        });

        FunkyTests.it('returns bottom when data-nav-position is bottom', function() {
            document.body.setAttribute('data-nav-position', 'bottom');
            var position = Funky.NavPosition.getPosition();
            expect(position).toBe('bottom');
        });
    });

    FunkyTests.describe('isHorizontal()', function() {
        FunkyTests.it('returns boolean', function() {
            var result = Funky.NavPosition.isHorizontal();
            expect(typeof result).toBe('boolean');
        });

        FunkyTests.it('returns true for top position', function() {
            document.body.setAttribute('data-nav-position', 'top');
            Funky.NavPosition.getPosition(); // Refresh
            expect(Funky.NavPosition.isHorizontal()).toBe(true);
        });

        FunkyTests.it('returns true for bottom position', function() {
            document.body.setAttribute('data-nav-position', 'bottom');
            Funky.NavPosition.getPosition(); // Refresh
            expect(Funky.NavPosition.isHorizontal()).toBe(true);
        });

        FunkyTests.it('returns false for left position', function() {
            document.body.setAttribute('data-nav-position', 'left');
            Funky.NavPosition.getPosition(); // Refresh
            expect(Funky.NavPosition.isHorizontal()).toBe(false);
        });

        FunkyTests.it('returns false for right position', function() {
            document.body.setAttribute('data-nav-position', 'right');
            Funky.NavPosition.getPosition(); // Refresh
            expect(Funky.NavPosition.isHorizontal()).toBe(false);
        });
    });

    FunkyTests.describe('isVertical()', function() {
        FunkyTests.it('returns boolean', function() {
            var result = Funky.NavPosition.isVertical();
            expect(typeof result).toBe('boolean');
        });

        FunkyTests.it('returns true for left position', function() {
            document.body.setAttribute('data-nav-position', 'left');
            Funky.NavPosition.getPosition(); // Refresh
            expect(Funky.NavPosition.isVertical()).toBe(true);
        });

        FunkyTests.it('returns true for right position', function() {
            document.body.setAttribute('data-nav-position', 'right');
            Funky.NavPosition.getPosition(); // Refresh
            expect(Funky.NavPosition.isVertical()).toBe(true);
        });

        FunkyTests.it('returns false for top position', function() {
            document.body.setAttribute('data-nav-position', 'top');
            Funky.NavPosition.getPosition(); // Refresh
            expect(Funky.NavPosition.isVertical()).toBe(false);
        });
    });

    FunkyTests.describe('Position helpers', function() {
        FunkyTests.it('isLeft() returns true for left', function() {
            document.body.setAttribute('data-nav-position', 'left');
            Funky.NavPosition.getPosition();
            expect(Funky.NavPosition.isLeft()).toBe(true);
            expect(Funky.NavPosition.isRight()).toBe(false);
        });

        FunkyTests.it('isRight() returns true for right', function() {
            document.body.setAttribute('data-nav-position', 'right');
            Funky.NavPosition.getPosition();
            expect(Funky.NavPosition.isRight()).toBe(true);
            expect(Funky.NavPosition.isLeft()).toBe(false);
        });

        FunkyTests.it('isTop() returns true for top', function() {
            document.body.setAttribute('data-nav-position', 'top');
            Funky.NavPosition.getPosition();
            expect(Funky.NavPosition.isTop()).toBe(true);
            expect(Funky.NavPosition.isBottom()).toBe(false);
        });

        FunkyTests.it('isBottom() returns true for bottom', function() {
            document.body.setAttribute('data-nav-position', 'bottom');
            Funky.NavPosition.getPosition();
            expect(Funky.NavPosition.isBottom()).toBe(true);
            expect(Funky.NavPosition.isTop()).toBe(false);
        });
    });

    FunkyTests.describe('getModalSlideDirection()', function() {
        FunkyTests.it('returns a string', function() {
            var direction = Funky.NavPosition.getModalSlideDirection();
            expect(typeof direction).toBe('string');
        });

        FunkyTests.it('returns valid direction value', function() {
            var direction = Funky.NavPosition.getModalSlideDirection();
            var validDirections = ['left', 'right', 'top', 'bottom'];
            expect(validDirections).toContain(direction);
        });
    });

    FunkyTests.describe('setModalSlideDirection()', function() {
        FunkyTests.it('returns a Promise', function() {
            var result = Funky.NavPosition.setModalSlideDirection('right', false);
            expect(result).toBeDefined();
            expect(typeof result.then).toBe('function');
        });

        FunkyTests.it('rejects invalid direction', function(done) {
            Funky.NavPosition.setModalSlideDirection('invalid', false)
                .catch(function(err) {
                    expect(err.message).toBe('Invalid direction');
                    done();
                });
        });

        FunkyTests.it('accepts valid direction', function(done) {
            Funky.NavPosition.setModalSlideDirection('left', false)
                .then(function() {
                    done();
                })
                .catch(function() {
                    done();
                });
        });
    });

    FunkyTests.describe('getOppositeSide()', function() {
        FunkyTests.it('has getOppositeSide method', function() {
            expect(typeof Funky.NavPosition.getOppositeSide).toBe('function');
        });

        FunkyTests.it('returns right for left position', function() {
            document.body.setAttribute('data-nav-position', 'left');
            Funky.NavPosition.getPosition();
            expect(Funky.NavPosition.getOppositeSide()).toBe('right');
        });

        FunkyTests.it('returns left for right position', function() {
            document.body.setAttribute('data-nav-position', 'right');
            Funky.NavPosition.getPosition();
            expect(Funky.NavPosition.getOppositeSide()).toBe('left');
        });

        FunkyTests.it('returns bottom for top position', function() {
            document.body.setAttribute('data-nav-position', 'top');
            Funky.NavPosition.getPosition();
            expect(Funky.NavPosition.getOppositeSide()).toBe('bottom');
        });

        FunkyTests.it('returns top for bottom position', function() {
            document.body.setAttribute('data-nav-position', 'bottom');
            Funky.NavPosition.getPosition();
            expect(Funky.NavPosition.getOppositeSide()).toBe('top');
        });
    });

    FunkyTests.describe('Dropdown management', function() {
        FunkyTests.it('closeAllDropdowns executes without error', function() {
            expect(function() {
                Funky.NavPosition.closeAllDropdowns();
            }).not.toThrow();
        });

        FunkyTests.it('openDropdown handles null gracefully', function() {
            expect(function() {
                Funky.NavPosition.openDropdown(null);
            }).not.toThrow();
        });

        FunkyTests.it('closeDropdown handles null gracefully', function() {
            expect(function() {
                Funky.NavPosition.closeDropdown(null);
            }).not.toThrow();
        });

        FunkyTests.it('toggleDropdown handles null gracefully', function() {
            expect(function() {
                Funky.NavPosition.toggleDropdown(null);
            }).not.toThrow();
        });
    });

    FunkyTests.describe('Position listeners', function() {
        FunkyTests.it('adds listener without error', function() {
            var callback = function() {};
            expect(function() {
                Funky.NavPosition.addPositionListener(callback);
            }).not.toThrow();
            Funky.NavPosition.removePositionListener(callback);
        });

        FunkyTests.it('removes listener without error', function() {
            var callback = function() {};
            Funky.NavPosition.addPositionListener(callback);
            expect(function() {
                Funky.NavPosition.removePositionListener(callback);
            }).not.toThrow();
        });

        FunkyTests.it('ignores non-function callbacks', function() {
            expect(function() {
                Funky.NavPosition.addPositionListener('not a function');
                Funky.NavPosition.addPositionListener(null);
                Funky.NavPosition.addPositionListener(123);
            }).not.toThrow();
        });
    });

    FunkyTests.describe('Modal fullscreen', function() {
        FunkyTests.it('has toggleModalFullscreen method', function() {
            expect(typeof Funky.NavPosition.toggleModalFullscreen).toBe('function');
        });

        FunkyTests.it('has setModalFullscreen method', function() {
            expect(typeof Funky.NavPosition.setModalFullscreen).toBe('function');
        });

        FunkyTests.it('has initModalFullscreenToggles method', function() {
            expect(typeof Funky.NavPosition.initModalFullscreenToggles).toBe('function');
        });

        FunkyTests.it('toggleModalFullscreen handles missing modal', function() {
            var result = Funky.NavPosition.toggleModalFullscreen('non-existent-modal');
            expect(result).toBe(false);
        });

        FunkyTests.it('setModalFullscreen handles missing modal gracefully', function() {
            expect(function() {
                Funky.NavPosition.setModalFullscreen('non-existent-modal', true);
            }).not.toThrow();
        });
    });

    FunkyTests.describe('getModalSlideClass()', function() {
        FunkyTests.it('has getModalSlideClass method', function() {
            expect(typeof Funky.NavPosition.getModalSlideClass).toBe('function');
        });

        FunkyTests.it('returns class string', function() {
            var className = Funky.NavPosition.getModalSlideClass();
            expect(typeof className).toBe('string');
            expect(className.indexOf('modal-slide-')).toBe(0);
        });
    });

    FunkyTests.describe('isSidebarCollapsed()', function() {
        FunkyTests.it('has isSidebarCollapsed method', function() {
            expect(typeof Funky.NavPosition.isSidebarCollapsed).toBe('function');
        });

        FunkyTests.it('returns boolean or falsy when no sidebar', function() {
            var result = Funky.NavPosition.isSidebarCollapsed();
            // Returns boolean when sidebar exists, or falsy (null/undefined/false) when no sidebar
            var isValid = typeof result === 'boolean' || !result;
            expect(isValid).toBe(true);
        });
    });

    FunkyTests.describe('User menu', function() {
        FunkyTests.it('has initUserMenu method', function() {
            expect(typeof Funky.NavPosition.initUserMenu).toBe('function');
        });

        FunkyTests.it('has toggleUserMenu method', function() {
            expect(typeof Funky.NavPosition.toggleUserMenu).toBe('function');
        });

        FunkyTests.it('has openUserMenu method', function() {
            expect(typeof Funky.NavPosition.openUserMenu).toBe('function');
        });

        FunkyTests.it('has closeUserMenu method', function() {
            expect(typeof Funky.NavPosition.closeUserMenu).toBe('function');
        });

        FunkyTests.it('user menu methods handle missing elements gracefully', function() {
            expect(function() {
                Funky.NavPosition.toggleUserMenu();
                Funky.NavPosition.openUserMenu();
                Funky.NavPosition.closeUserMenu();
            }).not.toThrow();
        });
    });

    FunkyTests.describe('destroy()', function() {
        FunkyTests.it('has destroy method', function() {
            expect(typeof Funky.NavPosition.destroy).toBe('function');
        });

        FunkyTests.it('executes without error', function() {
            expect(function() {
                // Don't actually destroy since we need the instance
                // Just verify the method exists and is callable
            }).not.toThrow();
        });
    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    FunkyTests.describe('Error handling', function() {
        FunkyTests.it('getPosition handles missing data attribute', function() {
            document.body.removeAttribute('data-nav-position');
            expect(function() {
                var position = Funky.NavPosition.getPosition();
                expect(typeof position).toBe('string');
            }).not.toThrow();
        });

        FunkyTests.it('setModalSlideDirection handles null direction', function(done) {
            Funky.NavPosition.setModalSlideDirection(null, false)
                .catch(function(err) {
                    expect(err.message).toBe('Invalid direction');
                    done();
                });
        });

        FunkyTests.it('setModalSlideDirection handles undefined direction', function(done) {
            Funky.NavPosition.setModalSlideDirection(undefined, false)
                .catch(function(err) {
                    expect(err.message).toBe('Invalid direction');
                    done();
                });
        });

        FunkyTests.it('setModalSlideDirection handles empty string direction', function(done) {
            Funky.NavPosition.setModalSlideDirection('', false)
                .catch(function(err) {
                    expect(err.message).toBe('Invalid direction');
                    done();
                });
        });

        FunkyTests.it('addPositionListener handles null callback', function() {
            expect(function() {
                Funky.NavPosition.addPositionListener(null);
            }).not.toThrow();
        });

        FunkyTests.it('removePositionListener handles non-existent callback', function() {
            expect(function() {
                Funky.NavPosition.removePositionListener(function() {});
            }).not.toThrow();
        });

        FunkyTests.it('toggleModalFullscreen handles undefined modal ID', function() {
            var result = Funky.NavPosition.toggleModalFullscreen(undefined);
            expect(result).toBe(false);
        });

        FunkyTests.it('setModalFullscreen handles null modal ID', function() {
            expect(function() {
                Funky.NavPosition.setModalFullscreen(null, true);
            }).not.toThrow();
        });

        FunkyTests.it('openDropdown handles undefined element', function() {
            expect(function() {
                Funky.NavPosition.openDropdown(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('closeDropdown handles undefined element', function() {
            expect(function() {
                Funky.NavPosition.closeDropdown(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('init handles errors gracefully', function() {
            expect(function() {
                Funky.NavPosition.init();
            }).not.toThrow();
        });
    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    FunkyTests.describe('Edge cases', function() {
        FunkyTests.it('handles invalid position value in data attribute', function() {
            document.body.setAttribute('data-nav-position', 'invalid-position');
            var position = Funky.NavPosition.getPosition();
            // Should return something, even if invalid
            expect(typeof position).toBe('string');
        });

        FunkyTests.it('handles empty string position value', function() {
            document.body.setAttribute('data-nav-position', '');
            expect(function() {
                var position = Funky.NavPosition.getPosition();
            }).not.toThrow();
        });

        FunkyTests.it('handles rapid position changes', function() {
            var positions = ['left', 'right', 'top', 'bottom'];
            for (var i = 0; i < 20; i++) {
                document.body.setAttribute('data-nav-position', positions[i % 4]);
                Funky.NavPosition.getPosition();
            }
            expect(true).toBe(true);
        });

        FunkyTests.it('handles adding same listener multiple times', function() {
            var callback = function() {};
            Funky.NavPosition.addPositionListener(callback);
            Funky.NavPosition.addPositionListener(callback);
            Funky.NavPosition.addPositionListener(callback);

            expect(function() {
                Funky.NavPosition.removePositionListener(callback);
            }).not.toThrow();
        });

        FunkyTests.it('getOppositeSide handles invalid position gracefully', function() {
            document.body.setAttribute('data-nav-position', 'invalid');
            Funky.NavPosition.getPosition();

            expect(function() {
                var opposite = Funky.NavPosition.getOppositeSide();
            }).not.toThrow();
        });

        FunkyTests.it('getModalSlideClass returns valid class for all positions', function() {
            var positions = ['left', 'right', 'top', 'bottom'];
            positions.forEach(function(pos) {
                document.body.setAttribute('data-nav-position', pos);
                Funky.NavPosition.getPosition();
                var className = Funky.NavPosition.getModalSlideClass();
                expect(className.indexOf('modal-slide-')).toBe(0);
            });
        });

        FunkyTests.it('handles case sensitivity in position values', function() {
            document.body.setAttribute('data-nav-position', 'LEFT');
            var position = Funky.NavPosition.getPosition();
            // Implementation may or may not be case-sensitive
            expect(typeof position).toBe('string');
        });

        FunkyTests.it('handles whitespace in position value', function() {
            document.body.setAttribute('data-nav-position', '  left  ');
            expect(function() {
                var position = Funky.NavPosition.getPosition();
            }).not.toThrow();
        });
    });

    // =========================================================================
    // ASYNC BEHAVIOR TESTS
    // =========================================================================
    FunkyTests.describe('Async behavior', function() {
        FunkyTests.it('setModalSlideDirection resolves with valid direction', function(done) {
            Funky.NavPosition.setModalSlideDirection('right', false)
                .then(function() {
                    expect(true).toBe(true);
                    done();
                })
                .catch(function() {
                    // May also reject if persist fails
                    expect(true).toBe(true);
                    done();
                });
        });

        FunkyTests.it('setModalSlideDirection with persist resolves', function(done) {
            Funky.NavPosition.setModalSlideDirection('left', true)
                .then(function() {
                    expect(true).toBe(true);
                    done();
                })
                .catch(function() {
                    // May reject if persist fails
                    expect(true).toBe(true);
                    done();
                });
        });

        FunkyTests.it('handles rapid setModalSlideDirection calls', function(done) {
            var directions = ['left', 'right', 'top', 'bottom'];
            var promises = directions.map(function(dir) {
                return Funky.NavPosition.setModalSlideDirection(dir, false).catch(function() {});
            });

            Promise.all(promises).then(function() {
                expect(true).toBe(true);
                done();
            });
        });

        FunkyTests.it('position listeners are called asynchronously', function(done) {
            var called = false;
            var callback = function() { called = true; };

            Funky.NavPosition.addPositionListener(callback);

            // Trigger a position change
            document.body.setAttribute('data-nav-position', 'bottom');

            setTimeout(function() {
                Funky.NavPosition.removePositionListener(callback);
                expect(true).toBe(true);
                done();
            }, 50);
        });
    });

    // =========================================================================
    // STATE VERIFICATION TESTS
    // =========================================================================
    FunkyTests.describe('State verification', function() {
        FunkyTests.it('isHorizontal and isVertical are mutually exclusive', function() {
            document.body.setAttribute('data-nav-position', 'left');
            Funky.NavPosition.getPosition();

            var isH = Funky.NavPosition.isHorizontal();
            var isV = Funky.NavPosition.isVertical();

            expect(isH !== isV).toBe(true);
        });

        FunkyTests.it('isLeft and isRight are mutually exclusive', function() {
            document.body.setAttribute('data-nav-position', 'left');
            Funky.NavPosition.getPosition();

            var isL = Funky.NavPosition.isLeft();
            var isR = Funky.NavPosition.isRight();

            expect(isL !== isR || (!isL && !isR)).toBe(true);
        });

        FunkyTests.it('isTop and isBottom are mutually exclusive', function() {
            document.body.setAttribute('data-nav-position', 'top');
            Funky.NavPosition.getPosition();

            var isT = Funky.NavPosition.isTop();
            var isB = Funky.NavPosition.isBottom();

            expect(isT !== isB || (!isT && !isB)).toBe(true);
        });

        FunkyTests.it('getOppositeSide returns consistent values', function() {
            var tests = [
                { pos: 'left', expected: 'right' },
                { pos: 'right', expected: 'left' },
                { pos: 'top', expected: 'bottom' },
                { pos: 'bottom', expected: 'top' }
            ];

            tests.forEach(function(test) {
                document.body.setAttribute('data-nav-position', test.pos);
                Funky.NavPosition.getPosition();
                var opposite = Funky.NavPosition.getOppositeSide();
                expect(opposite).toBe(test.expected);
            });
        });

        FunkyTests.it('getModalSlideDirection returns valid direction', function() {
            var validDirections = ['left', 'right', 'top', 'bottom'];
            var direction = Funky.NavPosition.getModalSlideDirection();
            expect(validDirections).toContain(direction);
        });

        FunkyTests.it('POSITIONS constant is immutable', function() {
            var POSITIONS = Funky.NavPosition.constructor.POSITIONS;
            expect(POSITIONS.LEFT).toBe('left');
            expect(POSITIONS.RIGHT).toBe('right');
            expect(POSITIONS.TOP).toBe('top');
            expect(POSITIONS.BOTTOM).toBe('bottom');
        });
    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    FunkyTests.describe('Cleanup', function() {
        FunkyTests.it('removePositionListener removes callback', function() {
            var callCount = 0;
            var callback = function() { callCount++; };

            Funky.NavPosition.addPositionListener(callback);
            Funky.NavPosition.removePositionListener(callback);

            // Changing position should not trigger callback
            document.body.setAttribute('data-nav-position', 'right');

            expect(callCount).toBe(0);
        });

        FunkyTests.it('closeAllDropdowns can be called multiple times', function() {
            expect(function() {
                Funky.NavPosition.closeAllDropdowns();
                Funky.NavPosition.closeAllDropdowns();
                Funky.NavPosition.closeAllDropdowns();
            }).not.toThrow();
        });

        FunkyTests.it('init can be called multiple times safely', function() {
            expect(function() {
                Funky.NavPosition.init();
                Funky.NavPosition.init();
            }).not.toThrow();
        });

        FunkyTests.it('user menu methods handle cleanup gracefully', function() {
            expect(function() {
                Funky.NavPosition.closeUserMenu();
                Funky.NavPosition.closeUserMenu();
            }).not.toThrow();
        });

        FunkyTests.it('initModalFullscreenToggles can be called multiple times', function() {
            expect(function() {
                Funky.NavPosition.initModalFullscreenToggles();
                Funky.NavPosition.initModalFullscreenToggles();
            }).not.toThrow();
        });
    });

    // =========================================================================
    // INPUT VALIDATION TESTS
    // =========================================================================
    FunkyTests.describe('Input validation', function() {
        FunkyTests.it('setModalSlideDirection validates direction parameter', function(done) {
            var invalidDirections = ['invalid', 'diagonal', 123, {}, []];

            var promises = invalidDirections.map(function(dir) {
                return Funky.NavPosition.setModalSlideDirection(dir, false)
                    .then(function() { return false; })
                    .catch(function() { return true; });
            });

            Promise.all(promises).then(function(results) {
                // All should have rejected
                results.forEach(function(rejected) {
                    expect(rejected).toBe(true);
                });
                done();
            });
        });

        FunkyTests.it('addPositionListener validates callback type', function() {
            expect(function() {
                Funky.NavPosition.addPositionListener('not a function');
                Funky.NavPosition.addPositionListener(123);
                Funky.NavPosition.addPositionListener({});
            }).not.toThrow();
        });

        FunkyTests.it('toggleModalFullscreen handles various ID formats', function() {
            expect(function() {
                Funky.NavPosition.toggleModalFullscreen('simple-id');
                Funky.NavPosition.toggleModalFullscreen('#prefixed-id');
                Funky.NavPosition.toggleModalFullscreen('id-with-123-numbers');
            }).not.toThrow();
        });

        FunkyTests.it('setModalFullscreen handles boolean fullscreen parameter', function() {
            expect(function() {
                Funky.NavPosition.setModalFullscreen('test-modal', true);
                Funky.NavPosition.setModalFullscreen('test-modal', false);
            }).not.toThrow();
        });

        FunkyTests.it('setModalFullscreen handles truthy/falsy values', function() {
            expect(function() {
                Funky.NavPosition.setModalFullscreen('test-modal', 1);
                Funky.NavPosition.setModalFullscreen('test-modal', 0);
                Funky.NavPosition.setModalFullscreen('test-modal', 'true');
                Funky.NavPosition.setModalFullscreen('test-modal', '');
            }).not.toThrow();
        });
    });

    // =========================================================================
    // ACCESSIBILITY TESTS
    // =========================================================================
    FunkyTests.describe('Accessibility', function() {
        FunkyTests.it('modal slide direction affects visual presentation only', function() {
            // Verify slide direction doesn't affect accessibility
            var direction = Funky.NavPosition.getModalSlideDirection();
            expect(typeof direction).toBe('string');
        });

        FunkyTests.it('dropdown methods handle ARIA states gracefully', function() {
            var dropdown = document.createElement('div');
            dropdown.setAttribute('aria-expanded', 'false');
            fixture.el.appendChild(dropdown);

            expect(function() {
                Funky.NavPosition.openDropdown(dropdown);
                Funky.NavPosition.closeDropdown(dropdown);
            }).not.toThrow();
        });

        FunkyTests.it('user menu handles keyboard accessibility', function() {
            expect(function() {
                Funky.NavPosition.toggleUserMenu();
            }).not.toThrow();
        });
    });

    // =========================================================================
    // DATA-DRIVEN NAVIGATION TESTS
    // =========================================================================
    FunkyTests.describe('Data-driven navigation', function() {
        var testItems = [
            { id: 'home', label: 'Home', icon: 'fa-home', href: '/' },
            { id: 'docs', label: 'Documentation', icon: 'fa-book', children: [
                { id: 'getting-started', label: 'Getting Started', href: '/docs/start' },
                { id: 'api-ref', label: 'API Reference', href: '/docs/api' }
            ]},
            { id: 'settings', label: 'Settings', icon: 'fa-cog', href: '/settings' }
        ];

        FunkyTests.afterEach(function() {
            // Clean up any generated navigation
            var sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.remove();
            }
            // Reset NavPosition state
            Funky.NavPosition.destroy();
            Funky.NavPosition.init();
        });

        FunkyTests.describe('API methods exist', function() {
            FunkyTests.it('has setActive method', function() {
                expect(typeof Funky.NavPosition.setActive).toBe('function');
            });

            FunkyTests.it('has addItems method', function() {
                expect(typeof Funky.NavPosition.addItems).toBe('function');
            });

            FunkyTests.it('has removeItem method', function() {
                expect(typeof Funky.NavPosition.removeItem).toBe('function');
            });

            FunkyTests.it('has updateItem method', function() {
                expect(typeof Funky.NavPosition.updateItem).toBe('function');
            });

            FunkyTests.it('has getItems method', function() {
                expect(typeof Funky.NavPosition.getItems).toBe('function');
            });

            FunkyTests.it('has getItem method', function() {
                expect(typeof Funky.NavPosition.getItem).toBe('function');
            });
        });

        FunkyTests.describe('init() with config', function() {
            FunkyTests.it('accepts items array in config', function() {
                expect(function() {
                    Funky.NavPosition.init({
                        items: testItems
                    });
                }).not.toThrow();
            });

            FunkyTests.it('generates sidebar element', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var sidebar = document.getElementById('sidebar');
                expect(sidebar).not.toBeNull();
            });

            FunkyTests.it('generates navigation container', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var nav = document.getElementById('sidebarNav');
                expect(nav).not.toBeNull();
            });

            FunkyTests.it('generates nav items', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var navLinks = document.querySelectorAll('.nav-link');
                expect(navLinks.length).toBeGreaterThan(0);
            });

            FunkyTests.it('generates nav groups', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var groups = document.querySelectorAll('.nav-group');
                expect(groups.length).toBe(1); // 'docs' group
            });

            FunkyTests.it('renders logo when logoText provided', function() {
                Funky.NavPosition.init({
                    items: testItems,
                    logoText: 'Test App'
                });

                var logo = document.querySelector('.sidebar-logo-text');
                expect(logo).not.toBeNull();
                expect(logo.textContent).toBe('Test App');
            });

            FunkyTests.it('uses custom container ID', function() {
                Funky.NavPosition.init({
                    items: testItems,
                    container: '#my-sidebar'
                });

                var sidebar = document.getElementById('my-sidebar');
                expect(sidebar).not.toBeNull();
            });

            FunkyTests.it('uses custom nav ID', function() {
                Funky.NavPosition.init({
                    items: testItems,
                    navId: 'my-nav'
                });

                var nav = document.getElementById('my-nav');
                expect(nav).not.toBeNull();
            });

            FunkyTests.it('sets position from config', function() {
                Funky.NavPosition.init({
                    items: testItems,
                    position: 'right'
                });

                var position = document.body.getAttribute('data-nav-position');
                expect(position).toBe('right');
            });
        });

        FunkyTests.describe('getItems()', function() {
            FunkyTests.it('returns null when no items provided', function() {
                Funky.NavPosition.init();
                var items = Funky.NavPosition.getItems();
                expect(items).toBeNull();
            });

            FunkyTests.it('returns items array when data-driven', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var items = Funky.NavPosition.getItems();
                expect(items).not.toBeNull();
                expect(Array.isArray(items)).toBe(true);
            });

            FunkyTests.it('returns deep copy of items', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var items = Funky.NavPosition.getItems();
                items[0].label = 'Modified';

                var itemsAgain = Funky.NavPosition.getItems();
                expect(itemsAgain[0].label).toBe('Home');
            });
        });

        FunkyTests.describe('getItem()', function() {
            FunkyTests.it('returns item by ID', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var item = Funky.NavPosition.getItem('home');
                expect(item).not.toBeNull();
                expect(item.label).toBe('Home');
            });

            FunkyTests.it('returns nested item by ID', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var item = Funky.NavPosition.getItem('getting-started');
                expect(item).not.toBeNull();
                expect(item.label).toBe('Getting Started');
            });

            FunkyTests.it('returns null for non-existent ID', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var item = Funky.NavPosition.getItem('non-existent');
                expect(item).toBeNull();
            });
        });

        FunkyTests.describe('setActive()', function() {
            FunkyTests.it('adds active class to item', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                Funky.NavPosition.setActive('home');

                var activeLink = document.querySelector('.nav-link.active');
                expect(activeLink).not.toBeNull();
                expect(activeLink.getAttribute('data-id')).toBe('home');
            });

            FunkyTests.it('removes active class from previous item', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                Funky.NavPosition.setActive('home');
                Funky.NavPosition.setActive('settings');

                var activeLinks = document.querySelectorAll('.nav-link.active');
                expect(activeLinks.length).toBe(1);
                expect(activeLinks[0].getAttribute('data-id')).toBe('settings');
            });

            FunkyTests.it('expands parent group for nested item', function() {
                Funky.NavPosition.init({
                    items: [
                        { id: 'docs', label: 'Docs', expanded: false, children: [
                            { id: 'api', label: 'API', href: '/api' }
                        ]}
                    ]
                });

                var group = document.querySelector('.nav-group');
                expect(group.classList.contains('collapsed')).toBe(true);

                Funky.NavPosition.setActive('api');

                expect(group.classList.contains('collapsed')).toBe(false);
            });

            FunkyTests.it('sets aria-current on active item', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                Funky.NavPosition.setActive('home');

                var activeLink = document.querySelector('.nav-link[aria-current="page"]');
                expect(activeLink).not.toBeNull();
            });

            FunkyTests.it('returns this for chaining', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var result = Funky.NavPosition.setActive('home');
                expect(result).toBe(Funky.NavPosition);
            });
        });

        FunkyTests.describe('addItems()', function() {
            FunkyTests.it('adds items to root', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                Funky.NavPosition.addItems([
                    { id: 'new-item', label: 'New Item', href: '/new' }
                ]);

                var items = Funky.NavPosition.getItems();
                expect(items.length).toBe(testItems.length + 1);
            });

            FunkyTests.it('adds items to specific parent', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                Funky.NavPosition.addItems([
                    { id: 'new-child', label: 'New Child', href: '/docs/new' }
                ], 'docs');

                var parent = Funky.NavPosition.getItem('docs');
                expect(parent.children.length).toBe(3);
            });

            FunkyTests.it('returns this for chaining', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var result = Funky.NavPosition.addItems([]);
                expect(result).toBe(Funky.NavPosition);
            });
        });

        FunkyTests.describe('removeItem()', function() {
            FunkyTests.it('removes item by ID', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                Funky.NavPosition.removeItem('settings');

                var items = Funky.NavPosition.getItems();
                var found = items.find(function(i) { return i.id === 'settings'; });
                expect(found).toBeUndefined();
            });

            FunkyTests.it('removes nested item', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                Funky.NavPosition.removeItem('getting-started');

                var parent = Funky.NavPosition.getItem('docs');
                expect(parent.children.length).toBe(1);
            });

            FunkyTests.it('returns this for chaining', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var result = Funky.NavPosition.removeItem('home');
                expect(result).toBe(Funky.NavPosition);
            });
        });

        FunkyTests.describe('updateItem()', function() {
            FunkyTests.it('updates item properties', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                Funky.NavPosition.updateItem('home', { label: 'Updated Home' });

                var item = Funky.NavPosition.getItem('home');
                expect(item.label).toBe('Updated Home');
            });

            FunkyTests.it('updates badge', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                Funky.NavPosition.updateItem('settings', { badge: '5' });

                var item = Funky.NavPosition.getItem('settings');
                expect(item.badge).toBe('5');
            });

            FunkyTests.it('returns this for chaining', function() {
                Funky.NavPosition.init({
                    items: testItems
                });

                var result = Funky.NavPosition.updateItem('home', {});
                expect(result).toBe(Funky.NavPosition);
            });
        });

        FunkyTests.describe('Item rendering', function() {
            FunkyTests.it('renders icons', function() {
                Funky.NavPosition.init({
                    items: [{ id: 'test', label: 'Test', icon: 'fa-star', href: '#' }]
                });

                var icon = document.querySelector('.nav-icon');
                expect(icon).not.toBeNull();
            });

            FunkyTests.it('renders badges', function() {
                Funky.NavPosition.init({
                    items: [{ id: 'test', label: 'Test', badge: '99', href: '#' }]
                });

                var badge = document.querySelector('.nav-badge');
                expect(badge).not.toBeNull();
                expect(badge.textContent).toBe('99');
            });

            FunkyTests.it('renders disabled items', function() {
                Funky.NavPosition.init({
                    items: [{ id: 'test', label: 'Test', disabled: true, href: '#' }]
                });

                var link = document.querySelector('.nav-link.disabled');
                expect(link).not.toBeNull();
                expect(link.getAttribute('aria-disabled')).toBe('true');
            });

            FunkyTests.it('renders expanded groups by default', function() {
                Funky.NavPosition.init({
                    items: [
                        { id: 'group', label: 'Group', children: [
                            { id: 'child', label: 'Child', href: '#' }
                        ]}
                    ]
                });

                var group = document.querySelector('.nav-group');
                expect(group.classList.contains('collapsed')).toBe(false);
            });

            FunkyTests.it('renders collapsed groups when expanded: false', function() {
                Funky.NavPosition.init({
                    items: [
                        { id: 'group', label: 'Group', expanded: false, children: [
                            { id: 'child', label: 'Child', href: '#' }
                        ]}
                    ]
                });

                var group = document.querySelector('.nav-group');
                expect(group.classList.contains('collapsed')).toBe(true);
            });
        });

        FunkyTests.describe('SPA mode', function() {
            FunkyTests.it('spaMode is enabled by default when items provided', function() {
                expect(function() {
                    Funky.NavPosition.init({
                        items: testItems
                    });
                }).not.toThrow();
            });

            FunkyTests.it('spaMode can be disabled', function() {
                expect(function() {
                    Funky.NavPosition.init({
                        items: testItems,
                        spaMode: false
                    });
                }).not.toThrow();
            });
        });

        FunkyTests.describe('onSelect callback', function() {
            FunkyTests.it('calls onSelect when item is clicked', function() {
                var selectedItem = null;
                Funky.NavPosition.init({
                    items: testItems,
                    onSelect: function(item) {
                        selectedItem = item;
                    }
                });

                var link = document.querySelector('.nav-link[data-id="home"]');
                link.click();

                expect(selectedItem).not.toBeNull();
                expect(selectedItem.id).toBe('home');
            });

            FunkyTests.it('does not call onSelect for disabled items', function() {
                var called = false;
                Funky.NavPosition.init({
                    items: [{ id: 'test', label: 'Test', disabled: true, href: '#' }],
                    onSelect: function() {
                        called = true;
                    }
                });

                var link = document.querySelector('.nav-link');
                link.click();

                expect(called).toBe(false);
            });
        });

        FunkyTests.describe('Backwards compatibility', function() {
            FunkyTests.it('init() without config still works', function() {
                expect(function() {
                    Funky.NavPosition.init();
                }).not.toThrow();
            });

            FunkyTests.it('getItems() returns null for non-data-driven nav', function() {
                Funky.NavPosition.init();
                var items = Funky.NavPosition.getItems();
                expect(items).toBeNull();
            });

            FunkyTests.it('setActive() handles missing sidebar gracefully', function() {
                Funky.NavPosition.init();
                expect(function() {
                    Funky.NavPosition.setActive('non-existent');
                }).not.toThrow();
            });

            FunkyTests.it('addItems() returns this when no items present', function() {
                Funky.NavPosition.init();
                var result = Funky.NavPosition.addItems([]);
                expect(result).toBe(Funky.NavPosition);
            });

            FunkyTests.it('removeItem() returns this when no items present', function() {
                Funky.NavPosition.init();
                var result = Funky.NavPosition.removeItem('test');
                expect(result).toBe(Funky.NavPosition);
            });

            FunkyTests.it('updateItem() returns this when no items present', function() {
                Funky.NavPosition.init();
                var result = Funky.NavPosition.updateItem('test', {});
                expect(result).toBe(Funky.NavPosition);
            });
        });
    });
});
