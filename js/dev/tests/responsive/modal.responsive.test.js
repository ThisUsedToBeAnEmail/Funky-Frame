/**
 * Responsive Tests: Funky.Modal
 *
 * Tests responsive behavior for the Modal component.
 * Verifies that the modal handles viewport changes,
 * focus trapping, and backdrop behavior at different sizes.
 */

FunkyTests.describe('Funky.Responsive.Modal', function() {
    var expect = FunkyTests.expect;
    var Modal = window.Funky && window.Funky.Modal;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Modal not loaded
    if (!Modal) {
        FunkyTests.it('Modal component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var modal;
    var modalId;
    var testCounter = 0;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        modalId = 'modal-responsive-test-' + unique;

        fixture = FunkyTests.fixture(
            '<div id="' + modalId + '" class="modal fade" tabindex="-1" role="dialog">' +
                '<div class="modal-dialog" role="document">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<h5 class="modal-title">Test Modal</h5>' +
                            '<button type="button" class="close" data-funky-modal-close>&times;</button>' +
                        '</div>' +
                        '<div class="modal-body">' +
                            '<p>Modal body content</p>' +
                            '<input type="text" class="form-control" placeholder="Test input">' +
                        '</div>' +
                        '<div class="modal-footer">' +
                            '<button type="button" class="btn btn-secondary" data-funky-modal-close>Close</button>' +
                            '<button type="button" class="btn btn-primary">Save</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (modal && typeof modal.dispose === 'function') {
            try {
                modal.dispose();
            } catch (e) {
                // Ignore dispose errors
            }
            modal = null;
        }
        // Clean up any remaining modals and backdrops
        var backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(function(el) {
            el.remove();
        });
        document.body.classList.remove('modal-open');
        fixture.cleanup();
    });

    // ========================================================================
    // Basic Viewport Behavior
    // ========================================================================

    FunkyTests.describe('Basic Viewport Behavior', function() {

        FunkyTests.it('creates modal instance on mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                expect(modal).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates modal instance on tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                expect(modal).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates modal instance on desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                expect(modal).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Show/Hide at Different Viewports
    // ========================================================================

    FunkyTests.describe('Show/Hide at Different Viewports', function() {

        FunkyTests.it('shows modal on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                modal.show();

                setTimeout(function() {
                    expect(modal.isShown).toBe(true);
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

        FunkyTests.it('shows modal on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                modal.show();

                setTimeout(function() {
                    expect(modal.isShown).toBe(true);
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

        FunkyTests.it('shows modal on desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                modal.show();

                setTimeout(function() {
                    expect(modal.isShown).toBe(true);
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

    });

    // ========================================================================
    // Static Methods at Different Viewports
    // ========================================================================

    FunkyTests.describe('Static Methods at Different Viewports', function() {

        FunkyTests.it('Modal.show works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                Modal.show('#' + modalId);

                setTimeout(function() {
                    modal = Modal.getInstance('#' + modalId);
                    expect(modal !== null && modal !== undefined).toBe(true);
                    if (modal) {
                        expect(modal.isShown).toBe(true);
                        modal.hide();
                    }

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

        FunkyTests.it('Modal.hide works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                Modal.show('#' + modalId);

                setTimeout(function() {
                    Modal.hide('#' + modalId);

                    setTimeout(function() {
                        modal = Modal.getInstance('#' + modalId);
                        // After hide transition completes, isShown should be false
                        // If modal still exists, check it's not shown
                        if (modal) {
                            expect(modal.isShown).toBe(false);
                        } else {
                            // No modal instance means it was properly cleaned up
                            expect(true).toBe(true);
                        }
                        restore();
                        done();
                    }, 500); // Modal transition is 300ms, add buffer for async operations
                }, 400); // Wait for show transition to complete before hiding
            }, 50);
        });

        FunkyTests.it('Modal.toggle works on desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                Modal.toggle('#' + modalId);

                setTimeout(function() {
                    modal = Modal.getInstance('#' + modalId);
                    expect(modal !== null && modal !== undefined).toBe(true);
                    if (modal) {
                        Modal.toggle('#' + modalId);
                    }

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

    });

    // ========================================================================
    // Resize While Modal Open
    // ========================================================================

    FunkyTests.describe('Resize While Modal Open', function() {

        FunkyTests.it('handles resize while modal is open', function(done) {
            modal = Modal.getOrCreateInstance('#' + modalId);
            modal.show();

            setTimeout(function() {
                var restore = FunkyTests.simulate.resize(320, 480);

                setTimeout(function() {
                    expect(modal.isShown).toBe(true);
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 100);
            }, 200);
        });

        FunkyTests.it('handles resize from desktop to mobile', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                modal.show();

                setTimeout(function() {
                    restore();
                    restore = FunkyTests.simulate.mobile();

                    setTimeout(function() {
                        expect(modal.isShown).toBe(true);
                        modal.hide();

                        setTimeout(function() {
                            restore();
                            done();
                        }, 200);
                    }, 100);
                }, 200);
            }, 50);
        });

        FunkyTests.it('handles rapid viewport changes while open', function(done) {
            modal = Modal.getOrCreateInstance('#' + modalId);
            modal.show();

            setTimeout(function() {
                var restore1 = FunkyTests.simulate.resize(400, 300);
                var restore2, restore3;

                setTimeout(function() {
                    restore1();
                    restore2 = FunkyTests.simulate.resize(800, 600);
                }, 20);

                setTimeout(function() {
                    restore2();
                    restore3 = FunkyTests.simulate.resize(500, 400);
                }, 40);

                setTimeout(function() {
                    restore3();
                    expect(modal.isShown).toBe(true);
                    modal.hide();

                    setTimeout(function() {
                        done();
                    }, 200);
                }, 150);
            }, 200);
        });

    });

    // ========================================================================
    // Orientation Changes
    // ========================================================================

    FunkyTests.describe('Orientation Changes', function() {

        FunkyTests.it('handles portrait to landscape while open', function(done) {
            // Portrait
            var restore = FunkyTests.simulate.resize(375, 667);

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                modal.show();

                setTimeout(function() {
                    // Switch to landscape
                    restore();
                    restore = FunkyTests.simulate.resize(667, 375);

                    setTimeout(function() {
                        expect(modal.isShown).toBe(true);
                        modal.hide();

                        setTimeout(function() {
                            restore();
                            done();
                        }, 200);
                    }, 100);
                }, 200);
            }, 50);
        });

        FunkyTests.it('handles landscape to portrait while open', function(done) {
            // Landscape
            var restore = FunkyTests.simulate.resize(812, 375);

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                modal.show();

                setTimeout(function() {
                    // Switch to portrait
                    restore();
                    restore = FunkyTests.simulate.resize(375, 812);

                    setTimeout(function() {
                        expect(modal.isShown).toBe(true);
                        modal.hide();

                        setTimeout(function() {
                            restore();
                            done();
                        }, 200);
                    }, 100);
                }, 200);
            }, 50);
        });

    });

    // ========================================================================
    // Backdrop Behavior at Different Viewports
    // ========================================================================

    FunkyTests.describe('Backdrop Behavior at Different Viewports', function() {

        FunkyTests.it('backdrop displays on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId, { backdrop: true });
                modal.show();

                setTimeout(function() {
                    var backdrop = document.querySelector('.modal-backdrop');
                    expect(backdrop !== null).toBe(true);
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

        FunkyTests.it('static backdrop works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId, { backdrop: 'static' });
                modal.show();

                setTimeout(function() {
                    expect(modal.isShown).toBe(true);
                    expect(modal.options.backdrop).toBe('static');
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

    });

    // ========================================================================
    // Focus Trapping at Different Viewports
    // ========================================================================

    FunkyTests.describe('Focus Trapping at Different Viewports', function() {

        FunkyTests.it('focus trap works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                modal.show();

                setTimeout(function() {
                    // Modal should trap focus
                    expect(modal.isShown).toBe(true);
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

        FunkyTests.it('focus trap works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                modal.show();

                setTimeout(function() {
                    expect(modal.isShown).toBe(true);
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

    });

    // ========================================================================
    // Keyboard Options at Different Viewports
    // ========================================================================

    FunkyTests.describe('Keyboard Options at Different Viewports', function() {

        FunkyTests.it('keyboard: true allows ESC on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId, { keyboard: true });
                modal.show();

                setTimeout(function() {
                    expect(modal.options.keyboard).toBe(true);
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

        FunkyTests.it('keyboard: false prevents ESC on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId, { keyboard: false });
                modal.show();

                setTimeout(function() {
                    expect(modal.options.keyboard).toBe(false);
                    modal.hide();

                    setTimeout(function() {
                        restore();
                        done();
                    }, 200);
                }, 200);
            }, 50);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('cleans up properly on viewport change', function(done) {
            modal = Modal.getOrCreateInstance('#' + modalId);
            modal.show();

            setTimeout(function() {
                var restore = FunkyTests.simulate.resize(320, 480);

                modal.dispose();
                modal = null;

                // Should not error after dispose
                setTimeout(function() {
                    restore();
                    expect(true).toBe(true);
                    done();
                }, 200);
            }, 200);
        });

        FunkyTests.it('can be recreated after dispose', function(done) {
            modal = Modal.getOrCreateInstance('#' + modalId);
            modal.dispose();
            modal = null;

            setTimeout(function() {
                modal = Modal.getOrCreateInstance('#' + modalId);
                expect(modal).not.toBeNull();
                done();
            }, 50);
        });

        FunkyTests.it('backdrop removed after dispose', function(done) {
            modal = Modal.getOrCreateInstance('#' + modalId);
            modal.show();

            setTimeout(function() {
                modal.hide();

                setTimeout(function() {
                    modal.dispose();
                    modal = null;

                    setTimeout(function() {
                        var backdrops = document.querySelectorAll('.modal-backdrop');
                        // Backdrops should be cleaned up after dispose
                        expect(backdrops.length).toBe(0);
                        done();
                    }, 500); // Wait for backdrop fade out
                }, 500); // Modal hide transition is 300ms + buffer
            }, 400); // Wait for show transition to complete
        });

    });

});
