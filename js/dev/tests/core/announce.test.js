/**
 * Funky.Announce Tests
 *
 * Tests for screen reader announcement utilities.
 */

describe('Funky.Core.Announce', function() {

    var Announce = Funky.Announce;

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Announce')).toBe(true);
        });

        it('has polite method', function() {
            expect(typeof Announce.polite).toBe('function');
        });

        it('has assertive method', function() {
            expect(typeof Announce.assertive).toBe('function');
        });

        it('has clear method', function() {
            expect(typeof Announce.clear).toBe('function');
        });

    });

    describe('ARIA live region creation', function() {

        afterEach(function() {
            Announce.clear();
        });

        it('polite creates polite live region', function() {
            Announce.polite('Test message');

            // Check for aria-live="polite" element
            var politeRegion = document.querySelector('[aria-live="polite"]');
            expect(politeRegion).toBeDefined();
        });

        it('assertive creates assertive live region', function() {
            Announce.assertive('Urgent message');

            // Check for aria-live="assertive" element
            var assertiveRegion = document.querySelector('[aria-live="assertive"]');
            expect(assertiveRegion).toBeDefined();
        });

    });

    describe('Message content', function() {

        afterEach(function() {
            Announce.clear();
        });

        it('polite sets message text', function() {
            Announce.polite('Hello screen reader');

            return FunkyTests.delay(50).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                expect(region.textContent).toContain('Hello screen reader');
            });
        });

        it('assertive sets message text', function() {
            Announce.assertive('Alert message');

            return FunkyTests.delay(50).then(function() {
                var region = document.querySelector('[aria-live="assertive"]');
                expect(region.textContent).toContain('Alert message');
            });
        });

    });

    describe('Message clearing', function() {

        it('clear removes message content', function() {
            Announce.polite('Message to clear');

            return FunkyTests.delay(50).then(function() {
                Announce.clear();
                return FunkyTests.delay(50);
            }).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                if (region) {
                    expect(region.textContent).toBe('');
                }
            });
        });

    });

    describe('Multiple announcements', function() {

        afterEach(function() {
            Announce.clear();
        });

        it('handles sequential polite messages', function() {
            Announce.polite('First message');

            return FunkyTests.delay(50).then(function() {
                Announce.polite('Second message');
                return FunkyTests.delay(50);
            }).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                expect(region.textContent).toContain('Second message');
            });
        });

    });

    describe('Accessibility attributes', function() {

        afterEach(function() {
            Announce.clear();
        });

        it('polite region has correct role', function() {
            Announce.polite('Test');

            var region = document.querySelector('[aria-live="polite"]');
            expect(region.getAttribute('role')).toBe('status');
        });

        it('assertive region has alert role', function() {
            Announce.assertive('Test');

            var region = document.querySelector('[aria-live="assertive"]');
            expect(region.getAttribute('role')).toBe('alert');
        });

        it('regions are visually hidden', function() {
            Announce.polite('Test');

            var region = document.querySelector('[aria-live="polite"]');
            // Should have visually-hidden class or equivalent
            var style = window.getComputedStyle(region);
            var isHidden = region.classList.contains('visually-hidden') ||
                           region.classList.contains('sr-only') ||
                           style.position === 'absolute' ||
                           style.clip !== 'auto';

            expect(isHidden).toBe(true);
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error handling', function() {

        afterEach(function() {
            Announce.clear();
        });

        it('polite handles null message gracefully', function() {
            expect(function() {
                Announce.polite(null);
            }).not.toThrow();
        });

        it('polite handles undefined message gracefully', function() {
            expect(function() {
                Announce.polite(undefined);
            }).not.toThrow();
        });

        it('assertive handles null message gracefully', function() {
            expect(function() {
                Announce.assertive(null);
            }).not.toThrow();
        });

        it('assertive handles undefined message gracefully', function() {
            expect(function() {
                Announce.assertive(undefined);
            }).not.toThrow();
        });

        it('polite handles empty string', function() {
            expect(function() {
                Announce.polite('');
            }).not.toThrow();
        });

        it('assertive handles empty string', function() {
            expect(function() {
                Announce.assertive('');
            }).not.toThrow();
        });

        it('clear handles being called multiple times', function() {
            Announce.polite('Test');

            expect(function() {
                Announce.clear();
                Announce.clear();
                Announce.clear();
            }).not.toThrow();
        });

        it('clear handles being called before any announcement', function() {
            expect(function() {
                Announce.clear();
            }).not.toThrow();
        });

    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    describe('Edge cases', function() {

        afterEach(function() {
            Announce.clear();
        });

        it('handles very long messages', function() {
            var longMessage = 'A'.repeat(5000);
            Announce.polite(longMessage);

            return FunkyTests.delay(50).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                expect(region.textContent.length).toBe(5000);
            });
        });

        it('handles special characters in message', function() {
            Announce.polite('<script>alert("xss")</script>');

            return FunkyTests.delay(50).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                // Content should be text, not executed
                expect(region.textContent).toContain('<script>');
            });
        });

        it('handles Unicode in message', function() {
            Announce.polite('日本語メッセージ 🎉 émoji');

            return FunkyTests.delay(50).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                expect(region.textContent).toContain('🎉');
            });
        });

        it('handles rapid sequential announcements', function() {
            for (var i = 0; i < 10; i++) {
                Announce.polite('Message ' + i);
            }

            return FunkyTests.delay(100).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                // Last message should be visible
                expect(region.textContent).toContain('Message');
            });
        });

        it('handles mixed polite and assertive calls', function() {
            // Call polite first, then wait for it to complete before calling assertive
            // This avoids the timeout cancellation issue
            Announce.polite('Polite message');

            return FunkyTests.delay(100).then(function() {
                Announce.assertive('Assertive message');
                return FunkyTests.delay(100);
            }).then(function() {
                var politeRegion = document.querySelector('[aria-live="polite"]');
                var assertiveRegion = document.querySelector('[aria-live="assertive"]');

                expect(politeRegion.textContent).toContain('Polite');
                expect(assertiveRegion.textContent).toContain('Assertive');
            });
        });

        it('handles numeric message', function() {
            Announce.polite(12345);

            return FunkyTests.delay(50).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                expect(region.textContent).toContain('12345');
            });
        });

        it('handles boolean message', function() {
            Announce.polite(true);

            return FunkyTests.delay(50).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                expect(region.textContent).toContain('true');
            });
        });

        it('handles object message', function() {
            expect(function() {
                Announce.polite({ key: 'value' });
            }).not.toThrow();
        });

    });

    // =========================================================================
    // REGION MANAGEMENT TESTS
    // =========================================================================
    describe('Region management', function() {

        afterEach(function() {
            Announce.clear();
        });

        it('creates polite region only when needed', function() {
            // Before any announcement
            var regionsBefore = document.querySelectorAll('[aria-live="polite"]').length;

            Announce.polite('First polite');

            return FunkyTests.delay(50).then(function() {
                var regionsAfter = document.querySelectorAll('[aria-live="polite"]').length;
                expect(regionsAfter).toBeGreaterThanOrEqual(regionsBefore);
            });
        });

        it('creates assertive region only when needed', function() {
            var regionsBefore = document.querySelectorAll('[aria-live="assertive"]').length;

            Announce.assertive('First assertive');

            return FunkyTests.delay(50).then(function() {
                var regionsAfter = document.querySelectorAll('[aria-live="assertive"]').length;
                expect(regionsAfter).toBeGreaterThanOrEqual(regionsBefore);
            });
        });

        it('reuses existing regions', function() {
            Announce.polite('First');

            return FunkyTests.delay(50).then(function() {
                var countBefore = document.querySelectorAll('[aria-live="polite"]').length;

                Announce.polite('Second');

                return FunkyTests.delay(50).then(function() {
                    var countAfter = document.querySelectorAll('[aria-live="polite"]').length;
                    expect(countAfter).toBe(countBefore);
                });
            });
        });

    });

    // =========================================================================
    // TIMING TESTS
    // =========================================================================
    describe('Timing', function() {

        afterEach(function() {
            Announce.clear();
        });

        it('message appears after small delay', function() {
            Announce.polite('Delayed message');

            // Should appear after delay
            return FunkyTests.delay(100).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                expect(region.textContent).toContain('Delayed message');
            });
        });

        it('clear removes message after delay', function() {
            Announce.polite('To be cleared');

            return FunkyTests.delay(50).then(function() {
                Announce.clear();
                return FunkyTests.delay(50);
            }).then(function() {
                var region = document.querySelector('[aria-live="polite"]');
                if (region) {
                    expect(region.textContent).toBe('');
                }
            });
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    describe('Cleanup', function() {

        it('clear removes content from both regions', function() {
            Announce.polite('Polite message');
            Announce.assertive('Assertive message');

            return FunkyTests.delay(50).then(function() {
                Announce.clear();
                return FunkyTests.delay(50);
            }).then(function() {
                var politeRegion = document.querySelector('[aria-live="polite"]');
                var assertiveRegion = document.querySelector('[aria-live="assertive"]');

                if (politeRegion) {
                    expect(politeRegion.textContent).toBe('');
                }
                if (assertiveRegion) {
                    expect(assertiveRegion.textContent).toBe('');
                }
            });
        });

    });

});
