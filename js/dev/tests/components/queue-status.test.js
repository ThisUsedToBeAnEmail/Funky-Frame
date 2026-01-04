/**
 * Funky.QueueStatus Tests
 *
 * Tests for the visual queue status indicator component.
 */

describe('Funky.Component.QueueStatus', function() {

    var QueueStatus;
    var fixture;

    beforeEach(function() {
        // Get fresh reference - module may load after test file
        QueueStatus = Funky.QueueStatus;

        // Force reset internal state before each test
        if (QueueStatus && QueueStatus.isInitialized && QueueStatus.isInitialized()) {
            QueueStatus.destroy();
        }

        // Clean up any stray queue-status elements
        var strayElements = document.querySelectorAll('.queue-status');
        strayElements.forEach(function(el) { el.remove(); });

        fixture = FunkyTests.fixture('<div id="queue-container"></div>');
    });

    afterEach(function() {
        // Destroy QueueStatus if initialized
        if (QueueStatus && QueueStatus.isInitialized && QueueStatus.isInitialized()) {
            QueueStatus.destroy();
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('QueueStatus')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof QueueStatus.init).toBe('function');
        });

        it('has destroy method', function() {
            expect(typeof QueueStatus.destroy).toBe('function');
        });

        it('has showModal method', function() {
            expect(typeof QueueStatus.showModal).toBe('function');
        });

        it('has setVisible method', function() {
            expect(typeof QueueStatus.setVisible).toBe('function');
        });

        it('has refresh method', function() {
            expect(typeof QueueStatus.refresh).toBe('function');
        });

        it('has isInitialized method', function() {
            expect(typeof QueueStatus.isInitialized).toBe('function');
        });

    });

    describe('init()', function() {

        it('initializes the component', function() {
            QueueStatus.init({ container: '#queue-container' });

            expect(QueueStatus.isInitialized()).toBe(true);
        });

        it('creates status element', function() {
            QueueStatus.init({ container: '#queue-container' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl).not.toBeNull();
        });

        it('creates badge element', function() {
            QueueStatus.init({ container: '#queue-container' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl).not.toBeNull();

            var badge = statusEl.querySelector('.queue-status__badge');
            expect(badge).not.toBeNull();
        });

        it('creates icon element', function() {
            QueueStatus.init({ container: '#queue-container' });

            var icon = document.querySelector('.queue-status__icon');
            expect(icon).not.toBeNull();
        });

        it('does not initialize twice', function() {
            QueueStatus.init({ container: '#queue-container' });
            QueueStatus.init({ container: '#queue-container' });

            var statusElements = document.querySelectorAll('.queue-status');
            expect(statusElements.length).toBe(1);
        });

        it('applies position class', function() {
            QueueStatus.init({ container: '#queue-container', position: 'fixed' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.classList.contains('queue-status--fixed')).toBe(true);
        });

        it('applies inline position class', function() {
            QueueStatus.init({ container: '#queue-container', position: 'inline' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.classList.contains('queue-status--inline')).toBe(true);
        });

    });

    describe('destroy()', function() {

        it('removes status element', function() {
            QueueStatus.init({ container: '#queue-container' });
            QueueStatus.destroy();

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl).toBeNull();
        });

        it('sets initialized to false', function() {
            QueueStatus.init({ container: '#queue-container' });
            QueueStatus.destroy();

            expect(QueueStatus.isInitialized()).toBe(false);
        });

        it('handles multiple destroy calls gracefully', function() {
            QueueStatus.init({ container: '#queue-container' });
            QueueStatus.destroy();

            // Should not throw
            QueueStatus.destroy();
        });

    });

    describe('Accessibility', function() {

        it('has role="status"', function() {
            QueueStatus.init({ container: '#queue-container' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.getAttribute('role')).toBe('status');
        });

        it('has aria-live="polite"', function() {
            QueueStatus.init({ container: '#queue-container' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.getAttribute('aria-live')).toBe('polite');
        });

        it('has aria-label', function() {
            QueueStatus.init({ container: '#queue-container' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.getAttribute('aria-label')).toBe('Sync queue status');
        });

        it('badge is hidden from screen readers', function() {
            QueueStatus.init({ container: '#queue-container' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl).not.toBeNull();

            var badge = statusEl.querySelector('.queue-status__badge');
            expect(badge).not.toBeNull();
            expect(badge.getAttribute('aria-hidden')).toBe('true');
        });

        it('creates visually-hidden text for screen readers', function() {
            QueueStatus.init({ container: '#queue-container' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl).not.toBeNull();

            var srText = statusEl.querySelector('.visually-hidden');
            expect(srText).not.toBeNull();
        });

    });

    describe('setVisible()', function() {

        beforeEach(function() {
            QueueStatus.init({ container: '#queue-container', showWhenEmpty: true });
        });

        it('hides indicator when false', function() {
            QueueStatus.setVisible(false);

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.classList.contains('queue-status--hidden')).toBe(true);
        });

        it('shows indicator when true', function() {
            QueueStatus.setVisible(false);
            QueueStatus.setVisible(true);

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.classList.contains('queue-status--hidden')).toBe(false);
        });

    });

    describe('refresh()', function() {

        it('updates display', function() {
            QueueStatus.init({ container: '#queue-container' });

            // Should not throw
            QueueStatus.refresh();
        });

    });

    describe('Icon states', function() {

        it('renders SVG icon', function() {
            QueueStatus.init({ container: '#queue-container' });

            var iconContainer = document.querySelector('.queue-status__icon');
            var svg = iconContainer.querySelector('svg');
            expect(svg).not.toBeNull();
        });

    });

    describe('Badge', function() {

        it('displays initial count of 0', function() {
            QueueStatus.init({ container: '#queue-container' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl).not.toBeNull();

            var badge = statusEl.querySelector('.queue-status__badge');
            expect(badge).not.toBeNull();
            expect(badge.textContent).toBe('0');
        });

    });

    describe('Click handling', function() {

        it('has cursor pointer when clickAction is modal', function() {
            QueueStatus.init({ container: '#queue-container', clickAction: 'modal' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.style.cursor).toBe('pointer');
        });

        it('has cursor pointer when clickAction is custom', function() {
            QueueStatus.init({ container: '#queue-container', clickAction: 'custom' });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.style.cursor).toBe('pointer');
        });

    });

    describe('showWhenEmpty option', function() {

        it('hides when empty and showWhenEmpty is false', function() {
            QueueStatus.init({ container: '#queue-container', showWhenEmpty: false });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.classList.contains('queue-status--hidden')).toBe(true);
        });

        it('shows when showWhenEmpty is true', function() {
            QueueStatus.init({ container: '#queue-container', showWhenEmpty: true });

            var statusEl = document.querySelector('.queue-status');
            expect(statusEl.classList.contains('queue-status--hidden')).toBe(false);
        });

    });

});
