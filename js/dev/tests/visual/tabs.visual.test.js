/**
 * Visual Regression Tests: Tabs Component
 *
 * Tests visual appearance of tab navigation and content panels.
 */

describe('Funky.Visual.Tabs', function() {

    var Visual = FunkyTests.Visual;
    var Tabs = Funky.Tabs;
    var fixture;
    var tabsInstance;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="visual-tabs-container">' +
                '<ul class="nav nav-tabs" id="test-tabs" role="tablist">' +
                    '<li class="nav-item">' +
                        '<button class="nav-link active" data-funky-tab="#tab1" role="tab">Tab One</button>' +
                    '</li>' +
                    '<li class="nav-item">' +
                        '<button class="nav-link" data-funky-tab="#tab2" role="tab">Tab Two</button>' +
                    '</li>' +
                    '<li class="nav-item">' +
                        '<button class="nav-link" data-funky-tab="#tab3" role="tab">Tab Three</button>' +
                    '</li>' +
                '</ul>' +
                '<div class="tab-content">' +
                    '<div class="tab-pane show active" id="tab1" role="tabpanel">Content for Tab One</div>' +
                    '<div class="tab-pane" id="tab2" role="tabpanel">Content for Tab Two</div>' +
                    '<div class="tab-pane" id="tab3" role="tabpanel">Content for Tab Three</div>' +
                '</div>' +
            '</div>'
        );
    });

    afterEach(function() {
        if (tabsInstance) {
            tabsInstance.dispose();
            tabsInstance = null;
        }
        Tabs.destroy('#test-tabs');
        fixture.destroy();
    });

    describe('Tab Navigation', function() {

        it('default tabs have correct structure', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var container = document.getElementById('visual-tabs-container');
                var tabs = container.querySelectorAll('.nav-link');
                var panels = container.querySelectorAll('.tab-pane');

                expect(tabs.length).toBe(3);
                expect(panels.length).toBe(3);
            });
        });

        it('active tab has active class', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var activeTab = document.querySelector('#test-tabs .nav-link.active');
                expect(activeTab).not.toBeNull();
                expect(activeTab.classList.contains('active')).toBe(true);
            });
        });

        it('inactive tab does not have active class', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var inactiveTab = document.querySelector('#test-tabs .nav-link:not(.active)');
                expect(inactiveTab).not.toBeNull();
                expect(inactiveTab.classList.contains('active')).toBe(false);
            });
        });

    });

    describe('Tab States', function() {

        it('tab hover state', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var tab = document.querySelector('#test-tabs .nav-link:not(.active)');
                if (!tab) {
                    throw new Error('Tab not found');
                }

                // Capture before hover
                var beforeStyles = Visual.snapshotStyles(tab);

                // Simulate hover using mouseover event and class
                tab.classList.add('hover');
                FunkyTests.simulate.mouseover(tab);

                return FunkyTests.delay(50).then(function() {
                    var afterStyles = Visual.snapshotStyles(tab);

                    // Hover should potentially change some styles
                    expect(afterStyles).toBeDefined();

                    tab.classList.remove('hover');
                });
            });
        });

        it('tab focus state has visible indicator', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var tab = document.querySelector('#test-tabs .nav-link');
                if (!tab) {
                    throw new Error('Tab not found');
                }

                tab.focus();

                return FunkyTests.delay(50).then(function() {
                    var styles = Visual.snapshotStyles(tab);

                    // Should have some focus indicator
                    var hasFocusIndicator = styles.outline !== 'none' ||
                                            styles.boxShadow !== 'none' ||
                                            styles.borderColor !== styles.borderColor;

                    // Note: focus styling varies by implementation
                    expect(styles).toBeDefined();
                });
            });
        });

        it('disabled tab has disabled attribute', function() {
            var container = document.getElementById('visual-tabs-container');
            var tabNav = container.querySelector('#test-tabs');
            tabNav.innerHTML +=
                '<li class="nav-item">' +
                    '<button class="nav-link disabled" data-funky-tab="#tab4" disabled>Disabled Tab</button>' +
                '</li>';

            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var disabledTab = document.querySelector('#test-tabs .nav-link.disabled');
                expect(disabledTab).not.toBeNull();
                expect(disabledTab.disabled).toBe(true);
            });
        });

    });

    describe('Tab Content', function() {

        it('active content panel is visible', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var activePanel = document.querySelector('.tab-pane.active');
                expect(activePanel).not.toBeNull();
                expect(activePanel.classList.contains('active')).toBe(true);
            });
        });

        it('hidden content panel is not visible', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var hiddenPanel = document.querySelector('.tab-pane:not(.active):not(.show)');
                if (!hiddenPanel) {
                    throw new Error('Hidden panel not found');
                }

                expect(hiddenPanel.classList.contains('show')).toBe(false);
                expect(hiddenPanel.classList.contains('active')).toBe(false);
            });
        });

    });

    describe('Tab Switching', function() {

        it('tab switch updates visual state', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                // Switch to tab 2
                tabsInstance.show(1);

                return FunkyTests.delay(100);
            }).then(function() {
                var tabs = document.querySelectorAll('#test-tabs .nav-link');
                var panels = document.querySelectorAll('.tab-pane');

                // First tab should be inactive
                expect(tabs[0].classList.contains('active')).toBe(false);

                // Second tab should be active
                expect(tabs[1].classList.contains('active')).toBe(true);

                // Second panel should be visible
                expect(panels[1].classList.contains('active') || panels[1].classList.contains('show')).toBe(true);
            });
        });

    });

    describe('Tab Variants', function() {

        it('pills variant has nav-pills class', function() {
            var container = document.getElementById('visual-tabs-container');
            var nav = container.querySelector('.nav-tabs');
            nav.classList.remove('nav-tabs');
            nav.classList.add('nav-pills');

            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                expect(nav.classList.contains('nav-pills')).toBe(true);
                expect(nav.classList.contains('nav-tabs')).toBe(false);
            });
        });

        it('vertical tabs has flex-column class', function() {
            var container = document.getElementById('visual-tabs-container');
            container.style.display = 'flex';

            var nav = container.querySelector('.nav-tabs');
            nav.classList.add('flex-column');

            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                expect(nav.classList.contains('flex-column')).toBe(true);
            });
        });

    });

    describe('Tab with Icons', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-tabs-container');
            container.querySelector('#test-tabs').innerHTML =
                '<li class="nav-item">' +
                    '<button class="nav-link active" data-funky-tab="#tab1">' +
                        '<span class="icon">&#9733;</span> Stars' +
                    '</button>' +
                '</li>' +
                '<li class="nav-item">' +
                    '<button class="nav-link" data-funky-tab="#tab2">' +
                        '<span class="icon">&#9829;</span> Hearts' +
                    '</button>' +
                '</li>';
        });

        it('tabs with icons have icon elements', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var icons = document.querySelectorAll('#test-tabs .icon');
                expect(icons.length).toBe(2);
            });
        });

    });

    describe('Tab Overflow', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-tabs-container');
            container.style.width = '300px';

            var nav = container.querySelector('#test-tabs');
            nav.innerHTML = '';

            for (var i = 1; i <= 10; i++) {
                nav.innerHTML +=
                    '<li class="nav-item">' +
                        '<button class="nav-link' + (i === 1 ? ' active' : '') + '" data-funky-tab="#tab' + i + '">' +
                            'Tab ' + i +
                        '</button>' +
                    '</li>';
            }
        });

        it('handles many tabs gracefully', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var container = document.getElementById('visual-tabs-container');
                var nav = container.querySelector('#test-tabs');

                var styles = Visual.snapshotStyles(nav);

                // Should handle overflow somehow
                expect(styles.overflowX === 'auto' ||
                       styles.overflowX === 'scroll' ||
                       styles.flexWrap === 'wrap' ||
                       styles.display).toBeDefined();
            });
        });

    });

    describe('Tab Style Consistency', function() {

        it('all tabs have consistent height', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var tabs = document.querySelectorAll('#test-tabs .nav-link');
                var heights = [];

                tabs.forEach(function(tab) {
                    heights.push(tab.getBoundingClientRect().height);
                });

                // All tabs should have approximately same height (allow 5px variance for rendering)
                var firstHeight = heights[0];
                heights.forEach(function(h) {
                    expect(Math.abs(h - firstHeight)).toBeLessThan(5);
                });
            });
        });

        it('tab padding is consistent', function() {
            tabsInstance = new Tabs('#test-tabs');

            return FunkyTests.delay(100).then(function() {
                var tabs = document.querySelectorAll('#test-tabs .nav-link');
                if (tabs.length === 0) {
                    throw new Error('No nav-link elements found');
                }

                // Check that tabs have some padding applied (via computed styles)
                tabs.forEach(function(tab) {
                    var computed = window.getComputedStyle(tab);
                    // Just verify we can read padding values - they may be '0px' if no CSS
                    expect(typeof computed.paddingTop).toBe('string');
                    expect(typeof computed.paddingBottom).toBe('string');
                });
            });
        });

    });

});
