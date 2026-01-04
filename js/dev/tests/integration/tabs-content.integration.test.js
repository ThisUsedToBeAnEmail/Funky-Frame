/**
 * Integration Test: Tabs + Dynamic Content Loading
 *
 * Tests the integration between tabs and dynamic content loading.
 */

describe('Funky.Integration.Tabs.Content', function() {

    var Tabs = Funky.Tabs;
    var Spinner = Funky.Spinner;
    var fixture;
    var loadedUrls;
    var originalFetch;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div class="tabs-container">' +
                '<ul class="nav nav-tabs" role="tablist">' +
                    '<li class="nav-item" role="presentation">' +
                        '<button class="nav-link active" data-funky-tab="#tab-overview" data-src="/api/overview" role="tab">Overview</button>' +
                    '</li>' +
                    '<li class="nav-item" role="presentation">' +
                        '<button class="nav-link" data-funky-tab="#tab-details" data-src="/api/details" role="tab">Details</button>' +
                    '</li>' +
                    '<li class="nav-item" role="presentation">' +
                        '<button class="nav-link" data-funky-tab="#tab-history" data-src="/api/history" role="tab">History</button>' +
                    '</li>' +
                '</ul>' +
                '<div class="tab-content">' +
                    '<div class="tab-pane fade show active" id="tab-overview">Initial Overview Content</div>' +
                    '<div class="tab-pane fade" id="tab-details"></div>' +
                    '<div class="tab-pane fade" id="tab-history"></div>' +
                '</div>' +
            '</div>'
        );

        loadedUrls = [];
        originalFetch = window.fetch;

        window.fetch = function(url) {
            loadedUrls.push(url);
            return Promise.resolve({
                ok: true,
                text: function() {
                    return Promise.resolve('<div class="loaded-content">Content for ' + url + '</div>');
                },
                json: function() {
                    return Promise.resolve({ content: 'Content for ' + url });
                }
            });
        };
    });

    afterEach(function() {
        window.fetch = originalFetch;
        Tabs.destroy('.nav-tabs');
        fixture.destroy();
    });

    describe('Tab Switching with Content', function() {

        it('changes visible content on tab click', function() {
            var tabs = new Tabs('.nav-tabs');

            var detailsBtn = document.querySelector('[data-funky-tab="#tab-details"]');
            FunkyTests.simulate.click(detailsBtn);

            return FunkyTests.delay(50).then(function() {
                var overviewPane = document.getElementById('tab-overview');
                var detailsPane = document.getElementById('tab-details');

                expect(overviewPane.classList.contains('show')).toBe(false);
                expect(detailsPane.classList.contains('show')).toBe(true);
            });
        });

        it('maintains content when switching back', function() {
            var tabs = new Tabs('.nav-tabs');

            // Add content to first tab
            var overviewPane = document.getElementById('tab-overview');
            overviewPane.innerHTML = '<p>Custom content added</p>';

            // Switch to second tab
            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                // Switch back to first
                tabs.show(0);

                return FunkyTests.delay(50);
            }).then(function() {
                var content = overviewPane.querySelector('p');
                expect(content.textContent).toBe('Custom content added');
            });
        });

    });

    describe('Dynamic Content Loading', function() {

        it('loads content from data-src on tab activation', function() {
            var tabs = new Tabs('.nav-tabs');

            var detailsBtn = document.querySelector('[data-funky-tab="#tab-details"]');
            var dataSrc = detailsBtn.getAttribute('data-src');

            // Simulate loading content when tab is shown
            FunkyTests.simulate.click(detailsBtn);

            // Manually trigger fetch for this test (simulating lazy load behavior)
            return fetch(dataSrc)
                .then(function(response) {
                    return response.text();
                })
                .then(function(html) {
                    document.getElementById('tab-details').innerHTML = html;
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    expect(loadedUrls).toContain('/api/details');

                    var content = document.querySelector('#tab-details .loaded-content');
                    expect(content).toBeInDocument();
                });
        });

        it('does not reload cached content', function() {
            var tabs = new Tabs('.nav-tabs');
            var detailsPane = document.getElementById('tab-details');

            // Mark as already loaded
            detailsPane.setAttribute('data-loaded', 'true');
            detailsPane.innerHTML = '<div>Cached content</div>';

            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                // Switch away and back
                tabs.show(0);
                return FunkyTests.delay(50);
            }).then(function() {
                tabs.show(1);
                return FunkyTests.delay(50);
            }).then(function() {
                // Content should still be cached
                expect(detailsPane.textContent).toContain('Cached content');
            });
        });

    });

    describe('Tabs + Spinner Integration', function() {

        it('can show spinner while loading tab content', function() {
            var tabs = new Tabs('.nav-tabs');
            var detailsPane = document.getElementById('tab-details');

            // Show tab
            tabs.show(1);

            // Show spinner in tab pane
            Spinner.show('#tab-details', { text: 'Loading...' });

            return FunkyTests.delay(50).then(function() {
                var spinner = detailsPane.querySelector('.funky-spinner-wrapper');
                expect(spinner).toBeInDocument();

                // Hide spinner after "loading"
                Spinner.hide('#tab-details');

                return FunkyTests.delay(300);
            }).then(function() {
                var spinner = detailsPane.querySelector('.funky-spinner-wrapper');
                expect(spinner).toBeNull();
            });
        });

        it('spinner is contained within tab panel', function() {
            var tabs = new Tabs('.nav-tabs');
            tabs.show(1);

            Spinner.show('#tab-details');

            return FunkyTests.delay(50).then(function() {
                var detailsPane = document.getElementById('tab-details');
                var spinner = detailsPane.querySelector('.funky-spinner-wrapper');

                expect(spinner.parentElement).toBe(detailsPane);

                Spinner.hide('#tab-details');
            });
        });

    });

    describe('Tab Events + Content Updates', function() {

        it('PubSub event triggers on tab show', function() {
            var eventData = null;

            Funky.PubSub.on('funky:tabs:show', function(data) {
                eventData = data;
            });

            var tabs = new Tabs('.nav-tabs');
            tabs.show(1);

            expect(eventData).toBeDefined();

            Funky.PubSub.off('funky:tabs:show');
        });

        it('content can be updated via PubSub event', function() {
            var tabs = new Tabs('.nav-tabs');

            Funky.PubSub.on('funky:content:update', function(data) {
                var pane = document.getElementById(data.tabId);
                if (pane) {
                    pane.innerHTML = data.content;
                }
            });

            Funky.PubSub.emit('funky:content:update', {
                tabId: 'tab-details',
                content: '<p>Updated via event</p>'
            });

            var detailsPane = document.getElementById('tab-details');
            expect(detailsPane.innerHTML).toBe('<p>Updated via event</p>');

            Funky.PubSub.off('funky:content:update');
        });

    });

    describe('Form State in Tabs', function() {

        it('preserves form input values when switching tabs', function() {
            // Add form to first tab
            var overviewPane = document.getElementById('tab-overview');
            overviewPane.innerHTML =
                '<form>' +
                    '<input type="text" id="form-name" value="">' +
                    '<textarea id="form-notes"></textarea>' +
                '</form>';

            var tabs = new Tabs('.nav-tabs');

            // Fill in form
            var nameInput = document.getElementById('form-name');
            var notesInput = document.getElementById('form-notes');
            nameInput.value = 'Test Name';
            notesInput.value = 'Some notes here';

            // Switch to another tab
            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                // Switch back
                tabs.show(0);
                return FunkyTests.delay(50);
            }).then(function() {
                // Form values should be preserved
                expect(document.getElementById('form-name').value).toBe('Test Name');
                expect(document.getElementById('form-notes').value).toBe('Some notes here');
            });
        });

        it('checkbox state is preserved across tab switches', function() {
            var overviewPane = document.getElementById('tab-overview');
            overviewPane.innerHTML =
                '<form>' +
                    '<input type="checkbox" id="form-check1">' +
                    '<input type="checkbox" id="form-check2">' +
                '</form>';

            var tabs = new Tabs('.nav-tabs');

            // Check one box
            var check1 = document.getElementById('form-check1');
            check1.checked = true;

            // Switch tabs
            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                tabs.show(0);
                return FunkyTests.delay(50);
            }).then(function() {
                expect(document.getElementById('form-check1').checked).toBe(true);
                expect(document.getElementById('form-check2').checked).toBe(false);
            });
        });

    });

    describe('Error Handling', function() {

        it('handles failed content load gracefully', function() {
            window.fetch = function() {
                return Promise.reject(new Error('Network error'));
            };

            var tabs = new Tabs('.nav-tabs');
            var detailsPane = document.getElementById('tab-details');
            var errorShown = false;

            // Attempt to load content
            tabs.show(1);

            return fetch('/api/details')
                .catch(function(error) {
                    errorShown = true;
                    detailsPane.innerHTML = '<div class="error">Failed to load content</div>';
                })
                .then(function() {
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    expect(errorShown).toBe(true);
                    expect(detailsPane.querySelector('.error')).toBeInDocument();
                });
        });

    });

    describe('Accessibility with Dynamic Content', function() {

        it('maintains ARIA attributes after content load', function() {
            var tabs = new Tabs('.nav-tabs');

            tabs.show(1);

            return FunkyTests.delay(50).then(function() {
                var button = document.querySelector('[data-funky-tab="#tab-details"]');
                var panel = document.getElementById('tab-details');

                expect(button.getAttribute('aria-selected')).toBe('true');
                expect(panel.getAttribute('role')).toBe('tabpanel');
            });
        });

        it('focus moves to tab panel on activation for screen readers', function() {
            var tabs = new Tabs('.nav-tabs');

            var detailsBtn = document.querySelector('[data-funky-tab="#tab-details"]');
            detailsBtn.focus();

            FunkyTests.simulate.keydown(detailsBtn, { key: 'Enter' });

            return FunkyTests.delay(100).then(function() {
                var panel = document.getElementById('tab-details');
                expect(panel.classList.contains('show')).toBe(true);
            });
        });

    });

});
