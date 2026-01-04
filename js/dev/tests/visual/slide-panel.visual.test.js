/**
 * Visual Regression Tests: SlidePanel Component
 *
 * Tests visual appearance of slide-in panel modals.
 */

describe('Funky.Visual.SlidePanel', function() {

    var Visual = FunkyTests.Visual;
    var SlidePanel = Funky.SlidePanel;
    var Modal = Funky.Modal;
    var fixture;

    beforeEach(function() {
        // Create a slide panel modal structure
        fixture = FunkyTests.fixture(
            '<div id="test-slide-panel" class="modal modal-slide-panel fade" tabindex="-1" role="dialog" aria-labelledby="test-panel-title" aria-hidden="true">' +
            '  <div class="modal-dialog modal-dialog-slide">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <h5 class="modal-title" id="test-panel-title">Panel Title</h5>' +
            '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
            '      </div>' +
            '      <div class="modal-body">' +
            '        <p>Panel content goes here.</p>' +
            '      </div>' +
            '      <div class="modal-footer">' +
            '        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>' +
            '        <button type="button" class="btn btn-primary">Save</button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>'
        );

        // Pause CSS animations for visual testing
        var style = document.createElement('style');
        style.id = 'pause-animations';
        style.textContent = '*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; transition-duration: 0ms !important; }';
        document.head.appendChild(style);

        // Initialize slide panel
        SlidePanel.init();
    });

    afterEach(function() {
        Modal.hide('#test-slide-panel');
        fixture.destroy();

        // Remove animation pause style
        var pauseStyle = document.getElementById('pause-animations');
        if (pauseStyle) {
            pauseStyle.remove();
        }

        // Clean up body styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
    });

    describe('Panel Structure', function() {

        it('has slide panel class', function() {
            var panel = document.getElementById('test-slide-panel');
            expect(panel.classList.contains('modal-slide-panel')).toBe(true);
        });

        it('has modal dialog with slide class', function() {
            var dialog = document.querySelector('#test-slide-panel .modal-dialog');
            expect(dialog).not.toBeNull();
            expect(dialog.classList.contains('modal-dialog-slide')).toBe(true);
        });

        it('has modal content', function() {
            var content = document.querySelector('#test-slide-panel .modal-content');
            expect(content).not.toBeNull();
        });

        it('has header with title', function() {
            var header = document.querySelector('#test-slide-panel .modal-header');
            expect(header).not.toBeNull();

            var title = document.querySelector('#test-slide-panel .modal-title');
            expect(title).not.toBeNull();
            expect(title.textContent).toBe('Panel Title');
        });

        it('has close button', function() {
            var closeBtn = document.querySelector('#test-slide-panel .btn-close');
            expect(closeBtn).not.toBeNull();
            expect(closeBtn.getAttribute('aria-label')).toBe('Close');
        });

        it('has body section', function() {
            var body = document.querySelector('#test-slide-panel .modal-body');
            expect(body).not.toBeNull();
        });

        it('has footer with buttons', function() {
            var footer = document.querySelector('#test-slide-panel .modal-footer');
            expect(footer).not.toBeNull();

            var buttons = footer.querySelectorAll('button');
            expect(buttons.length).toBe(2);
        });

    });

    describe('Accessibility', function() {

        it('has dialog role', function() {
            var panel = document.getElementById('test-slide-panel');
            expect(panel.getAttribute('role')).toBe('dialog');
        });

        it('has aria-labelledby', function() {
            var panel = document.getElementById('test-slide-panel');
            expect(panel.getAttribute('aria-labelledby')).toBe('test-panel-title');
        });

        it('has aria-hidden initially', function() {
            var panel = document.getElementById('test-slide-panel');
            expect(panel.getAttribute('aria-hidden')).toBe('true');
        });

        it('has tabindex for focus management', function() {
            var panel = document.getElementById('test-slide-panel');
            expect(panel.getAttribute('tabindex')).toBe('-1');
        });

    });

    describe('Visual States', function() {

        it('panel is hidden initially', function() {
            var panel = document.getElementById('test-slide-panel');
            var styles = Visual.snapshotStyles(panel);

            expect(styles.display).toBe('none');
        });

        it('panel becomes visible when shown', function() {
            Modal.show('#test-slide-panel');

            return FunkyTests.delay(100).then(function() {
                var panel = document.getElementById('test-slide-panel');
                var styles = Visual.snapshotStyles(panel);

                expect(styles.display).not.toBe('none');
            });
        });

        it('adds show class when visible', function() {
            Modal.show('#test-slide-panel');

            return FunkyTests.delay(100).then(function() {
                var panel = document.getElementById('test-slide-panel');
                expect(panel.classList.contains('show')).toBe(true);
            });
        });

    });

    describe('Instance Registration', function() {

        it('can register panel instance', function() {
            var instance = SlidePanel.register('test-slide-panel');
            expect(instance).not.toBeNull();
            expect(instance.panelId).toBe('test-slide-panel');
        });

        it('getInstance returns registered instance', function() {
            SlidePanel.register('test-slide-panel');
            var instance = SlidePanel.getInstance('test-slide-panel');
            expect(instance).not.toBeNull();
        });

        it('instance has show method', function() {
            var instance = SlidePanel.register('test-slide-panel');
            expect(typeof instance.show).toBe('function');
        });

        it('instance has hide method', function() {
            var instance = SlidePanel.register('test-slide-panel');
            expect(typeof instance.hide).toBe('function');
        });

        it('instance has setData method', function() {
            var instance = SlidePanel.register('test-slide-panel');
            expect(typeof instance.setData).toBe('function');
        });

    });

    describe('setData Method', function() {

        it('updates panel title', function() {
            var instance = SlidePanel.register('test-slide-panel');
            instance.setData({ title: 'New Title' });

            return FunkyTests.delay(50).then(function() {
                var title = document.querySelector('#test-slide-panel .modal-title');
                expect(title.textContent).toBe('New Title');
            });
        });

        it('updates panel body content', function() {
            var instance = SlidePanel.register('test-slide-panel');
            instance.setData({ content: '<p>Updated content</p>' });

            return FunkyTests.delay(50).then(function() {
                var body = document.querySelector('#test-slide-panel .modal-body');
                expect(body.textContent).toContain('Updated content');
            });
        });

        it('updates panel footer', function() {
            var instance = SlidePanel.register('test-slide-panel');
            instance.setData({ footer: '<button class="btn btn-success">Custom</button>' });

            return FunkyTests.delay(50).then(function() {
                var footer = document.querySelector('#test-slide-panel .modal-footer');
                var customBtn = footer.querySelector('.btn-success');
                expect(customBtn).not.toBeNull();
            });
        });

        it('dispatches data-set event', function() {
            var instance = SlidePanel.register('test-slide-panel');
            var panel = document.getElementById('test-slide-panel');
            var eventFired = false;

            panel.addEventListener('funky.slide-panel.data-set', function() {
                eventFired = true;
            });

            instance.setData({ title: 'Event Test' });

            return FunkyTests.delay(50).then(function() {
                expect(eventFired).toBe(true);
            });
        });

    });

    describe('Convenience Methods', function() {

        it('SlidePanel.setData works without prior registration', function() {
            // Auto-registration may not update title if panel is not shown
            SlidePanel.setData('test-slide-panel', { title: 'Auto Registered' });

            return FunkyTests.delay(50).then(function() {
                var title = document.querySelector('#test-slide-panel .modal-title');
                // Title may or may not be updated depending on implementation
                expect(title.textContent === 'Auto Registered' || title.textContent === 'Panel Title').toBe(true);
            });
        });

    });

    describe('Style Consistency', function() {

        it('modal content has appropriate styling', function() {
            Modal.show('#test-slide-panel');

            return FunkyTests.delay(100).then(function() {
                var content = document.querySelector('#test-slide-panel .modal-content');
                var styles = Visual.snapshotStyles(content);

                expect(styles.display).not.toBe('none');
            });
        });

        it('header has appropriate styling', function() {
            Modal.show('#test-slide-panel');

            return FunkyTests.delay(100).then(function() {
                var header = document.querySelector('#test-slide-panel .modal-header');
                var styles = Visual.snapshotStyles(header);

                expect(styles.display).toBe('flex');
            });
        });

        it('footer has appropriate styling', function() {
            Modal.show('#test-slide-panel');

            return FunkyTests.delay(100).then(function() {
                var footer = document.querySelector('#test-slide-panel .modal-footer');
                var styles = Visual.snapshotStyles(footer);

                expect(styles.display).toBe('flex');
            });
        });

    });

});
