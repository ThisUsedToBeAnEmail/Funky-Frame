/**
 * E2E Tests: Search and Filter Flow
 *
 * Tests search, filter, and pagination user workflows.
 */

describe('Funky.E2E.SearchFilter', function() {

    var E2E = FunkyTests.E2E;
    var fixture;
    var restoreAPI;
    var allProducts;

    // Skip all tests if E2E utilities not available
    if (!E2E) {
        it('E2E utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    beforeEach(function() {
        // Test data
        allProducts = [
            { id: 1, name: 'Apple iPhone 15', category: 'Electronics', price: 999, inStock: true },
            { id: 2, name: 'Samsung Galaxy S24', category: 'Electronics', price: 899, inStock: true },
            { id: 3, name: 'Nike Air Max', category: 'Sports', price: 150, inStock: true },
            { id: 4, name: 'Apple Watch Ultra', category: 'Electronics', price: 799, inStock: false },
            { id: 5, name: 'Sony WH-1000XM5', category: 'Electronics', price: 349, inStock: true },
            { id: 6, name: 'Adidas Ultraboost', category: 'Sports', price: 180, inStock: true },
            { id: 7, name: 'Apple MacBook Pro', category: 'Electronics', price: 2499, inStock: true },
            { id: 8, name: 'Levi\'s 501 Jeans', category: 'Clothing', price: 69, inStock: true },
            { id: 9, name: 'North Face Jacket', category: 'Clothing', price: 299, inStock: false },
            { id: 10, name: 'Yoga Mat Premium', category: 'Sports', price: 45, inStock: true }
        ];

        fixture = FunkyTests.fixture('<div id="search-filter-container"></div>');

        // Mock API with search and filter support
        restoreAPI = E2E.mockAPI({
            '/api/products': function(opts) {
                var url = opts.url || '/api/products';
                var params = new URLSearchParams(url.split('?')[1] || '');

                var search = params.get('search') || '';
                var category = params.get('category') || '';
                var inStock = params.get('inStock');
                var minPrice = params.get('minPrice');
                var maxPrice = params.get('maxPrice');
                var page = parseInt(params.get('page')) || 1;
                var pageSize = parseInt(params.get('pageSize')) || 5;

                var filtered = allProducts.filter(function(item) {
                    var matchSearch = !search ||
                        item.name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
                    var matchCategory = !category || item.category === category;
                    var matchStock = inStock === null || inStock === '' ||
                        (inStock === 'true' ? item.inStock : !item.inStock);
                    var matchMinPrice = !minPrice || item.price >= parseFloat(minPrice);
                    var matchMaxPrice = !maxPrice || item.price <= parseFloat(maxPrice);

                    return matchSearch && matchCategory && matchStock && matchMinPrice && matchMaxPrice;
                });

                var startIndex = (page - 1) * pageSize;
                var paged = filtered.slice(startIndex, startIndex + pageSize);

                return {
                    data: {
                        items: paged,
                        total: filtered.length,
                        page: page,
                        pageSize: pageSize,
                        totalPages: Math.ceil(filtered.length / pageSize)
                    }
                };
            }
        });
    });

    afterEach(function() {
        if (restoreAPI) restoreAPI();
        E2E.cleanup();
        fixture.destroy();
    });

    function createProductListing() {
        var container = document.getElementById('search-filter-container');
        container.innerHTML =
            '<div class="product-listing">' +
                '<div class="filters-bar">' +
                    '<div class="search-box">' +
                        '<input type="text" id="search-input" placeholder="Search products...">' +
                        '<button id="search-btn" class="btn">Search</button>' +
                    '</div>' +
                    '<div class="filters">' +
                        '<select id="category-filter" class="form-control">' +
                            '<option value="">All Categories</option>' +
                            '<option value="Electronics">Electronics</option>' +
                            '<option value="Sports">Sports</option>' +
                            '<option value="Clothing">Clothing</option>' +
                        '</select>' +
                        '<label class="stock-filter">' +
                            '<input type="checkbox" id="in-stock-filter"> In Stock Only' +
                        '</label>' +
                        '<div class="price-range">' +
                            '<input type="number" id="min-price" placeholder="Min $">' +
                            '<span>-</span>' +
                            '<input type="number" id="max-price" placeholder="Max $">' +
                        '</div>' +
                        '<button id="apply-filters" class="btn btn-primary">Apply Filters</button>' +
                        '<button id="clear-filters" class="btn btn-secondary">Clear</button>' +
                    '</div>' +
                '</div>' +
                '<div class="results-info">' +
                    '<span id="results-count">Loading...</span>' +
                '</div>' +
                '<div id="products-grid" class="products-grid"></div>' +
                '<div class="pagination" id="pagination"></div>' +
            '</div>';

        var currentPage = 1;
        var currentFilters = {};

        function loadProducts() {
            var params = new URLSearchParams();
            if (currentFilters.search) params.set('search', currentFilters.search);
            if (currentFilters.category) params.set('category', currentFilters.category);
            if (currentFilters.inStock) params.set('inStock', 'true');
            if (currentFilters.minPrice) params.set('minPrice', currentFilters.minPrice);
            if (currentFilters.maxPrice) params.set('maxPrice', currentFilters.maxPrice);
            params.set('page', currentPage);
            params.set('pageSize', 5);

            fetch('/api/products?' + params.toString())
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    renderProducts(data);
                    renderPagination(data);
                    updateResultsCount(data.total);
                });
        }

        function renderProducts(data) {
            var grid = document.getElementById('products-grid');
            grid.innerHTML = '';

            if (data.items.length === 0) {
                grid.innerHTML = '<div class="no-results">No products found</div>';
                return;
            }

            data.items.forEach(function(product) {
                var card = document.createElement('div');
                card.className = 'product-card';
                card.setAttribute('data-id', product.id);
                card.innerHTML =
                    '<h4 class="product-name">' + product.name + '</h4>' +
                    '<p class="product-category">' + product.category + '</p>' +
                    '<p class="product-price">$' + product.price + '</p>' +
                    '<span class="stock-badge ' + (product.inStock ? 'in-stock' : 'out-of-stock') + '">' +
                        (product.inStock ? 'In Stock' : 'Out of Stock') +
                    '</span>';
                grid.appendChild(card);
            });
        }

        function renderPagination(data) {
            var pagination = document.getElementById('pagination');
            pagination.innerHTML = '';

            if (data.totalPages <= 1) return;

            for (var i = 1; i <= data.totalPages; i++) {
                var btn = document.createElement('button');
                btn.textContent = i;
                btn.className = 'page-btn' + (i === data.page ? ' active' : '');
                btn.setAttribute('data-page', i);
                btn.addEventListener('click', function() {
                    currentPage = parseInt(this.getAttribute('data-page'));
                    loadProducts();
                });
                pagination.appendChild(btn);
            }
        }

        function updateResultsCount(total) {
            document.getElementById('results-count').textContent = total + ' products found';
        }

        // Event handlers
        document.getElementById('search-btn').addEventListener('click', function() {
            currentFilters.search = document.getElementById('search-input').value;
            currentPage = 1;
            loadProducts();
        });

        document.getElementById('search-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                currentFilters.search = this.value;
                currentPage = 1;
                loadProducts();
            }
        });

        document.getElementById('apply-filters').addEventListener('click', function() {
            currentFilters.category = document.getElementById('category-filter').value;
            currentFilters.inStock = document.getElementById('in-stock-filter').checked;
            currentFilters.minPrice = document.getElementById('min-price').value;
            currentFilters.maxPrice = document.getElementById('max-price').value;
            currentPage = 1;
            loadProducts();
        });

        document.getElementById('clear-filters').addEventListener('click', function() {
            currentFilters = {};
            currentPage = 1;
            document.getElementById('search-input').value = '';
            document.getElementById('category-filter').value = '';
            document.getElementById('in-stock-filter').checked = false;
            document.getElementById('min-price').value = '';
            document.getElementById('max-price').value = '';
            loadProducts();
        });

        // Initial load
        loadProducts();

        return {
            loadProducts: loadProducts,
            setFilters: function(filters) {
                currentFilters = filters;
                currentPage = 1;
                loadProducts();
            }
        };
    }

    describe('Search Functionality', function() {

        it('User can search for products', function() {
            return E2E.scenario('Product Search')
                .given('I have a product listing', function() {
                    createProductListing();
                    return E2E.waitFor('.product-card');
                })
                .when('I search for "Apple"', function() {
                    return E2E.type('#search-input', 'Apple')
                        .then(function() {
                            return E2E.click('#search-btn');
                        });
                })
                .then('I should see only Apple products', function() {
                    return E2E.wait(200).then(function() {
                        var cards = document.querySelectorAll('.product-card');
                        expect(cards.length).toBe(3); // iPhone, Watch, MacBook

                        cards.forEach(function(card) {
                            E2E.assertText(card, 'Apple');
                        });
                    });
                })
                .and('The results count should update', function() {
                    E2E.assertText('#results-count', '3 products found');
                })
                .run();
        });

        it('Search with no results shows message', function() {
            return E2E.scenario('No Search Results')
                .given('I have a product listing', function() {
                    createProductListing();
                    return E2E.waitFor('.product-card');
                })
                .when('I search for a non-existent product', function() {
                    return E2E.type('#search-input', 'xyznonexistent123')
                        .then(function() {
                            return E2E.click('#search-btn');
                        });
                })
                .then('I should see no results message', function() {
                    return E2E.waitFor('.no-results');
                })
                .and('The count should show 0', function() {
                    E2E.assertText('#results-count', '0 products found');
                })
                .run();
        });

        it('User can search by pressing Enter', function() {
            return E2E.scenario('Search with Enter Key')
                .given('I have a product listing', function() {
                    createProductListing();
                    return E2E.waitFor('.product-card');
                })
                .when('I type and press Enter', function() {
                    return E2E.type('#search-input', 'Samsung')
                        .then(function() {
                            return E2E.press('#search-input', 'Enter');
                        });
                })
                .then('Search should execute', function() {
                    return E2E.wait(200).then(function() {
                        E2E.assertText('#products-grid', 'Samsung');
                    });
                })
                .run();
        });

    });

    describe('Filter Functionality', function() {

        it('User can filter by category', function() {
            return E2E.scenario('Category Filter')
                .given('I have a product listing', function() {
                    createProductListing();
                    return E2E.waitFor('.product-card');
                })
                .when('I select Electronics category', function() {
                    return E2E.select('#category-filter', 'Electronics')
                        .then(function() {
                            return E2E.click('#apply-filters');
                        });
                })
                .then('I should see only Electronics products', function() {
                    return E2E.wait(200).then(function() {
                        var cards = document.querySelectorAll('.product-card');
                        cards.forEach(function(card) {
                            E2E.assertText(card, 'Electronics');
                        });
                    });
                })
                .run();
        });

        it('User can filter by stock availability', function() {
            return E2E.scenario('Stock Filter')
                .given('I have a product listing', function() {
                    createProductListing();
                    return E2E.waitFor('.product-card');
                })
                .when('I check In Stock Only', function() {
                    return E2E.check('#in-stock-filter')
                        .then(function() {
                            return E2E.click('#apply-filters');
                        });
                })
                .then('I should see only in-stock products', function() {
                    return E2E.wait(200).then(function() {
                        var outOfStock = document.querySelectorAll('.out-of-stock');
                        expect(outOfStock.length).toBe(0);

                        var inStock = document.querySelectorAll('.in-stock');
                        expect(inStock.length).toBeGreaterThan(0);
                    });
                })
                .run();
        });

        it('User can filter by price range', function() {
            return E2E.scenario('Price Range Filter')
                .given('I have a product listing', function() {
                    createProductListing();
                    return E2E.waitFor('.product-card');
                })
                .when('I set price range $100 - $500', function() {
                    return E2E.type('#min-price', '100')
                        .then(function() { return E2E.type('#max-price', '500'); })
                        .then(function() { return E2E.click('#apply-filters'); });
                })
                .then('I should see products in that range', function() {
                    return E2E.wait(200).then(function() {
                        var cards = document.querySelectorAll('.product-card');
                        cards.forEach(function(card) {
                            var priceText = card.querySelector('.product-price').textContent;
                            var price = parseFloat(priceText.replace('$', ''));
                            expect(price).toBeGreaterThanOrEqual(100);
                            expect(price).toBeLessThanOrEqual(500);
                        });
                    });
                })
                .run();
        });

        it('User can combine multiple filters', function() {
            return E2E.scenario('Combined Filters')
                .given('I have a product listing', function() {
                    createProductListing();
                    return E2E.waitFor('.product-card');
                })
                .when('I apply multiple filters', function() {
                    return E2E.select('#category-filter', 'Electronics')
                        .then(function() { return E2E.check('#in-stock-filter'); })
                        .then(function() { return E2E.type('#max-price', '1000'); })
                        .then(function() { return E2E.click('#apply-filters'); });
                })
                .then('Results should match all criteria', function() {
                    return E2E.wait(200).then(function() {
                        var cards = document.querySelectorAll('.product-card');
                        cards.forEach(function(card) {
                            E2E.assertText(card, 'Electronics');
                            expect(card.querySelector('.in-stock')).not.toBeNull();

                            var priceText = card.querySelector('.product-price').textContent;
                            var price = parseFloat(priceText.replace('$', ''));
                            expect(price).toBeLessThanOrEqual(1000);
                        });
                    });
                })
                .run();
        });

        it('User can clear all filters', function() {
            return E2E.scenario('Clear Filters')
                .given('I have applied filters', function() {
                    createProductListing();
                    return E2E.waitFor('.product-card')
                        .then(function() { return E2E.select('#category-filter', 'Sports'); })
                        .then(function() { return E2E.check('#in-stock-filter'); })
                        .then(function() { return E2E.click('#apply-filters'); })
                        .then(function() { return E2E.wait(200); });
                })
                .when('I click Clear', function() {
                    return E2E.click('#clear-filters');
                })
                .then('All filters should be reset', function() {
                    return E2E.wait(200).then(function() {
                        expect(document.getElementById('category-filter').value).toBe('');
                        expect(document.getElementById('in-stock-filter').checked).toBe(false);
                        expect(document.getElementById('min-price').value).toBe('');
                        expect(document.getElementById('max-price').value).toBe('');
                    });
                })
                .and('All products should be shown', function() {
                    E2E.assertText('#results-count', '10 products found');
                })
                .run();
        });

    });

    describe('Pagination', function() {

        it('User can navigate through pages', function() {
            return E2E.scenario('Pagination Navigation')
                .given('I have a product listing with pagination', function() {
                    createProductListing();
                    return E2E.waitFor('.page-btn');
                })
                .then('I should see page 1 as active', function() {
                    var activePage = document.querySelector('.page-btn.active');
                    expect(activePage.textContent).toBe('1');
                })
                .when('I click page 2', function() {
                    var page2 = document.querySelector('.page-btn[data-page="2"]');
                    return E2E.click(page2);
                })
                .then('Page 2 should be active', function() {
                    return E2E.wait(200).then(function() {
                        var activePage = document.querySelector('.page-btn.active');
                        expect(activePage.textContent).toBe('2');
                    });
                })
                .and('Different products should be shown', function() {
                    // Page 2 should show different products
                    var cards = document.querySelectorAll('.product-card');
                    expect(cards.length).toBeGreaterThan(0);
                })
                .run();
        });

        it('Filters reset pagination to page 1', function() {
            return E2E.scenario('Filter Resets Pagination')
                .given('I am on page 2', function() {
                    createProductListing();
                    return E2E.waitFor('.page-btn')
                        .then(function() {
                            var page2 = document.querySelector('.page-btn[data-page="2"]');
                            return E2E.click(page2);
                        })
                        .then(function() { return E2E.wait(200); });
                })
                .when('I apply a filter', function() {
                    return E2E.select('#category-filter', 'Electronics')
                        .then(function() { return E2E.click('#apply-filters'); });
                })
                .then('I should be back on page 1', function() {
                    return E2E.wait(200).then(function() {
                        var activePage = document.querySelector('.page-btn.active');
                        if (activePage) {
                            expect(activePage.textContent).toBe('1');
                        }
                    });
                })
                .run();
        });

    });

    describe('Search and Filter Combined', function() {

        it('User can search and filter together', function() {
            return E2E.scenario('Search with Filter')
                .given('I have a product listing', function() {
                    createProductListing();
                    return E2E.waitFor('.product-card');
                })
                .when('I search for a term', function() {
                    return E2E.type('#search-input', 'Nike')
                        .then(function() { return E2E.click('#search-btn'); });
                })
                .then('I should see Nike products', function() {
                    return E2E.wait(200).then(function() {
                        E2E.assertText('#products-grid', 'Nike');
                    });
                })
                .when('I also filter by Sports category', function() {
                    return E2E.select('#category-filter', 'Sports')
                        .then(function() { return E2E.click('#apply-filters'); });
                })
                .then('Results should match both search and filter', function() {
                    return E2E.wait(200).then(function() {
                        var cards = document.querySelectorAll('.product-card');
                        cards.forEach(function(card) {
                            E2E.assertText(card, 'Nike');
                            E2E.assertText(card, 'Sports');
                        });
                    });
                })
                .run();
        });

    });

});
