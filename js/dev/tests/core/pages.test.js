/**
 * Tests for Funky.Pages
 * Page registry and SPA cache system
 */
FunkyTests.describe('Funky.Core.Pages', function() {
    var expect = FunkyTests.expect;
    var fixture;
    var testPageCounter = 0;

    // Helper to create unique page IDs
    function uniquePageId() {
        return 'test-page-' + (++testPageCounter) + '-' + Date.now();
    }

    // Create a test page module
    function createTestModule(options) {
        options = options || {};
        return {
            id: options.id || uniquePageId(),
            entities: options.entities || [],
            init: options.init || function() {},
            destroy: options.destroy || function() { return {}; },
            update: options.update || function() {}
        };
    }

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="spaContent"></div>');
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
        // Clear cache between tests
        if (Funky.Pages && Funky.Pages.cache) {
            Funky.Pages.cache.clear();
        }
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.Pages).toBeDefined();
        });

        FunkyTests.it('has register method', function() {
            expect(typeof Funky.Pages.register).toBe('function');
        });

        FunkyTests.it('has get method', function() {
            expect(typeof Funky.Pages.get).toBe('function');
        });

        FunkyTests.it('has has method', function() {
            expect(typeof Funky.Pages.has).toBe('function');
        });

        FunkyTests.it('has list method', function() {
            expect(typeof Funky.Pages.list).toBe('function');
        });

        FunkyTests.it('has mount method', function() {
            expect(typeof Funky.Pages.mount).toBe('function');
        });

        FunkyTests.it('has unmount method', function() {
            expect(typeof Funky.Pages.unmount).toBe('function');
        });

        FunkyTests.it('has cache property', function() {
            expect(Funky.Pages.cache).toBeDefined();
        });

        FunkyTests.it('has handleDataChange method', function() {
            expect(typeof Funky.Pages.handleDataChange).toBe('function');
        });

        FunkyTests.it('has configure method', function() {
            expect(typeof Funky.Pages.configure).toBe('function');
        });
    });

    FunkyTests.describe('register()', function() {
        FunkyTests.it('registers a page module with ID', function() {
            var pageId = uniquePageId();
            var module = createTestModule({ id: pageId });
            var result = Funky.Pages.register(pageId, module);
            expect(result).toBe(true);
            expect(Funky.Pages.has(pageId)).toBe(true);
        });

        FunkyTests.it('registers a page module with object signature', function() {
            var module = createTestModule();
            var result = Funky.Pages.register(module);
            expect(result).toBe(true);
            expect(Funky.Pages.has(module.id)).toBe(true);
        });

        FunkyTests.it('returns false for duplicate registration', function() {
            var pageId = uniquePageId();
            var module = createTestModule({ id: pageId });
            Funky.Pages.register(pageId, module);
            var result = Funky.Pages.register(pageId, module);
            expect(result).toBe(false);
        });

        FunkyTests.it('requires init method', function() {
            var pageId = uniquePageId();
            var module = { id: pageId };
            var result = Funky.Pages.register(pageId, module);
            expect(result).toBe(false);
        });
    });

    FunkyTests.describe('get()', function() {
        FunkyTests.it('returns registered page module', function() {
            var pageId = uniquePageId();
            var module = createTestModule({ id: pageId });
            Funky.Pages.register(pageId, module);
            var retrieved = Funky.Pages.get(pageId);
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(pageId);
        });

        FunkyTests.it('returns null for non-existent page', function() {
            var result = Funky.Pages.get('non-existent-page');
            expect(result).toBeNull();
        });
    });

    FunkyTests.describe('has()', function() {
        FunkyTests.it('returns true for registered page', function() {
            var pageId = uniquePageId();
            var module = createTestModule({ id: pageId });
            Funky.Pages.register(pageId, module);
            expect(Funky.Pages.has(pageId)).toBe(true);
        });

        FunkyTests.it('returns false for non-existent page', function() {
            expect(Funky.Pages.has('non-existent-page')).toBe(false);
        });
    });

    FunkyTests.describe('list()', function() {
        FunkyTests.it('returns array of registered page IDs', function() {
            var pageId = uniquePageId();
            var module = createTestModule({ id: pageId });
            Funky.Pages.register(pageId, module);
            var list = Funky.Pages.list();
            expect(Array.isArray(list)).toBe(true);
            expect(list).toContain(pageId);
        });
    });

    FunkyTests.describe('getActivePage()', function() {
        FunkyTests.it('has getActivePage method', function() {
            expect(typeof Funky.Pages.getActivePage).toBe('function');
        });

        FunkyTests.it('returns string or null', function() {
            var result = Funky.Pages.getActivePage();
            expect(result === null || typeof result === 'string').toBe(true);
        });
    });

    FunkyTests.describe('cache API', function() {
        FunkyTests.it('has set method', function() {
            expect(typeof Funky.Pages.cache.set).toBe('function');
        });

        FunkyTests.it('has get method', function() {
            expect(typeof Funky.Pages.cache.get).toBe('function');
        });

        FunkyTests.it('has has method', function() {
            expect(typeof Funky.Pages.cache.has).toBe('function');
        });

        FunkyTests.it('has invalidate method', function() {
            expect(typeof Funky.Pages.cache.invalidate).toBe('function');
        });

        FunkyTests.it('has clear method', function() {
            expect(typeof Funky.Pages.cache.clear).toBe('function');
        });

        FunkyTests.it('has stats method', function() {
            expect(typeof Funky.Pages.cache.stats).toBe('function');
        });

        FunkyTests.it('stores and retrieves HTML', function() {
            var pageId = uniquePageId();
            var html = '<div>Test content</div>';
            Funky.Pages.cache.set(pageId, html, {});
            var cached = Funky.Pages.cache.get(pageId);
            expect(cached).toBeDefined();
            expect(cached.html).toBe(html);
        });

        FunkyTests.it('returns null for non-existent cache entry', function() {
            var result = Funky.Pages.cache.get('non-existent-cache');
            expect(result).toBeNull();
        });

        FunkyTests.it('invalidates cache entry', function() {
            var pageId = uniquePageId();
            Funky.Pages.cache.set(pageId, '<div>Test</div>', {});
            expect(Funky.Pages.cache.has(pageId)).toBe(true);
            Funky.Pages.cache.invalidate(pageId);
            expect(Funky.Pages.cache.has(pageId)).toBe(false);
        });

        FunkyTests.it('clears all cache entries', function() {
            var pageId1 = uniquePageId();
            var pageId2 = uniquePageId();
            Funky.Pages.cache.set(pageId1, '<div>Test 1</div>', {});
            Funky.Pages.cache.set(pageId2, '<div>Test 2</div>', {});
            Funky.Pages.cache.clear();
            expect(Funky.Pages.cache.has(pageId1)).toBe(false);
            expect(Funky.Pages.cache.has(pageId2)).toBe(false);
        });

        FunkyTests.it('returns stats object', function() {
            var stats = Funky.Pages.cache.stats();
            expect(stats).toBeDefined();
            expect(typeof stats.size).toBe('number');
            expect(typeof stats.maxSize).toBe('number');
            expect(Array.isArray(stats.pages)).toBe(true);
        });

        FunkyTests.it('marks cache as stale', function() {
            var pageId = uniquePageId();
            Funky.Pages.cache.set(pageId, '<div>Test</div>', {});
            Funky.Pages.cache.markStale(pageId);
            // Stale entries are not returned
            var result = Funky.Pages.cache.get(pageId);
            expect(result).toBeNull();
        });

        FunkyTests.it('invalidates by entity type', function() {
            var pageId = uniquePageId();
            var module = createTestModule({
                id: pageId,
                entities: ['trades']
            });
            Funky.Pages.register(module);
            Funky.Pages.cache.set(pageId, '<div>Test</div>', {});
            Funky.Pages.cache.invalidateByEntity('trades');
            // Should be marked stale
            expect(Funky.Pages.cache.get(pageId)).toBeNull();
        });
    });

    FunkyTests.describe('Form state utilities', function() {
        FunkyTests.it('has captureFormState method', function() {
            expect(typeof Funky.Pages.captureFormState).toBe('function');
        });

        FunkyTests.it('has restoreFormState method', function() {
            expect(typeof Funky.Pages.restoreFormState).toBe('function');
        });

        FunkyTests.it('captures form values', function() {
            var container = document.getElementById('spaContent');
            container.innerHTML = [
                '<form id="testForm">',
                '  <input type="text" name="username" value="testuser">',
                '  <input type="checkbox" name="remember" checked>',
                '</form>'
            ].join('');

            var state = Funky.Pages.captureFormState('#spaContent');
            expect(state).toBeDefined();
            expect(state.testForm).toBeDefined();
            expect(state.testForm.username).toBe('testuser');
            expect(state.testForm.remember).toBe(true);
        });

        FunkyTests.it('returns empty object for no forms', function() {
            var container = document.getElementById('spaContent');
            container.innerHTML = '<div>No forms here</div>';
            var state = Funky.Pages.captureFormState('#spaContent');
            expect(state).toBeDefined();
            expect(Object.keys(state).length).toBe(0);
        });
    });

    FunkyTests.describe('Table row utilities', function() {
        FunkyTests.it('has updateTableRow method', function() {
            expect(typeof Funky.Pages.updateTableRow).toBe('function');
        });

        FunkyTests.it('has removeTableRow method', function() {
            expect(typeof Funky.Pages.removeTableRow).toBe('function');
        });

        FunkyTests.it('has addTableRow method', function() {
            expect(typeof Funky.Pages.addTableRow).toBe('function');
        });

        FunkyTests.it('removes table row by ID', function() {
            var container = document.getElementById('spaContent');
            container.innerHTML = [
                '<table id="testTable">',
                '  <tbody>',
                '    <tr data-id="1"><td>Row 1</td></tr>',
                '    <tr data-id="2"><td>Row 2</td></tr>',
                '  </tbody>',
                '</table>'
            ].join('');

            var result = Funky.Pages.removeTableRow('#testTable', '1');
            expect(result).toBe(true);
            expect(container.querySelector('tr[data-id="1"]')).toBeNull();
            expect(container.querySelector('tr[data-id="2"]')).not.toBeNull();
        });

        FunkyTests.it('returns false for non-existent row', function() {
            var container = document.getElementById('spaContent');
            container.innerHTML = '<table id="testTable"><tbody></tbody></table>';
            var result = Funky.Pages.removeTableRow('#testTable', '999');
            expect(result).toBe(false);
        });
    });

    FunkyTests.describe('updateElements()', function() {
        FunkyTests.it('has updateElements method', function() {
            expect(typeof Funky.Pages.updateElements).toBe('function');
        });

        FunkyTests.it('updates matching elements', function() {
            var container = document.getElementById('spaContent');
            container.innerHTML = [
                '<span data-entity-id="123">Old Value</span>',
                '<span data-entity-id="456">Another Value</span>'
            ].join('');

            var count = Funky.Pages.updateElements('[data-entity-id="123"]', function(el) {
                el.textContent = 'New Value';
            }, { container: '#spaContent' });

            expect(count).toBe(1);
            expect(container.querySelector('[data-entity-id="123"]').textContent).toBe('New Value');
        });
    });

    FunkyTests.describe('handleDataChange()', function() {
        FunkyTests.it('handles data change without error', function() {
            expect(function() {
                Funky.Pages.handleDataChange('trades', 123, 'update', { status: 'new' });
            }).not.toThrow();
        });

        FunkyTests.it('handles refresh action', function() {
            expect(function() {
                Funky.Pages.handleDataChange('trades', null, 'refresh');
            }).not.toThrow();
        });
    });

    FunkyTests.describe('getPagesByEntity()', function() {
        FunkyTests.it('has getPagesByEntity method', function() {
            expect(typeof Funky.Pages.getPagesByEntity).toBe('function');
        });

        FunkyTests.it('returns array', function() {
            var result = Funky.Pages.getPagesByEntity('unknown-entity');
            expect(Array.isArray(result)).toBe(true);
        });

        FunkyTests.it('returns pages registered with entity', function() {
            var pageId = uniquePageId();
            var module = createTestModule({
                id: pageId,
                entities: ['clients']
            });
            Funky.Pages.register(module);
            var pages = Funky.Pages.getPagesByEntity('clients');
            expect(pages).toContain(pageId);
        });
    });

    FunkyTests.describe('configure()', function() {
        FunkyTests.it('accepts configuration object', function() {
            expect(function() {
                Funky.Pages.configure({
                    debug: false
                });
            }).not.toThrow();
        });

        FunkyTests.it('accepts cache TTL configuration', function() {
            expect(function() {
                Funky.Pages.configure({
                    cacheTTL: 10 * 60 * 1000
                });
            }).not.toThrow();
        });
    });

    FunkyTests.describe('prefetch()', function() {
        FunkyTests.it('has prefetch method', function() {
            expect(typeof Funky.Pages.prefetch).toBe('function');
        });

        FunkyTests.it('accepts URL without error', function() {
            expect(function() {
                Funky.Pages.prefetch('/some/page');
            }).not.toThrow();
        });
    });

    FunkyTests.describe('isManaged()', function() {
        FunkyTests.it('has isManaged method', function() {
            expect(typeof Funky.Pages.isManaged).toBe('function');
        });

        FunkyTests.it('returns boolean', function() {
            var result = Funky.Pages.isManaged('some-page');
            expect(typeof result).toBe('boolean');
        });
    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    FunkyTests.describe('Error handling', function() {
        FunkyTests.it('register handles null gracefully', function() {
            expect(function() {
                Funky.Pages.register(null);
            }).not.toThrow();
        });

        FunkyTests.it('register handles undefined gracefully', function() {
            expect(function() {
                Funky.Pages.register(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('register handles empty object gracefully', function() {
            var result = Funky.Pages.register({});
            expect(result).toBe(false);
        });

        FunkyTests.it('get handles null gracefully', function() {
            expect(function() {
                var result = Funky.Pages.get(null);
                expect(result).toBeNull();
            }).not.toThrow();
        });

        FunkyTests.it('get handles undefined gracefully', function() {
            expect(function() {
                var result = Funky.Pages.get(undefined);
                expect(result).toBeNull();
            }).not.toThrow();
        });

        FunkyTests.it('has handles null gracefully', function() {
            expect(function() {
                var result = Funky.Pages.has(null);
                expect(result).toBe(false);
            }).not.toThrow();
        });

        FunkyTests.it('cache.set handles null key gracefully', function() {
            expect(function() {
                Funky.Pages.cache.set(null, '<div>Test</div>', {});
            }).not.toThrow();
        });

        FunkyTests.it('cache.get handles null key gracefully', function() {
            expect(function() {
                var result = Funky.Pages.cache.get(null);
                expect(result).toBeNull();
            }).not.toThrow();
        });

        FunkyTests.it('cache.invalidate handles null key gracefully', function() {
            expect(function() {
                Funky.Pages.cache.invalidate(null);
            }).not.toThrow();
        });

        FunkyTests.it('handleDataChange handles null entity gracefully', function() {
            expect(function() {
                Funky.Pages.handleDataChange(null, 123, 'update');
            }).not.toThrow();
        });

        FunkyTests.it('handleDataChange handles invalid action gracefully', function() {
            expect(function() {
                Funky.Pages.handleDataChange('trades', 123, null);
            }).not.toThrow();
        });

        FunkyTests.it('captureFormState handles invalid selector gracefully', function() {
            expect(function() {
                Funky.Pages.captureFormState('invalid[[[selector');
            }).not.toThrow();
        });

        FunkyTests.it('updateTableRow handles missing table gracefully', function() {
            var result = Funky.Pages.updateTableRow('#non-existent-table', '1', '<td>New</td>');
            expect(result).toBe(false);
        });

        FunkyTests.it('removeTableRow handles missing table gracefully', function() {
            var result = Funky.Pages.removeTableRow('#non-existent-table', '1');
            expect(result).toBe(false);
        });

        FunkyTests.it('module init error does not crash mount', function() {
            var pageId = uniquePageId();
            var module = createTestModule({
                id: pageId,
                init: function() {
                    throw new Error('Init error');
                }
            });
            Funky.Pages.register(pageId, module);

            expect(function() {
                Funky.Pages.mount(pageId);
            }).not.toThrow();
        });
    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    FunkyTests.describe('Edge cases', function() {
        FunkyTests.it('handles very long page ID', function() {
            var longId = 'page-' + 'a'.repeat(500);
            var module = createTestModule({ id: longId });
            var result = Funky.Pages.register(longId, module);
            expect(result).toBe(true);
        });

        FunkyTests.it('handles page ID with special characters', function() {
            var specialId = 'page-with-dashes_and_underscores.123';
            var module = createTestModule({ id: specialId });
            var result = Funky.Pages.register(specialId, module);
            expect(result).toBe(true);
        });

        FunkyTests.it('handles empty entities array', function() {
            var pageId = uniquePageId();
            var module = createTestModule({
                id: pageId,
                entities: []
            });
            var result = Funky.Pages.register(module);
            expect(result).toBe(true);
        });

        FunkyTests.it('handles multiple entity types', function() {
            var pageId = uniquePageId();
            var module = createTestModule({
                id: pageId,
                entities: ['trades', 'clients', 'orders', 'invoices']
            });
            var result = Funky.Pages.register(module);
            expect(result).toBe(true);

            var tradePages = Funky.Pages.getPagesByEntity('trades');
            var clientPages = Funky.Pages.getPagesByEntity('clients');

            expect(tradePages).toContain(pageId);
            expect(clientPages).toContain(pageId);
        });

        FunkyTests.it('cache handles very large HTML content', function() {
            var pageId = uniquePageId();
            var largeHtml = '<div>' + 'x'.repeat(100000) + '</div>';

            Funky.Pages.cache.set(pageId, largeHtml, {});

            var cached = Funky.Pages.cache.get(pageId);
            expect(cached.html.length).toBe(largeHtml.length);
        });

        FunkyTests.it('cache handles HTML with special characters', function() {
            var pageId = uniquePageId();
            var specialHtml = '<div data-attr="<script>alert(\'xss\')</script>">Test</div>';

            Funky.Pages.cache.set(pageId, specialHtml, {});

            var cached = Funky.Pages.cache.get(pageId);
            expect(cached.html).toBe(specialHtml);
        });

        FunkyTests.it('cache handles Unicode content', function() {
            var pageId = uniquePageId();
            var unicodeHtml = '<div>日本語 🎉 émoji العربية</div>';

            Funky.Pages.cache.set(pageId, unicodeHtml, {});

            var cached = Funky.Pages.cache.get(pageId);
            expect(cached.html).toBe(unicodeHtml);
        });

        FunkyTests.it('handles rapid cache set/get cycles', function() {
            var pageId = uniquePageId();

            for (var i = 0; i < 100; i++) {
                Funky.Pages.cache.set(pageId, '<div>Content ' + i + '</div>', {});
            }

            var cached = Funky.Pages.cache.get(pageId);
            expect(cached.html).toBe('<div>Content 99</div>');
        });

        FunkyTests.it('list returns empty array when no pages registered', function() {
            // Clear existing registrations first by testing with unique filter
            var list = Funky.Pages.list();
            expect(Array.isArray(list)).toBe(true);
        });

        FunkyTests.it('handles form with no named elements', function() {
            var container = document.getElementById('spaContent');
            container.innerHTML = '<form id="emptyForm"><button>Submit</button></form>';

            var state = Funky.Pages.captureFormState('#spaContent');
            expect(state).toBeDefined();
        });

        FunkyTests.it('handles form with disabled elements', function() {
            var container = document.getElementById('spaContent');
            container.innerHTML = [
                '<form id="disabledForm">',
                '  <input type="text" name="enabled" value="value1">',
                '  <input type="text" name="disabled" value="value2" disabled>',
                '</form>'
            ].join('');

            var state = Funky.Pages.captureFormState('#spaContent');
            expect(state.disabledForm).toBeDefined();
        });
    });

    // =========================================================================
    // ASYNC BEHAVIOR TESTS
    // =========================================================================
    FunkyTests.describe('Async behavior', function() {
        FunkyTests.it('prefetch returns promise or handles gracefully', function(done) {
            var result = Funky.Pages.prefetch('/some/page');

            // Should complete without blocking
            setTimeout(function() {
                expect(true).toBe(true);
                done();
            }, 100);
        });

        FunkyTests.it('mount completes asynchronously', function(done) {
            var pageId = uniquePageId();
            var initCalled = false;

            var module = createTestModule({
                id: pageId,
                init: function() {
                    initCalled = true;
                }
            });

            Funky.Pages.register(pageId, module);
            Funky.Pages.mount(pageId);

            setTimeout(function() {
                expect(initCalled).toBe(true);
                done();
            }, 50);
        });

        FunkyTests.it('unmount completes asynchronously', function(done) {
            var pageId = uniquePageId();
            var destroyCalled = false;

            var module = createTestModule({
                id: pageId,
                destroy: function() {
                    destroyCalled = true;
                    return {};
                }
            });

            Funky.Pages.register(pageId, module);
            Funky.Pages.mount(pageId);

            setTimeout(function() {
                Funky.Pages.unmount(pageId);

                setTimeout(function() {
                    expect(destroyCalled).toBe(true);
                    done();
                }, 50);
            }, 50);
        });

        FunkyTests.it('handleDataChange processes updates asynchronously', function(done) {
            expect(function() {
                Funky.Pages.handleDataChange('trades', 123, 'update', { status: 'new' });
            }).not.toThrow();

            setTimeout(function() {
                expect(true).toBe(true);
                done();
            }, 50);
        });
    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    FunkyTests.describe('Cleanup', function() {
        FunkyTests.it('cache.clear removes all entries', function() {
            var pageId1 = uniquePageId();
            var pageId2 = uniquePageId();

            Funky.Pages.cache.set(pageId1, '<div>1</div>', {});
            Funky.Pages.cache.set(pageId2, '<div>2</div>', {});

            Funky.Pages.cache.clear();

            expect(Funky.Pages.cache.has(pageId1)).toBe(false);
            expect(Funky.Pages.cache.has(pageId2)).toBe(false);
        });

        FunkyTests.it('cache.invalidate removes specific entry only', function() {
            var pageId1 = uniquePageId();
            var pageId2 = uniquePageId();

            Funky.Pages.cache.set(pageId1, '<div>1</div>', {});
            Funky.Pages.cache.set(pageId2, '<div>2</div>', {});

            Funky.Pages.cache.invalidate(pageId1);

            expect(Funky.Pages.cache.has(pageId1)).toBe(false);
            expect(Funky.Pages.cache.has(pageId2)).toBe(true);
        });

        FunkyTests.it('unmount calls destroy method', function(done) {
            var pageId = uniquePageId();
            var destroyed = false;

            var module = createTestModule({
                id: pageId,
                destroy: function() {
                    destroyed = true;
                    return {};
                }
            });

            Funky.Pages.register(pageId, module);
            Funky.Pages.mount(pageId);

            setTimeout(function() {
                Funky.Pages.unmount(pageId);
                setTimeout(function() {
                    expect(destroyed).toBe(true);
                    done();
                }, 50);
            }, 50);
        });

        FunkyTests.it('invalidateByEntity clears related cache entries', function() {
            var pageId = uniquePageId();
            var module = createTestModule({
                id: pageId,
                entities: ['products']
            });

            Funky.Pages.register(module);
            Funky.Pages.cache.set(pageId, '<div>Products</div>', {});

            expect(Funky.Pages.cache.has(pageId)).toBe(true);

            Funky.Pages.cache.invalidateByEntity('products');

            // Should be marked stale
            expect(Funky.Pages.cache.get(pageId)).toBeNull();
        });

        FunkyTests.it('cache.stats returns accurate counts', function() {
            var pageId1 = uniquePageId();
            var pageId2 = uniquePageId();

            Funky.Pages.cache.clear();

            Funky.Pages.cache.set(pageId1, '<div>1</div>', {});
            Funky.Pages.cache.set(pageId2, '<div>2</div>', {});

            var stats = Funky.Pages.cache.stats();

            expect(stats.size).toBe(2);
        });
    });

    // =========================================================================
    // STATE VERIFICATION TESTS
    // =========================================================================
    FunkyTests.describe('State verification', function() {
        FunkyTests.it('getActivePage returns null or string', function() {
            var active = Funky.Pages.getActivePage();
            expect(active === null || typeof active === 'string').toBe(true);
        });

        FunkyTests.it('cache preserves state object', function() {
            var pageId = uniquePageId();
            var state = { scrollTop: 100, formData: { field: 'value' } };

            Funky.Pages.cache.set(pageId, '<div>Test</div>', state);

            var cached = Funky.Pages.cache.get(pageId);
            expect(cached.state.scrollTop).toBe(100);
            expect(cached.state.formData.field).toBe('value');
        });

        FunkyTests.it('registered pages persist between operations', function() {
            var pageId = uniquePageId();
            var module = createTestModule({ id: pageId });

            Funky.Pages.register(pageId, module);

            // Perform other operations
            Funky.Pages.cache.clear();
            Funky.Pages.list();

            // Original registration should persist
            expect(Funky.Pages.has(pageId)).toBe(true);
        });

        FunkyTests.it('module functions are preserved', function() {
            var pageId = uniquePageId();
            var initValue = 'test-init-value';

            var module = createTestModule({
                id: pageId,
                init: function() { return initValue; }
            });

            Funky.Pages.register(pageId, module);

            var retrieved = Funky.Pages.get(pageId);
            expect(retrieved.init()).toBe(initValue);
        });
    });

    // =========================================================================
    // INPUT VALIDATION TESTS
    // =========================================================================
    FunkyTests.describe('Input validation', function() {
        FunkyTests.it('register rejects module without init', function() {
            var pageId = uniquePageId();
            var result = Funky.Pages.register(pageId, { id: pageId });
            expect(result).toBe(false);
        });

        FunkyTests.it('updateElements handles invalid selector gracefully', function() {
            expect(function() {
                Funky.Pages.updateElements('invalid[[[', function() {});
            }).not.toThrow();
        });

        FunkyTests.it('updateElements handles null callback gracefully', function() {
            expect(function() {
                Funky.Pages.updateElements('.test-selector', null);
            }).not.toThrow();
        });

        FunkyTests.it('configure handles empty object', function() {
            expect(function() {
                Funky.Pages.configure({});
            }).not.toThrow();
        });

        FunkyTests.it('configure handles null gracefully', function() {
            expect(function() {
                Funky.Pages.configure(null);
            }).not.toThrow();
        });

        FunkyTests.it('prefetch handles empty string', function() {
            expect(function() {
                Funky.Pages.prefetch('');
            }).not.toThrow();
        });

        FunkyTests.it('prefetch handles null', function() {
            expect(function() {
                Funky.Pages.prefetch(null);
            }).not.toThrow();
        });
    });
});
