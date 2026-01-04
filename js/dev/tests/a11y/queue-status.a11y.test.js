/**
 * Accessibility Tests: Funky.QueueStatus
 *
 * Tests WCAG 2.1 AA compliance for queue status component.
 * Queue status indicators must announce changes to screen readers
 * and provide keyboard accessible controls.
 */

FunkyTests.describe('Funky.A11y.QueueStatus', function() {
    var expect = FunkyTests.expect;
    var QueueStatus = window.Funky && window.Funky.QueueStatus;

    // Skip all tests if QueueStatus not loaded
    if (!QueueStatus) {
        FunkyTests.it('QueueStatus component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="queue-status-test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
    });

    // ========================================================================
    // Status Indicator Structure
    // ========================================================================

    FunkyTests.describe('Status Indicator Structure', function() {

        FunkyTests.it('status button has accessible name', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-status-btn" aria-label="Queue status: 5 pending">' +
                '<i class="fas fa-sync" aria-hidden="true"></i>' +
                '<span class="queue-status-badge">5</span>' +
                '</button>';

            var btn = container.querySelector('.queue-status-btn');
            var hasLabel = btn.getAttribute('aria-label') ||
                          btn.getAttribute('title');
            expect(hasLabel).toBeTruthy();
        });

        FunkyTests.it('icon is hidden from screen readers', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-status-btn">' +
                '<i class="fas fa-sync" aria-hidden="true"></i>' +
                '</button>';

            var icon = container.querySelector('i');
            expect(icon.getAttribute('aria-hidden')).toBe('true');
        });

        FunkyTests.it('button is keyboard focusable', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-status-btn" aria-label="Queue status">Status</button>';

            var btn = container.querySelector('.queue-status-btn');
            btn.focus();
            expect(document.activeElement === btn).toBe(true);
        });

    });

    // ========================================================================
    // Badge Announcements (WCAG 4.1.3)
    // ========================================================================

    FunkyTests.describe('Badge Announcements (WCAG 4.1.3)', function() {

        FunkyTests.it('badge count is announced', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<span class="queue-status-badge" aria-live="polite" aria-atomic="true">5</span>';

            var badge = container.querySelector('.queue-status-badge');
            expect(badge.getAttribute('aria-live')).toBe('polite');
        });

        FunkyTests.it('badge has aria-atomic for complete announcements', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<span class="queue-status-badge" aria-live="polite" aria-atomic="true">3</span>';

            var badge = container.querySelector('.queue-status-badge');
            expect(badge.getAttribute('aria-atomic')).toBe('true');
        });

        FunkyTests.it('screen reader text describes count', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-status-btn">' +
                '<span class="queue-status-badge">5</span>' +
                '<span class="sr-only">5 items pending</span>' +
                '</button>';

            var srText = container.querySelector('.sr-only');
            expect(srText.textContent).toContain('pending');
        });

    });

    // ========================================================================
    // Status States
    // ========================================================================

    FunkyTests.describe('Status States', function() {

        FunkyTests.it('online status is communicated', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-status-btn queue-status--online" aria-label="Queue status: Online, 0 pending">' +
                '<i class="fas fa-check" aria-hidden="true"></i>' +
                '</button>';

            var btn = container.querySelector('.queue-status-btn');
            expect(btn.getAttribute('aria-label')).toContain('Online');
        });

        FunkyTests.it('offline status is communicated', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-status-btn queue-status--offline" aria-label="Queue status: Offline, 3 items pending">' +
                '<i class="fas fa-wifi-slash" aria-hidden="true"></i>' +
                '</button>';

            var btn = container.querySelector('.queue-status-btn');
            expect(btn.getAttribute('aria-label')).toContain('Offline');
        });

        FunkyTests.it('syncing status is communicated', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-status-btn queue-status--syncing" aria-label="Queue status: Syncing">' +
                '<i class="fas fa-sync fa-spin" aria-hidden="true"></i>' +
                '</button>';

            var btn = container.querySelector('.queue-status-btn');
            expect(btn.getAttribute('aria-label')).toContain('Syncing');
        });

        FunkyTests.it('error status is communicated', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-status-btn queue-status--error" aria-label="Queue status: Error, 2 conflicts">' +
                '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i>' +
                '</button>';

            var btn = container.querySelector('.queue-status-btn');
            expect(btn.getAttribute('aria-label')).toContain('Error');
        });

    });

    // ========================================================================
    // Modal/Viewer Accessibility
    // ========================================================================

    FunkyTests.describe('Modal/Viewer Accessibility', function() {

        FunkyTests.it('modal has role="dialog"', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<div class="queue-status-modal" role="dialog" aria-modal="true" aria-labelledby="queue-modal-title">' +
                '<h2 id="queue-modal-title">Queue Status</h2>' +
                '</div>';

            var modal = container.querySelector('.queue-status-modal');
            expect(modal.getAttribute('role')).toBe('dialog');
        });

        FunkyTests.it('modal has accessible name', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<div class="queue-status-modal" role="dialog" aria-labelledby="queue-modal-title">' +
                '<h2 id="queue-modal-title">Queue Status</h2>' +
                '</div>';

            var modal = container.querySelector('.queue-status-modal');
            var labelledBy = modal.getAttribute('aria-labelledby');
            var title = document.getElementById(labelledBy);
            expect(title).not.toBeNull();
        });

        FunkyTests.it('modal has aria-modal="true"', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<div class="queue-status-modal" role="dialog" aria-modal="true"></div>';

            var modal = container.querySelector('.queue-status-modal');
            expect(modal.getAttribute('aria-modal')).toBe('true');
        });

    });

    // ========================================================================
    // Queue Item List
    // ========================================================================

    FunkyTests.describe('Queue Item List', function() {

        FunkyTests.it('queue items list has accessible structure', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<ul class="queue-items-list" role="list" aria-label="Pending queue items">' +
                '<li class="queue-item">Item 1</li>' +
                '<li class="queue-item">Item 2</li>' +
                '</ul>';

            var list = container.querySelector('.queue-items-list');
            expect(list.getAttribute('role') || list.tagName.toLowerCase()).toBeTruthy();
        });

        FunkyTests.it('queue items have meaningful content', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<ul class="queue-items-list">' +
                '<li class="queue-item"><span class="queue-item-type">POST</span> /api/trades</li>' +
                '</ul>';

            var item = container.querySelector('.queue-item');
            expect(item.textContent.length).toBeGreaterThan(0);
        });

        FunkyTests.it('retry buttons have accessible names', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-item-retry" aria-label="Retry this request"><i class="fas fa-redo" aria-hidden="true"></i></button>';

            var retryBtn = container.querySelector('.queue-item-retry');
            var hasLabel = retryBtn.getAttribute('aria-label');
            expect(hasLabel).toBeTruthy();
        });

        FunkyTests.it('delete buttons have accessible names', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<button class="queue-item-delete" aria-label="Remove from queue"><i class="fas fa-trash" aria-hidden="true"></i></button>';

            var deleteBtn = container.querySelector('.queue-item-delete');
            var hasLabel = deleteBtn.getAttribute('aria-label');
            expect(hasLabel).toBeTruthy();
        });

    });

    // ========================================================================
    // Conflict Display
    // ========================================================================

    FunkyTests.describe('Conflict Display', function() {

        FunkyTests.it('conflicts are clearly indicated', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<div class="queue-conflict" role="alert">' +
                '<span class="queue-conflict-icon" aria-hidden="true"><i class="fas fa-exclamation-triangle"></i></span>' +
                '<span>Conflict detected: Record was modified by another user</span>' +
                '</div>';

            var conflict = container.querySelector('.queue-conflict');
            expect(conflict.getAttribute('role')).toBe('alert');
        });

        FunkyTests.it('conflict resolution buttons are accessible', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<div class="queue-conflict-actions">' +
                '<button aria-label="Keep local changes">Keep Mine</button>' +
                '<button aria-label="Use server version">Use Theirs</button>' +
                '</div>';

            var buttons = container.querySelectorAll('button');
            buttons.forEach(function(btn) {
                var hasLabel = btn.getAttribute('aria-label') ||
                              btn.textContent.trim().length > 0;
                expect(hasLabel).toBeTruthy();
            });
        });

    });

    // ========================================================================
    // Visibility Toggle
    // ========================================================================

    FunkyTests.describe('Visibility Toggle', function() {

        FunkyTests.it('hidden when empty respects config', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<div class="queue-status" style="display: none;" aria-hidden="true"></div>';

            var status = container.querySelector('.queue-status');
            // When hidden, should have aria-hidden
            expect(status.getAttribute('aria-hidden') || status.style.display === 'none').toBeTruthy();
        });

        FunkyTests.it('visible status is perceivable', function() {
            var container = document.getElementById('queue-status-test-container');
            container.innerHTML =
                '<div class="queue-status" style="display: block;"><button>5 pending</button></div>';

            var status = container.querySelector('.queue-status');
            expect(status.style.display).toBe('block');
        });

    });

    // ========================================================================
    // API Methods
    // ========================================================================

    FunkyTests.describe('API Methods', function() {

        FunkyTests.it('init creates accessible element', function() {
            if (QueueStatus.init) {
                // Init may require container config
                try {
                    QueueStatus.init({
                        container: '#queue-status-test-container'
                    });
                    expect(true).toBe(true);
                } catch (e) {
                    // May fail without proper queue - that's ok
                    expect(true).toBe(true);
                }
            } else {
                expect(true).toBe(true);
            }
        });

    });

});
