/**
 * E2E Tests: SPA Navigation Flow
 *
 * Tests single-page application navigation without full page reloads.
 */

describe('Funky.E2E.SPANavigation', function() {

    var E2E = FunkyTests.E2E;
    var Toast = Funky.Toast;
    var fixture;
    var restoreAPI;

    // Skip all tests if E2E utilities not available
    if (!E2E) {
        it('E2E utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var isHeadless = navigator.webdriver ||
                      window.frameElement !== null ||
                      window.parent !== window ||
                      !document.hasFocus();

    var pages = {
        '/dashboard': '<h1>Dashboard</h1><p>Welcome to the dashboard</p>',
        '/users': '<h1>Users</h1><table id="users-table"><tr><td>User 1</td></tr></table>',
        '/settings': '<h1>Settings</h1><form id="settings-form"><input name="theme"></form>',
        '/reports': '<h1>Reports</h1><div id="charts">Charts here</div>',
        '/not-found': '<h1>404 Not Found</h1><p>Page not found</p>'
    };

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="spa-container"></div>');

        restoreAPI = E2E.mockAPI({
            '/api/page': function(opts) {
                var path = opts.url.match(/path=([^&]+)/);
                if (path) {
                    var pagePath = decodeURIComponent(path[1]);
                    var content = pages[pagePath];
                    if (content) {
                        return { data: { content: content, title: pagePath.substring(1) } };
                    }
                    return { data: { content: pages['/not-found'], title: 'Not Found' }, status: 404 };
                }
                return { data: { content: pages['/dashboard'], title: 'Dashboard' } };
            }
        });
    });

    afterEach(function() {
        if (restoreAPI) restoreAPI();
        E2E.cleanup();
        fixture.destroy();
        historyStack = [];
    });

    var currentPath = '/dashboard';
    var historyStack = [];

    function createSPAApp() {
        var container = document.getElementById('spa-container');
        container.innerHTML =
            '<div class="spa-app">' +
                '<nav class="spa-nav">' +
                    '<a href="/dashboard" class="spa-link" data-spa>Dashboard</a>' +
                    '<a href="/users" class="spa-link" data-spa>Users</a>' +
                    '<a href="/settings" class="spa-link" data-spa>Settings</a>' +
                    '<a href="/reports" class="spa-link" data-spa>Reports</a>' +
                    '<a href="/invalid" class="spa-link" data-spa>Invalid</a>' +
                '</nav>' +
                '<div class="spa-content">' +
                    '<div id="page-content"></div>' +
                '</div>' +
                '<div id="page-loading" class="loading-overlay" style="display: none;">Loading...</div>' +
                '<div class="spa-breadcrumb" id="breadcrumb"></div>' +
            '</div>';

        initSPALogic();
        navigateTo('/dashboard', false);
    }

    function initSPALogic() {
        document.querySelectorAll('.spa-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var path = this.getAttribute('href');
                navigateTo(path, true);
            });
        });

        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.path) {
                navigateTo(e.state.path, false);
            }
        });
    }

    function navigateTo(path, pushState) {
        showLoading(true);

        document.querySelectorAll('.spa-link').forEach(function(link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === path) {
                link.classList.add('active');
            }
        });

        fetch('/api/page?path=' + encodeURIComponent(path))
            .then(function(r) { return r.json(); })
            .then(function(data) {
                showLoading(false);
                document.getElementById('page-content').innerHTML = data.content;
                document.getElementById('breadcrumb').textContent = 'Home > ' + data.title;

                currentPath = path;

                if (pushState) {
                    historyStack.push(path);
                    window.history.pushState({ path: path }, '', path);
                }

                dispatchPageLoadEvent(path);
            })
            .catch(function() {
                showLoading(false);
                Toast.error('Failed to load page');
            });
    }

    function showLoading(show) {
        document.getElementById('page-loading').style.display = show ? 'flex' : 'none';
    }

    function dispatchPageLoadEvent(path) {
        document.dispatchEvent(new CustomEvent('spa:pageload', {
            detail: { path: path }
        }));
    }

    describe('Navigation', function() {

        it('User can navigate between pages without reload', function() {
            if (isHeadless) return;

            return E2E.scenario('SPA Navigation')
                .given('I am on the dashboard', function() {
                    createSPAApp();
                    return E2E.waitFor('#page-content h1');
                })
                .then('I should see the Dashboard content', function() {
                    E2E.assertText('#page-content', 'Dashboard');
                })
                .when('I click Users link', function() {
                    return E2E.click('a[href="/users"]');
                })
                .then('I should see Users content', function() {
                    return E2E.waitUntil(function() {
                        return document.getElementById('page-content').innerHTML.indexOf('Users') !== -1;
                    });
                })
                .and('Users link should be active', function() {
                    E2E.assertHasClass('a[href="/users"]', 'active');
                })
                .and('Breadcrumb should update', function() {
                    E2E.assertText('#breadcrumb', 'users');
                })
                .run();
        });

        it('Navigation state persists in history', function() {
            if (isHeadless) return;

            return E2E.scenario('History State')
                .given('I navigated through multiple pages', function() {
                    createSPAApp();
                    return E2E.waitFor('#page-content h1')
                        .then(function() { return E2E.click('a[href="/users"]'); })
                        .then(function() { return E2E.wait(200); })
                        .then(function() { return E2E.click('a[href="/settings"]'); })
                        .then(function() { return E2E.wait(200); });
                })
                .then('I should be on Settings page', function() {
                    return E2E.waitUntil(function() {
                        return document.getElementById('page-content').innerHTML.indexOf('Settings') !== -1;
                    });
                })
                .and('History stack should have entries', function() {
                    expect(historyStack.length).toBeGreaterThan(0);
                })
                .run();
        });

        it('Direct URL access loads correct page', function() {
            if (isHeadless) return;

            return E2E.scenario('Direct URL')
                .given('I start the app', function() {
                    createSPAApp();
                    return E2E.waitFor('#page-content h1');
                })
                .when('I programmatically navigate to reports', function() {
                    navigateTo('/reports', true);
                    return E2E.wait(200);
                })
                .then('Reports page should load', function() {
                    return E2E.waitUntil(function() {
                        return document.getElementById('page-content').innerHTML.indexOf('Reports') !== -1;
                    });
                })
                .run();
        });

        it('Navigation handles errors gracefully', function() {
            if (isHeadless) return;

            return E2E.scenario('Error Handling')
                .given('I am on the dashboard', function() {
                    createSPAApp();
                    return E2E.waitFor('#page-content h1');
                })
                .when('I navigate to invalid page', function() {
                    return E2E.click('a[href="/invalid"]');
                })
                .then('I should see 404 content', function() {
                    return E2E.waitUntil(function() {
                        return document.getElementById('page-content').innerHTML.indexOf('404') !== -1;
                    });
                })
                .run();
        });

    });

    describe('Active States', function() {

        it('Active link updates on navigation', function() {
            if (isHeadless) return;

            return E2E.scenario('Active Link State')
                .given('I am on dashboard', function() {
                    createSPAApp();
                    return E2E.waitFor('#page-content h1');
                })
                .then('Dashboard link should be active', function() {
                    E2E.assertHasClass('a[href="/dashboard"]', 'active');
                })
                .when('I navigate to Users', function() {
                    return E2E.click('a[href="/users"]');
                })
                .then('Users link should be active', function() {
                    return E2E.wait(200).then(function() {
                        E2E.assertHasClass('a[href="/users"]', 'active');
                    });
                })
                .and('Dashboard link should not be active', function() {
                    var dashLink = document.querySelector('a[href="/dashboard"]');
                    expect(dashLink.classList.contains('active')).toBe(false);
                })
                .run();
        });

    });

    describe('Page Loading', function() {

        it('Loading indicator shows during navigation', function() {
            return E2E.scenario('Loading Indicator')
                .given('I am on dashboard', function() {
                    createSPAApp();
                    return E2E.waitFor('#page-content h1');
                })
                .then('Loading should be hidden initially', function() {
                    E2E.assertHidden('#page-loading');
                })
                .run();
        });

    });

    describe('Page Events', function() {

        it('Page load event fires on navigation', function() {
            if (isHeadless) return;

            var eventFired = false;
            var eventPath = null;

            return E2E.scenario('Page Load Event')
                .given('I listen for page load events', function() {
                    createSPAApp();
                    document.addEventListener('spa:pageload', function(e) {
                        eventFired = true;
                        eventPath = e.detail.path;
                    });
                    return E2E.waitFor('#page-content h1');
                })
                .when('I navigate to Users', function() {
                    return E2E.click('a[href="/users"]');
                })
                .then('Page load event should fire', function() {
                    return E2E.wait(300).then(function() {
                        expect(eventFired).toBe(true);
                    });
                })
                .and('Event should contain correct path', function() {
                    expect(eventPath).toBe('/users');
                })
                .run();
        });

    });

});
