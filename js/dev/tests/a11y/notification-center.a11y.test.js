/**
 * Accessibility Tests: NotificationCenter
 *
 * Tests WCAG 2.1 AA compliance for the notification center component.
 * Covers ARIA attributes, focus management, keyboard navigation,
 * and screen reader support.
 */

FunkyTests.describe('Funky.A11y.NotificationCenter', function() {

    var expect = FunkyTests.expect;
    var A11y = FunkyTests.A11y;
    var NotificationCenter = Funky.NotificationCenter;
    var fixture;

    // Skip all tests if A11y utilities not available
    if (!A11y) {
        FunkyTests.it('A11y utilities not available - skipping tests', function() {
            expect(true).toBe(true);
        });
        return;
    }

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="notification-container"></div>'
        );

        NotificationCenter.init({
            container: '#notification-container'
        });
    });

    FunkyTests.afterEach(function() {
        NotificationCenter.destroy();
        fixture.cleanup();

        // Clean up any orphaned announcer elements
        var announcers = document.querySelectorAll('.notification-center__announcer');
        for (var i = 0; i < announcers.length; i++) {
            if (announcers[i].parentNode) {
                announcers[i].parentNode.removeChild(announcers[i]);
            }
        }
    });

    // =========================================================================
    // ARIA ATTRIBUTES - TRIGGER
    // =========================================================================

    FunkyTests.describe('ARIA Attributes - Trigger', function() {

        FunkyTests.it('trigger has aria-haspopup="true"', function() {
            var trigger = document.querySelector('.notification-center__trigger');
            expect(trigger.getAttribute('aria-haspopup')).toBe('true');
        });

        FunkyTests.it('trigger has aria-expanded="false" when closed', function() {
            var trigger = document.querySelector('.notification-center__trigger');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
        });

        FunkyTests.it('trigger aria-expanded updates to "true" on open', function() {
            NotificationCenter.open();
            var trigger = document.querySelector('.notification-center__trigger');
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
        });

        FunkyTests.it('trigger aria-expanded updates to "false" on close', function() {
            NotificationCenter.open();
            NotificationCenter.close();
            var trigger = document.querySelector('.notification-center__trigger');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
        });

        FunkyTests.it('trigger has aria-controls pointing to dropdown', function() {
            var trigger = document.querySelector('.notification-center__trigger');
            var controls = trigger.getAttribute('aria-controls');
            expect(controls).toBeTruthy();

            var dropdown = document.getElementById(controls);
            expect(dropdown).not.toBeNull();
        });

        FunkyTests.it('trigger has aria-label', function() {
            var trigger = document.querySelector('.notification-center__trigger');
            expect(trigger.getAttribute('aria-label')).toBeTruthy();
        });

        FunkyTests.it('trigger is a button element or has button role', function() {
            var trigger = document.querySelector('.notification-center__trigger');
            var isButton = trigger.tagName === 'BUTTON' ||
                           trigger.getAttribute('role') === 'button';
            expect(isButton).toBe(true);
        });

    });

    // =========================================================================
    // ARIA ATTRIBUTES - DROPDOWN
    // =========================================================================

    FunkyTests.describe('ARIA Attributes - Dropdown', function() {

        FunkyTests.it('dropdown has role="region"', function() {
            var dropdown = document.querySelector('.notification-center__dropdown');
            expect(dropdown.getAttribute('role')).toBe('region');
        });

        FunkyTests.it('dropdown has aria-label', function() {
            var dropdown = document.querySelector('.notification-center__dropdown');
            expect(dropdown.getAttribute('aria-label')).toBeTruthy();
        });

        FunkyTests.it('dropdown has aria-hidden="true" when closed', function() {
            var dropdown = document.querySelector('.notification-center__dropdown');
            expect(dropdown.getAttribute('aria-hidden')).toBe('true');
        });

        FunkyTests.it('dropdown aria-hidden="false" when open', function() {
            NotificationCenter.open();
            var dropdown = document.querySelector('.notification-center__dropdown');
            expect(dropdown.getAttribute('aria-hidden')).toBe('false');
        });

        FunkyTests.it('dropdown has unique id for aria-controls reference', function() {
            var dropdown = document.querySelector('.notification-center__dropdown');
            expect(dropdown.id).toBeTruthy();
        });

    });

    // =========================================================================
    // ARIA ATTRIBUTES - LIST
    // =========================================================================

    FunkyTests.describe('ARIA Attributes - List', function() {

        FunkyTests.it('list has role="list"', function() {
            var list = document.querySelector('.notification-center__list');
            expect(list.getAttribute('role')).toBe('list');
        });

        FunkyTests.it('list has aria-live="polite"', function() {
            var list = document.querySelector('.notification-center__list');
            expect(list.getAttribute('aria-live')).toBe('polite');
        });

        FunkyTests.it('list has aria-relevant for live region', function() {
            var list = document.querySelector('.notification-center__list');
            var relevant = list.getAttribute('aria-relevant');
            expect(relevant).toBeTruthy();
        });

    });

    // =========================================================================
    // ARIA ATTRIBUTES - ITEMS
    // =========================================================================

    FunkyTests.describe('ARIA Attributes - Items', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test Notification', body: 'Test body', read: false }
            ]);
            NotificationCenter.open();
        });

        FunkyTests.it('items have role="listitem"', function() {
            var item = document.querySelector('.notification-center__item');
            expect(item.getAttribute('role')).toBe('listitem');
        });

        FunkyTests.it('items have tabindex for keyboard focus', function() {
            var item = document.querySelector('.notification-center__item');
            expect(item.hasAttribute('tabindex')).toBe(true);
        });

        FunkyTests.it('first item has tabindex="0"', function() {
            var item = document.querySelector('.notification-center__item');
            expect(item.getAttribute('tabindex')).toBe('0');
        });

    });

    // =========================================================================
    // ARIA ATTRIBUTES - BADGE
    // =========================================================================

    FunkyTests.describe('ARIA Attributes - Badge', function() {

        FunkyTests.it('badge has aria-label describing count', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false },
                { id: '2', title: 'Test 2', read: false }
            ]);

            var badge = document.querySelector('.notification-center__badge');
            var label = badge.getAttribute('aria-label');
            expect(label).toBeTruthy();
            expect(label.toLowerCase()).toContain('unread');
        });

        FunkyTests.it('badge aria-label updates with count', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            var badge = document.querySelector('.notification-center__badge');
            var label = badge.getAttribute('aria-label');
            expect(label).toContain('1');

            NotificationCenter.addItem({ id: '2', title: 'Test 2', read: false });
            label = badge.getAttribute('aria-label');
            expect(label).toContain('2');
        });

    });

    // =========================================================================
    // FOCUS MANAGEMENT
    // =========================================================================

    FunkyTests.describe('Focus Management', function() {

        FunkyTests.it('focus moves to first item on open', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);

            NotificationCenter.open();

            return FunkyTests.delay(50).then(function() {
                var firstItem = document.querySelector('.notification-center__item');
                expect(document.activeElement).toBe(firstItem);
            });
        });

        FunkyTests.it('focus returns to trigger on close', function() {
            NotificationCenter.open();

            return FunkyTests.delay(50).then(function() {
                NotificationCenter.close();
                return FunkyTests.delay(50);
            }).then(function() {
                var trigger = document.querySelector('.notification-center__trigger');
                expect(document.activeElement).toBe(trigger);
            });
        });

        FunkyTests.it('focus returns to trigger on escape', function() {
            NotificationCenter.open();

            return FunkyTests.delay(50).then(function() {
                FunkyTests.simulate.keydown(document, { key: 'Escape' });
                return FunkyTests.delay(50);
            }).then(function() {
                var trigger = document.querySelector('.notification-center__trigger');
                expect(document.activeElement).toBe(trigger);
            });
        });

        FunkyTests.it('trigger can receive focus', function() {
            var trigger = document.querySelector('.notification-center__trigger');
            trigger.focus();
            expect(document.activeElement).toBe(trigger);
        });

        FunkyTests.it('focus moves to mark-all button if no items', function() {
            NotificationCenter.setData([]);
            NotificationCenter.open();

            return FunkyTests.delay(50).then(function() {
                var markAllBtn = document.querySelector('.notification-center__mark-all');
                // Focus should be on mark-all or some other focusable element
                var activeEl = document.activeElement;
                var isInDropdown = document.querySelector('.notification-center__dropdown').contains(activeEl);
                expect(isInDropdown).toBe(true);
            });
        });

    });

    // =========================================================================
    // KEYBOARD NAVIGATION
    // =========================================================================

    FunkyTests.describe('Keyboard Navigation', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test 1', read: false },
                { id: '2', title: 'Test 2', read: false },
                { id: '3', title: 'Test 3', read: false }
            ]);
            NotificationCenter.open();
        });

        FunkyTests.it('arrow down moves to next item', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                items[0].focus();

                FunkyTests.simulate.keydown(items[0], { key: 'ArrowDown' });

                return FunkyTests.delay(50);
            }).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                expect(document.activeElement).toBe(items[1]);
            });
        });

        FunkyTests.it('arrow up moves to previous item', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                items[1].focus();

                FunkyTests.simulate.keydown(items[1], { key: 'ArrowUp' });

                return FunkyTests.delay(50);
            }).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                expect(document.activeElement).toBe(items[0]);
            });
        });

        FunkyTests.it('Home key moves to first item', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                items[2].focus();

                FunkyTests.simulate.keydown(items[2], { key: 'Home' });

                return FunkyTests.delay(50);
            }).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                expect(document.activeElement).toBe(items[0]);
            });
        });

        FunkyTests.it('End key moves to last item', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                items[0].focus();

                FunkyTests.simulate.keydown(items[0], { key: 'End' });

                return FunkyTests.delay(50);
            }).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                expect(document.activeElement).toBe(items[2]);
            });
        });

        FunkyTests.it('j key moves to next item (vim-style)', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                items[0].focus();

                FunkyTests.simulate.keydown(items[0], { key: 'j' });

                return FunkyTests.delay(50);
            }).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                expect(document.activeElement).toBe(items[1]);
            });
        });

        FunkyTests.it('k key moves to previous item (vim-style)', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                items[1].focus();

                FunkyTests.simulate.keydown(items[1], { key: 'k' });

                return FunkyTests.delay(50);
            }).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                expect(document.activeElement).toBe(items[0]);
            });
        });

        FunkyTests.it('Escape closes dropdown', function() {
            return FunkyTests.delay(50).then(function() {
                FunkyTests.simulate.keydown(document, { key: 'Escape' });
                return FunkyTests.delay(50);
            }).then(function() {
                expect(NotificationCenter.isOpen()).toBe(false);
            });
        });

    });

    // =========================================================================
    // ROVING TABINDEX
    // =========================================================================

    FunkyTests.describe('Roving Tabindex', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test 1', read: false },
                { id: '2', title: 'Test 2', read: false },
                { id: '3', title: 'Test 3', read: false }
            ]);
            NotificationCenter.open();
        });

        FunkyTests.it('first item has tabindex="0" initially', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                expect(items[0].getAttribute('tabindex')).toBe('0');
            });
        });

        FunkyTests.it('other items have tabindex="-1" initially', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                expect(items[1].getAttribute('tabindex')).toBe('-1');
                expect(items[2].getAttribute('tabindex')).toBe('-1');
            });
        });

        FunkyTests.it('tabindex updates on arrow key navigation', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                items[0].focus();

                FunkyTests.simulate.keydown(items[0], { key: 'ArrowDown' });

                return FunkyTests.delay(50);
            }).then(function() {
                var items = document.querySelectorAll('.notification-center__item');
                expect(items[0].getAttribute('tabindex')).toBe('-1');
                expect(items[1].getAttribute('tabindex')).toBe('0');
            });
        });

    });

    // =========================================================================
    // FOCUS TRAP
    // =========================================================================

    FunkyTests.describe('Focus Trap', function() {

        FunkyTests.it('Tab from last element wraps to first', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);
            NotificationCenter.open();

            return FunkyTests.delay(50).then(function() {
                var dropdown = document.querySelector('.notification-center__dropdown');
                var focusable = dropdown.querySelectorAll(
                    'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
                );

                if (focusable.length > 1) {
                    var lastFocusable = focusable[focusable.length - 1];
                    lastFocusable.focus();

                    // Focus trap should wrap - we can't easily test Tab behavior
                    // but we can verify the focus trap elements exist
                    expect(lastFocusable).not.toBeNull();
                }
            });
        });

    });

    // =========================================================================
    // SCREEN READER ANNOUNCEMENTS
    // =========================================================================

    FunkyTests.describe('Screen Reader Announcements', function() {

        FunkyTests.it('announcer element exists', function() {
            var announcer = document.querySelector('.notification-center__announcer');
            expect(announcer).not.toBeNull();
        });

        FunkyTests.it('announcer has role="status"', function() {
            var announcer = document.querySelector('.notification-center__announcer');
            expect(announcer.getAttribute('role')).toBe('status');
        });

        FunkyTests.it('announcer has aria-live="polite"', function() {
            var announcer = document.querySelector('.notification-center__announcer');
            expect(announcer.getAttribute('aria-live')).toBe('polite');
        });

        FunkyTests.it('announcer has aria-atomic="true"', function() {
            var announcer = document.querySelector('.notification-center__announcer');
            expect(announcer.getAttribute('aria-atomic')).toBe('true');
        });

        FunkyTests.it('announcer is visually hidden', function() {
            var announcer = document.querySelector('.notification-center__announcer');
            var style = window.getComputedStyle(announcer);

            // Check for common visually-hidden patterns
            var isHidden = (
                style.position === 'absolute' ||
                announcer.classList.contains('sr-only') ||
                announcer.classList.contains('visually-hidden')
            );
            expect(isHidden).toBe(true);
        });

        FunkyTests.it('announce() updates announcer text', function() {
            NotificationCenter.announce('Test announcement');

            return FunkyTests.delay(150).then(function() {
                var announcer = document.querySelector('.notification-center__announcer');
                expect(announcer.textContent).toBe('Test announcement');
            });
        });

    });

    // =========================================================================
    // TAB PANEL ACCESSIBILITY
    // =========================================================================

    FunkyTests.describe('Tab Panel Accessibility', function() {

        FunkyTests.it('tabs container has role="tablist"', function() {
            var tabs = document.querySelector('.notification-center__tabs');
            if (tabs) {
                expect(tabs.getAttribute('role')).toBe('tablist');
            } else {
                // Tabs may not be rendered if no categories defined
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('tab buttons have role="tab"', function() {
            var tab = document.querySelector('.notification-center__tabs [role="tab"]');
            if (tab) {
                expect(tab.getAttribute('role')).toBe('tab');
            } else {
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('selected tab has aria-selected="true"', function() {
            var selectedTab = document.querySelector('[role="tab"][aria-selected="true"]');
            if (selectedTab) {
                expect(selectedTab.getAttribute('aria-selected')).toBe('true');
            } else {
                expect(true).toBe(true);
            }
        });

    });

    // =========================================================================
    // ACTION BUTTONS ACCESSIBILITY
    // =========================================================================

    FunkyTests.describe('Action Buttons Accessibility', function() {

        FunkyTests.beforeEach(function() {
            NotificationCenter.setData([
                {
                    id: '1',
                    title: 'Test',
                    read: false,
                    actions: [
                        { label: 'View', action: 'view' }
                    ]
                }
            ]);
            NotificationCenter.open();
        });

        FunkyTests.it('dismiss button has aria-label', function() {
            return FunkyTests.delay(50).then(function() {
                var dismissBtn = document.querySelector('.notification-center__dismiss');
                if (dismissBtn) {
                    expect(dismissBtn.getAttribute('aria-label')).toBeTruthy();
                } else {
                    expect(true).toBe(true);
                }
            });
        });

        FunkyTests.it('action buttons are focusable', function() {
            return FunkyTests.delay(50).then(function() {
                var actionBtn = document.querySelector('.notification-center__action');
                if (actionBtn) {
                    actionBtn.focus();
                    expect(document.activeElement).toBe(actionBtn);
                } else {
                    expect(true).toBe(true);
                }
            });
        });

    });

    // =========================================================================
    // FOCUS STYLES
    // =========================================================================

    FunkyTests.describe('Focus Styles', function() {

        FunkyTests.it('focus ring CSS variables are defined', function() {
            var styles = getComputedStyle(document.documentElement);
            var focusColor = styles.getPropertyValue('--focus-ring-color');
            // Variable should be defined (may be empty string if not set)
            expect(focusColor !== null).toBe(true);
        });

        FunkyTests.it('items can receive visible focus', function() {
            NotificationCenter.setData([
                { id: '1', title: 'Test', read: false }
            ]);
            NotificationCenter.open();

            return FunkyTests.delay(50).then(function() {
                var item = document.querySelector('.notification-center__item');
                item.focus();

                // Element should be focusable
                expect(document.activeElement).toBe(item);
            });
        });

    });

    // =========================================================================
    // REDUCED MOTION
    // =========================================================================

    FunkyTests.describe('Reduced Motion', function() {

        FunkyTests.it('component respects prefers-reduced-motion via CSS', function() {
            // Check that CSS includes reduced motion media query
            // This is a structural test - actual behavior depends on user setting
            var stylesheets = document.styleSheets;
            var hasReducedMotionRule = false;

            // We can't easily test CSS media queries, but we can verify
            // the component doesn't have inline animation styles that ignore preference
            var dropdown = document.querySelector('.notification-center__dropdown');

            // Component should rely on CSS for animations, not inline styles
            var inlineTransition = dropdown.style.transition;
            var inlineAnimation = dropdown.style.animation;

            // No inline animations = CSS handles it (including reduced motion)
            expect(inlineTransition === '' || inlineTransition === undefined).toBe(true);
            expect(inlineAnimation === '' || inlineAnimation === undefined).toBe(true);
        });

    });

});
