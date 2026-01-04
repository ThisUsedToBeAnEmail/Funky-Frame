/**
 * Visual Regression Tests: Tooltip Component
 *
 * Tests visual appearance of tooltip positioning and styling.
 */

describe('Funky.Visual.Tooltip', function() {

    var Visual = FunkyTests.Visual;
    var Tooltip = Funky.Tooltip;
    var fixture;
    var tooltipInstance;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="visual-tooltip-container" style="width: 400px; height: 300px; padding: 100px; background: #f5f5f5;">' +
            '  <button id="tooltip-target" style="padding: 10px 20px;">Hover me</button>' +
            '</div>'
        );

        // Pause CSS animations for visual testing
        var style = document.createElement('style');
        style.id = 'pause-animations';
        style.textContent = '*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; transition-duration: 0ms !important; }';
        document.head.appendChild(style);
    });

    afterEach(function() {
        if (tooltipInstance && tooltipInstance.dispose) {
            tooltipInstance.dispose();
            tooltipInstance = null;
        }

        // Remove any remaining tooltips
        document.querySelectorAll('.tooltip').forEach(function(el) {
            el.remove();
        });

        fixture.destroy();

        // Remove animation pause style
        var pauseStyle = document.getElementById('pause-animations');
        if (pauseStyle) {
            pauseStyle.remove();
        }
    });

    describe('Tooltip Structure', function() {

        it('creates tooltip element on show', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Test tooltip',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip).not.toBeNull();
            });
        });

        it('tooltip has role tooltip', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Accessible tooltip',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.getAttribute('role')).toBe('tooltip');
            });
        });

        it('has tooltip-inner element', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Inner content',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var inner = document.querySelector('.tooltip-inner');
                expect(inner).not.toBeNull();
            });
        });

        it('has tooltip-arrow element', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'With arrow',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var arrow = document.querySelector('.tooltip-arrow');
                expect(arrow).not.toBeNull();
            });
        });

        it('displays tooltip text', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Hello World',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var inner = document.querySelector('.tooltip-inner');
                expect(inner.textContent).toBe('Hello World');
            });
        });

    });

    describe('Placement Classes', function() {

        it('top placement adds bs-tooltip-top class', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Top tooltip',
                placement: 'top',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.classList.contains('bs-tooltip-top')).toBe(true);
            });
        });

        it('bottom placement adds bs-tooltip-bottom class', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Bottom tooltip',
                placement: 'bottom',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.classList.contains('bs-tooltip-bottom')).toBe(true);
            });
        });

        it('left placement adds bs-tooltip-left class', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Left tooltip',
                placement: 'left',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.classList.contains('bs-tooltip-left')).toBe(true);
            });
        });

        it('right placement adds bs-tooltip-right class', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Right tooltip',
                placement: 'right',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.classList.contains('bs-tooltip-right')).toBe(true);
            });
        });

    });

    describe('Show/Hide States', function() {

        it('adds show class when visible', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Visible tooltip',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.classList.contains('show')).toBe(true);
            });
        });

        it('adds fade class for animation', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Fading tooltip',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.classList.contains('fade')).toBe(true);
            });
        });

        it('removes tooltip on hide', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Hide me',
                trigger: 'manual'
            });

            tooltipInstance.show();

            // Wait for show transition to complete before hiding
            return FunkyTests.delay(200).then(function() {
                tooltipInstance.hide();

                // Allow time for hide animation to complete
                return FunkyTests.delay(500);
            }).then(function() {
                var tooltip = document.querySelector('.tooltip.show');
                var anyTooltip = document.querySelector('.tooltip');
                // Tooltip should be removed, hidden, or no longer have show class
                var isHidden = tooltip === null;
                var isRemoved = anyTooltip === null;
                // Also check if tooltip has opacity 0 or visibility hidden
                var hasHiddenStyles = anyTooltip && (
                    window.getComputedStyle(anyTooltip).opacity === '0' ||
                    window.getComputedStyle(anyTooltip).visibility === 'hidden'
                );
                expect(isHidden || isRemoved || hasHiddenStyles).toBe(true);
            });
        });

    });

    describe('Positioning', function() {

        it('tooltip has absolute positioning', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Positioned tooltip',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.style.position).toBe('absolute');
            });
        });

        it('tooltip has top style set', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Top value',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.style.top).toBeDefined();
                expect(tooltip.style.top).not.toBe('');
            });
        });

        it('tooltip has left style set', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Left value',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.style.left).toBeDefined();
                expect(tooltip.style.left).not.toBe('');
            });
        });

    });

    describe('HTML Content', function() {

        it('renders HTML when html option is true', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: '<strong>Bold</strong> text',
                html: true,
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var inner = document.querySelector('.tooltip-inner');
                var strong = inner.querySelector('strong');
                expect(strong).not.toBeNull();
            });
        });

        it('escapes HTML when html option is false', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: '<strong>Not bold</strong>',
                html: false,
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var inner = document.querySelector('.tooltip-inner');
                var strong = inner.querySelector('strong');
                expect(strong).toBeNull();
                expect(inner.textContent).toContain('<strong>');
            });
        });

    });

    describe('setContent Method', function() {

        it('updates tooltip content', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Original',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                tooltipInstance.setContent('Updated');

                return FunkyTests.delay(50);
            }).then(function() {
                var inner = document.querySelector('.tooltip-inner');
                expect(inner.textContent).toBe('Updated');
            });
        });

    });

    describe('Toggle Method', function() {

        it('toggle shows hidden tooltip', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Toggle me',
                trigger: 'manual'
            });

            tooltipInstance.toggle();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip).not.toBeNull();
            });
        });

        it('toggle hides visible tooltip', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Toggle me',
                trigger: 'manual'
            });

            tooltipInstance.show();

            // Wait for show transition to complete before toggling
            return FunkyTests.delay(200).then(function() {
                tooltipInstance.toggle();

                // Allow time for hide animation to complete
                return FunkyTests.delay(500);
            }).then(function() {
                var tooltip = document.querySelector('.tooltip.show');
                var anyTooltip = document.querySelector('.tooltip');
                // Tooltip should be removed, hidden, or no longer have show class after toggle
                var isHidden = tooltip === null;
                var isRemoved = anyTooltip === null;
                // Also check if tooltip has opacity 0 or visibility hidden
                var hasHiddenStyles = anyTooltip && (
                    window.getComputedStyle(anyTooltip).opacity === '0' ||
                    window.getComputedStyle(anyTooltip).visibility === 'hidden'
                );
                expect(isHidden || isRemoved || hasHiddenStyles).toBe(true);
            });
        });

    });

    describe('Data Attributes', function() {

        beforeEach(function() {
            var target = document.getElementById('tooltip-target');
            target.setAttribute('data-funky-tooltip', 'Data attribute tooltip');
            target.setAttribute('data-placement', 'bottom');
        });

        it('reads title from data-funky-tooltip', function() {
            tooltipInstance = new Tooltip('#tooltip-target', { trigger: 'manual' });
            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var inner = document.querySelector('.tooltip-inner');
                expect(inner.textContent).toBe('Data attribute tooltip');
            });
        });

        it('reads placement from data-placement', function() {
            tooltipInstance = new Tooltip('#tooltip-target', { trigger: 'manual' });
            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip.classList.contains('bs-tooltip-bottom')).toBe(true);
            });
        });

    });

    describe('Static Methods', function() {

        it('getOrCreateInstance creates new instance', function() {
            var instance = Tooltip.getOrCreateInstance('#tooltip-target', {
                title: 'Static method',
                trigger: 'manual'
            });

            expect(instance).not.toBeNull();
            tooltipInstance = instance;
        });

        it('getOrCreateInstance returns existing instance', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'First',
                trigger: 'manual'
            });

            var second = Tooltip.getOrCreateInstance('#tooltip-target');
            expect(second).toBe(tooltipInstance);
        });

        it('getInstance returns null for uninitialized element', function() {
            var instance = Tooltip.getInstance('#tooltip-target');
            expect(instance).toBeNull();
        });

        it('getInstance returns existing instance', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Get me',
                trigger: 'manual'
            });

            var retrieved = Tooltip.getInstance('#tooltip-target');
            expect(retrieved).toBe(tooltipInstance);
        });

    });

    describe('Style Consistency', function() {

        it('tooltip is visible when shown', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Visible',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var tooltip = document.querySelector('.tooltip');
                var styles = Visual.snapshotStyles(tooltip);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

        it('tooltip-inner is visible', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Inner visible',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                var inner = document.querySelector('.tooltip-inner');
                var styles = Visual.snapshotStyles(inner);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

    });

    describe('Dispose Method', function() {

        it('dispose removes tooltip', function() {
            tooltipInstance = new Tooltip('#tooltip-target', {
                title: 'Dispose me',
                trigger: 'manual'
            });

            tooltipInstance.show();

            return FunkyTests.delay(50).then(function() {
                tooltipInstance.dispose();
                tooltipInstance = null;

                return FunkyTests.delay(200);
            }).then(function() {
                var tooltip = document.querySelector('.tooltip');
                expect(tooltip).toBeNull();
            });
        });

        it('dispose restores original title attribute', function() {
            var target = document.getElementById('tooltip-target');
            target.setAttribute('title', 'Original title');

            tooltipInstance = new Tooltip('#tooltip-target', { trigger: 'manual' });

            // Title should be removed
            expect(target.getAttribute('title')).toBeNull();

            tooltipInstance.dispose();
            tooltipInstance = null;

            // Title should be restored (note: dispose clones element so we need fresh reference)
            var newTarget = document.getElementById('tooltip-target');
            expect(newTarget.getAttribute('title')).toBe('Original title');
        });

    });

});
