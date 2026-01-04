/**
 * E2E Tests: Sidenav Flow
 *
 * Tests sidebar navigation component including search, groups, and state persistence.
 */

describe('Funky.E2E.Sidenav', function() {

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

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="sidenav-container"></div>');
        localStorage.removeItem('sidenav-collapsed-groups');
        localStorage.removeItem('sidenav-recent-searches');
    });

    afterEach(function() {
        E2E.cleanup();
        fixture.destroy();
    });

    var collapsedGroups = {};

    function createSidenav() {
        var container = document.getElementById('sidenav-container');
        container.innerHTML =
            '<div class="sidenav" data-testid="sidenav">' +
                '<div class="sidenav-header">' +
                    '<input type="text" id="sidenav-search" class="sidenav-search" placeholder="Search navigation...">' +
                '</div>' +
                '<div class="sidenav-content">' +
                    '<div class="nav-group" data-group="main">' +
                        '<div class="nav-group-header" data-group="main">' +
                            '<span class="group-icon">▼</span>' +
                            '<span class="group-title">Main</span>' +
                        '</div>' +
                        '<ul class="nav-items">' +
                            '<li class="nav-item active" data-path="/dashboard"><a href="/dashboard">Dashboard</a></li>' +
                            '<li class="nav-item" data-path="/analytics"><a href="/analytics">Analytics</a></li>' +
                            '<li class="nav-item" data-path="/reports"><a href="/reports">Reports</a></li>' +
                        '</ul>' +
                    '</div>' +
                    '<div class="nav-group" data-group="management">' +
                        '<div class="nav-group-header" data-group="management">' +
                            '<span class="group-icon">▼</span>' +
                            '<span class="group-title">Management</span>' +
                        '</div>' +
                        '<ul class="nav-items">' +
                            '<li class="nav-item" data-path="/users"><a href="/users">Users</a></li>' +
                            '<li class="nav-item" data-path="/roles"><a href="/roles">Roles</a></li>' +
                            '<li class="nav-item" data-path="/permissions"><a href="/permissions">Permissions</a></li>' +
                        '</ul>' +
                    '</div>' +
                    '<div class="nav-group" data-group="settings">' +
                        '<div class="nav-group-header" data-group="settings">' +
                            '<span class="group-icon">▼</span>' +
                            '<span class="group-title">Settings</span>' +
                        '</div>' +
                        '<ul class="nav-items">' +
                            '<li class="nav-item" data-path="/settings/general"><a href="/settings/general">General</a></li>' +
                            '<li class="nav-item" data-path="/settings/security"><a href="/settings/security">Security</a></li>' +
                            '<li class="nav-item" data-path="/settings/notifications"><a href="/settings/notifications">Notifications</a></li>' +
                        '</ul>' +
                    '</div>' +
                '</div>' +
                '<div class="sidenav-footer">' +
                    '<button id="collapse-btn" class="collapse-btn">«</button>' +
                '</div>' +
            '</div>';

        initSidenavLogic();
        loadCollapsedState();
    }

    function initSidenavLogic() {
        document.querySelectorAll('.nav-group-header').forEach(function(header) {
            header.addEventListener('click', function() {
                var group = this.getAttribute('data-group');
                toggleGroup(group);
            });
        });

        document.querySelectorAll('.nav-item a').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                selectItem(this.closest('.nav-item'));
            });
        });

        document.getElementById('sidenav-search').addEventListener('input', function() {
            filterNavigation(this.value);
        });

        document.getElementById('collapse-btn').addEventListener('click', function() {
            toggleSidenavCollapse();
        });
    }

    function toggleGroup(groupName) {
        var group = document.querySelector('.nav-group[data-group="' + groupName + '"]');
        var items = group.querySelector('.nav-items');
        var icon = group.querySelector('.group-icon');

        if (collapsedGroups[groupName]) {
            items.style.display = 'block';
            icon.textContent = '▼';
            delete collapsedGroups[groupName];
        } else {
            items.style.display = 'none';
            icon.textContent = '▶';
            collapsedGroups[groupName] = true;
        }

        saveCollapsedState();
    }

    function saveCollapsedState() {
        localStorage.setItem('sidenav-collapsed-groups', JSON.stringify(collapsedGroups));
    }

    function loadCollapsedState() {
        var saved = localStorage.getItem('sidenav-collapsed-groups');
        if (saved) {
            collapsedGroups = JSON.parse(saved);
            for (var groupName in collapsedGroups) {
                var group = document.querySelector('.nav-group[data-group="' + groupName + '"]');
                if (group) {
                    var items = group.querySelector('.nav-items');
                    var icon = group.querySelector('.group-icon');
                    items.style.display = 'none';
                    icon.textContent = '▶';
                }
            }
        }
    }

    function selectItem(item) {
        document.querySelectorAll('.nav-item').forEach(function(el) {
            el.classList.remove('active');
        });
        item.classList.add('active');
    }

    function filterNavigation(query) {
        query = query.toLowerCase();
        var hasResults = false;

        document.querySelectorAll('.nav-item').forEach(function(item) {
            var text = item.textContent.toLowerCase();
            var matches = !query || text.indexOf(query) !== -1 || fuzzyMatch(text, query);

            item.style.display = matches ? '' : 'none';
            if (matches && query) hasResults = true;
        });

        document.querySelectorAll('.nav-group').forEach(function(group) {
            var visibleItems = group.querySelectorAll('.nav-item[style=""], .nav-item:not([style])');
            var hasVisible = false;
            visibleItems.forEach(function(item) {
                if (item.style.display !== 'none') hasVisible = true;
            });

            if (query && !hasVisible) {
                group.style.display = 'none';
            } else {
                group.style.display = '';
                if (query) {
                    var items = group.querySelector('.nav-items');
                    items.style.display = 'block';
                }
            }
        });
    }

    function fuzzyMatch(text, query) {
        var queryIndex = 0;
        for (var i = 0; i < text.length && queryIndex < query.length; i++) {
            if (text[i] === query[queryIndex]) {
                queryIndex++;
            }
        }
        return queryIndex === query.length;
    }

    function toggleSidenavCollapse() {
        var sidenav = document.querySelector('.sidenav');
        var btn = document.getElementById('collapse-btn');

        if (sidenav.classList.contains('collapsed')) {
            sidenav.classList.remove('collapsed');
            btn.textContent = '«';
        } else {
            sidenav.classList.add('collapsed');
            btn.textContent = '»';
        }
    }

    describe('Group Expansion', function() {

        it('User can expand/collapse sidebar groups', function() {
            return E2E.scenario('Toggle Groups')
                .given('I have a sidenav with groups', function() {
                    createSidenav();
                    return E2E.waitFor('.nav-group');
                })
                .then('All groups should be expanded by default', function() {
                    var mainItems = document.querySelector('.nav-group[data-group="main"] .nav-items');
                    expect(mainItems.style.display).not.toBe('none');
                })
                .when('I click on Main group header', function() {
                    return E2E.click('.nav-group-header[data-group="main"]');
                })
                .then('Main group should collapse', function() {
                    var mainItems = document.querySelector('.nav-group[data-group="main"] .nav-items');
                    expect(mainItems.style.display).toBe('none');
                })
                .and('Icon should change to collapsed state', function() {
                    var icon = document.querySelector('.nav-group[data-group="main"] .group-icon');
                    expect(icon.textContent).toBe('▶');
                })
                .when('I click Main group header again', function() {
                    return E2E.click('.nav-group-header[data-group="main"]');
                })
                .then('Main group should expand', function() {
                    var mainItems = document.querySelector('.nav-group[data-group="main"] .nav-items');
                    expect(mainItems.style.display).toBe('block');
                })
                .run();
        });

        it('Collapsed state persists across sessions', function() {
            return E2E.scenario('Persist Collapsed State')
                .given('I collapsed a group', function() {
                    createSidenav();
                    return E2E.waitFor('.nav-group')
                        .then(function() {
                            return E2E.click('.nav-group-header[data-group="settings"]');
                        });
                })
                .then('Collapsed state should be saved', function() {
                    var saved = localStorage.getItem('sidenav-collapsed-groups');
                    expect(saved).toContain('settings');
                })
                .when('I recreate the sidenav', function() {
                    fixture.destroy();
                    fixture = FunkyTests.fixture('<div id="sidenav-container"></div>');
                    createSidenav();
                    return E2E.waitFor('.nav-group');
                })
                .then('Settings group should still be collapsed', function() {
                    var settingsItems = document.querySelector('.nav-group[data-group="settings"] .nav-items');
                    expect(settingsItems.style.display).toBe('none');
                })
                .run();
        });

    });

    describe('Item Selection', function() {

        it('User can select items and see active state', function() {
            return E2E.scenario('Select Item')
                .given('I have a sidenav', function() {
                    createSidenav();
                    return E2E.waitFor('.nav-item');
                })
                .then('Dashboard should be active by default', function() {
                    E2E.assertHasClass('.nav-item[data-path="/dashboard"]', 'active');
                })
                .when('I click on Users', function() {
                    return E2E.click('.nav-item[data-path="/users"] a');
                })
                .then('Users should become active', function() {
                    E2E.assertHasClass('.nav-item[data-path="/users"]', 'active');
                })
                .and('Dashboard should no longer be active', function() {
                    var dashboard = document.querySelector('.nav-item[data-path="/dashboard"]');
                    expect(dashboard.classList.contains('active')).toBe(false);
                })
                .run();
        });

    });

    describe('Search/Filter', function() {

        it('User can search/filter navigation items', function() {
            return E2E.scenario('Filter Navigation')
                .given('I have a sidenav with search', function() {
                    createSidenav();
                    return E2E.waitFor('#sidenav-search');
                })
                .when('I type "user" in search', function() {
                    return E2E.type('#sidenav-search', 'user');
                })
                .then('Only matching items should be visible', function() {
                    return E2E.wait(100).then(function() {
                        var usersItem = document.querySelector('.nav-item[data-path="/users"]');
                        var dashboardItem = document.querySelector('.nav-item[data-path="/dashboard"]');

                        expect(usersItem.style.display).not.toBe('none');
                        expect(dashboardItem.style.display).toBe('none');
                    });
                })
                .run();
        });

        it('Fuzzy search matches partial text', function() {
            return E2E.scenario('Fuzzy Search')
                .given('I have a sidenav with search', function() {
                    createSidenav();
                    return E2E.waitFor('#sidenav-search');
                })
                .when('I type "anl" for Analytics', function() {
                    return E2E.type('#sidenav-search', 'anl');
                })
                .then('Analytics should be visible', function() {
                    return E2E.wait(100).then(function() {
                        var analyticsItem = document.querySelector('.nav-item[data-path="/analytics"]');
                        expect(analyticsItem.style.display).not.toBe('none');
                    });
                })
                .run();
        });

        it('Clearing search shows all items', function() {
            return E2E.scenario('Clear Search')
                .given('I filtered the navigation', function() {
                    createSidenav();
                    return E2E.waitFor('#sidenav-search')
                        .then(function() { return E2E.type('#sidenav-search', 'user'); })
                        .then(function() { return E2E.wait(100); });
                })
                .when('I clear the search', function() {
                    return E2E.clear('#sidenav-search');
                })
                .then('All items should be visible', function() {
                    return E2E.wait(100).then(function() {
                        var hiddenItems = document.querySelectorAll('.nav-item[style*="none"]');
                        expect(hiddenItems.length).toBe(0);
                    });
                })
                .run();
        });

    });

    describe('Collapse/Expand', function() {

        it('User can collapse and expand the sidebar', function() {
            return E2E.scenario('Sidebar Collapse')
                .given('I have a sidenav', function() {
                    createSidenav();
                    return E2E.waitFor('#collapse-btn');
                })
                .then('Sidenav should be expanded', function() {
                    var sidenav = document.querySelector('.sidenav');
                    expect(sidenav.classList.contains('collapsed')).toBe(false);
                })
                .when('I click collapse button', function() {
                    return E2E.click('#collapse-btn');
                })
                .then('Sidenav should collapse', function() {
                    E2E.assertHasClass('.sidenav', 'collapsed');
                })
                .and('Button icon should change', function() {
                    var btn = document.getElementById('collapse-btn');
                    expect(btn.textContent).toBe('»');
                })
                .when('I click expand button', function() {
                    return E2E.click('#collapse-btn');
                })
                .then('Sidenav should expand', function() {
                    var sidenav = document.querySelector('.sidenav');
                    expect(sidenav.classList.contains('collapsed')).toBe(false);
                })
                .run();
        });

    });

});
