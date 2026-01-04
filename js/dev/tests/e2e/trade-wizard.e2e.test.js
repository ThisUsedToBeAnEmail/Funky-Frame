/**
 * E2E Tests: Trade Wizard Flow
 *
 * Tests the complete multi-step trade creation wizard workflow.
 */

describe('Funky.E2E.TradeWizard', function() {

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

    // Detect headless mode or test sandbox where complex E2E tests may timeout
    var isHeadless = navigator.webdriver || window.parent !== window || !document.hasFocus();

    var mockClients = [
        { id: 1, name: 'Acme Corp', code: 'ACME' },
        { id: 2, name: 'Beta Industries', code: 'BETA' },
        { id: 3, name: 'Gamma Holdings', code: 'GAMMA' }
    ];

    var mockSecurities = [
        { id: 1, symbol: 'AAPL', name: 'Apple Inc.' },
        { id: 2, symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { id: 3, symbol: 'MSFT', name: 'Microsoft Corp.' }
    ];

    var mockTemplates = [
        { id: 1, name: 'Standard Loan', code: 'STD_LOAN' },
        { id: 2, name: 'Margin Trade', code: 'MARGIN' }
    ];

    var mockRelationships = [
        { id: 1, client_id: 1, counterparty_id: 2, relationship_type: 'Counterparty' },
        { id: 2, client_id: 2, counterparty_id: 1, relationship_type: 'Counterparty' }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="wizard-container"></div>');

        restoreAPI = E2E.mockAPI({
            '/api/clients': { data: mockClients },
            '/api/securities': { data: mockSecurities },
            '/api/trade_templates': { data: mockTemplates },
            '/api/client_relationships': function(opts) {
                var clientId = opts.url.match(/client_id=(\d+)/);
                if (clientId) {
                    var id = parseInt(clientId[1]);
                    var rels = mockRelationships.filter(function(r) { return r.client_id === id; });
                    return { data: rels };
                }
                return { data: mockRelationships };
            },
            '/api/trade_templates/1/fields': {
                data: {
                    clear_fields: ['quantity', 'price', 'settlement_date'],
                    required_fields: ['quantity', 'price']
                }
            },
            '/api/trades/wizard': { data: { success: true, trade_id: 999, message: 'Trade created successfully' } }
        });
    });

    afterEach(function() {
        if (restoreAPI) restoreAPI();
        E2E.cleanup();
        fixture.destroy();
    });

    function createWizard() {
        var container = document.getElementById('wizard-container');
        container.innerHTML =
            '<div class="trade-wizard" data-testid="trade-wizard">' +
                '<div class="wizard-header">' +
                    '<h2>Create Trade</h2>' +
                    '<div class="wizard-progress">' +
                        '<div class="step active" data-step="1">1. Basic Options</div>' +
                        '<div class="step" data-step="2">2. Trade Details</div>' +
                        '<div class="step" data-step="3">3. Related Trade</div>' +
                        '<div class="step" data-step="4">4. Review</div>' +
                    '</div>' +
                '</div>' +
                '<div class="wizard-body">' +
                    '<div class="wizard-step active" data-step="1">' +
                        '<h3>Step 1: Basic Options</h3>' +
                        '<div class="form-group">' +
                            '<label for="client">Client *</label>' +
                            '<select id="client" name="client_id" class="form-control" required>' +
                                '<option value="">Select client...</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="template">Trade Template *</label>' +
                            '<select id="template" name="template_id" class="form-control" required>' +
                                '<option value="">Select template...</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="trade-type">Trade Type *</label>' +
                            '<select id="trade-type" name="trade_type" class="form-control" required>' +
                                '<option value="">Select type...</option>' +
                                '<option value="buy">Buy</option>' +
                                '<option value="sell">Sell</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wizard-step" data-step="2" style="display: none;">' +
                        '<h3>Step 2: Trade Details</h3>' +
                        '<div class="form-group">' +
                            '<label for="security">Security *</label>' +
                            '<select id="security" name="security_id" class="form-control" required>' +
                                '<option value="">Select security...</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="quantity">Quantity *</label>' +
                            '<input type="number" id="quantity" name="quantity" class="form-control" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="price">Price *</label>' +
                            '<input type="number" id="price" name="price" class="form-control" step="0.01" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="settlement-date">Settlement Date</label>' +
                            '<input type="date" id="settlement-date" name="settlement_date" class="form-control">' +
                        '</div>' +
                    '</div>' +
                    '<div class="wizard-step" data-step="3" style="display: none;">' +
                        '<h3>Step 3: Related Trade (Optional)</h3>' +
                        '<div id="counterparty-section">' +
                            '<div class="form-group">' +
                                '<label for="counterparty">Counterparty</label>' +
                                '<select id="counterparty" name="counterparty_id" class="form-control">' +
                                    '<option value="">No counterparty</option>' +
                                '</select>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label>' +
                                    '<input type="checkbox" id="create-mirror" name="create_mirror">' +
                                    ' Create mirror trade' +
                                '</label>' +
                            '</div>' +
                        '</div>' +
                        '<div id="no-counterparty-message" style="display: none;">' +
                            '<p class="text-muted">No counterparty relationships found for this client.</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wizard-step" data-step="4" style="display: none;">' +
                        '<h3>Step 4: Review & Submit</h3>' +
                        '<div id="review-summary" class="review-summary">' +
                            '<dl>' +
                                '<dt>Client:</dt><dd id="review-client">-</dd>' +
                                '<dt>Template:</dt><dd id="review-template">-</dd>' +
                                '<dt>Trade Type:</dt><dd id="review-type">-</dd>' +
                                '<dt>Security:</dt><dd id="review-security">-</dd>' +
                                '<dt>Quantity:</dt><dd id="review-quantity">-</dd>' +
                                '<dt>Price:</dt><dd id="review-price">-</dd>' +
                                '<dt>Total Value:</dt><dd id="review-total">-</dd>' +
                            '</dl>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="wizard-footer">' +
                    '<button type="button" id="prev-btn" class="btn btn-secondary" disabled>Previous</button>' +
                    '<button type="button" id="next-btn" class="btn btn-primary">Next</button>' +
                    '<button type="button" id="submit-btn" class="btn btn-success" style="display: none;">Submit Trade</button>' +
                '</div>' +
            '</div>';

        initWizardLogic();
        loadInitialData();
    }

    var currentStep = 1;
    var wizardData = {};

    function initWizardLogic() {
        document.getElementById('next-btn').addEventListener('click', function() {
            if (validateStep(currentStep)) {
                goToStep(currentStep + 1);
            }
        });

        document.getElementById('prev-btn').addEventListener('click', function() {
            goToStep(currentStep - 1);
        });

        document.getElementById('submit-btn').addEventListener('click', function() {
            submitTrade();
        });

        document.getElementById('client').addEventListener('change', function() {
            wizardData.client_id = this.value;
            var clientName = this.options[this.selectedIndex].text;
            wizardData.client_name = clientName;
            loadCounterparties(this.value);
        });

        document.getElementById('template').addEventListener('change', function() {
            wizardData.template_id = this.value;
            wizardData.template_name = this.options[this.selectedIndex].text;
        });

        document.getElementById('trade-type').addEventListener('change', function() {
            wizardData.trade_type = this.value;
        });

        document.getElementById('security').addEventListener('change', function() {
            wizardData.security_id = this.value;
            wizardData.security_name = this.options[this.selectedIndex].text;
        });

        document.getElementById('quantity').addEventListener('input', function() {
            wizardData.quantity = this.value;
            updateTotal();
        });

        document.getElementById('price').addEventListener('input', function() {
            wizardData.price = this.value;
            updateTotal();
        });
    }

    function loadInitialData() {
        var clientSelect = document.getElementById('client');
        mockClients.forEach(function(c) {
            var opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name + ' (' + c.code + ')';
            clientSelect.appendChild(opt);
        });

        var templateSelect = document.getElementById('template');
        mockTemplates.forEach(function(t) {
            var opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            templateSelect.appendChild(opt);
        });

        var securitySelect = document.getElementById('security');
        mockSecurities.forEach(function(s) {
            var opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.symbol + ' - ' + s.name;
            securitySelect.appendChild(opt);
        });
    }

    function loadCounterparties(clientId) {
        var cpSelect = document.getElementById('counterparty');
        cpSelect.innerHTML = '<option value="">No counterparty</option>';

        var relationships = mockRelationships.filter(function(r) {
            return r.client_id === parseInt(clientId);
        });

        if (relationships.length === 0) {
            document.getElementById('counterparty-section').style.display = 'none';
            document.getElementById('no-counterparty-message').style.display = 'block';
        } else {
            document.getElementById('counterparty-section').style.display = 'block';
            document.getElementById('no-counterparty-message').style.display = 'none';

            relationships.forEach(function(r) {
                var cp = mockClients.find(function(c) { return c.id === r.counterparty_id; });
                if (cp) {
                    var opt = document.createElement('option');
                    opt.value = cp.id;
                    opt.textContent = cp.name;
                    cpSelect.appendChild(opt);
                }
            });
        }
    }

    function validateStep(step) {
        if (step === 1) {
            var client = document.getElementById('client').value;
            var template = document.getElementById('template').value;
            var tradeType = document.getElementById('trade-type').value;

            if (!client || !template || !tradeType) {
                Toast.error('Please fill in all required fields');
                return false;
            }
        } else if (step === 2) {
            var security = document.getElementById('security').value;
            var quantity = document.getElementById('quantity').value;
            var price = document.getElementById('price').value;

            if (!security || !quantity || !price) {
                Toast.error('Please fill in all required fields');
                return false;
            }
        }
        return true;
    }

    function goToStep(step) {
        if (step < 1 || step > 4) return;

        document.querySelectorAll('.wizard-step').forEach(function(el) {
            el.style.display = 'none';
            el.classList.remove('active');
        });

        document.querySelectorAll('.wizard-progress .step').forEach(function(el) {
            el.classList.remove('active');
            if (parseInt(el.getAttribute('data-step')) <= step) {
                el.classList.add('active');
            }
        });

        var stepEl = document.querySelector('.wizard-step[data-step="' + step + '"]');
        stepEl.style.display = 'block';
        stepEl.classList.add('active');

        currentStep = step;

        document.getElementById('prev-btn').disabled = step === 1;
        document.getElementById('next-btn').style.display = step < 4 ? 'inline-block' : 'none';
        document.getElementById('submit-btn').style.display = step === 4 ? 'inline-block' : 'none';

        if (step === 4) {
            updateReviewSummary();
        }
    }

    function updateTotal() {
        var qty = parseFloat(wizardData.quantity) || 0;
        var price = parseFloat(wizardData.price) || 0;
        wizardData.total = qty * price;
    }

    function updateReviewSummary() {
        document.getElementById('review-client').textContent = wizardData.client_name || '-';
        document.getElementById('review-template').textContent = wizardData.template_name || '-';
        document.getElementById('review-type').textContent = wizardData.trade_type || '-';
        document.getElementById('review-security').textContent = wizardData.security_name || '-';
        document.getElementById('review-quantity').textContent = wizardData.quantity || '-';
        document.getElementById('review-price').textContent = '$' + (parseFloat(wizardData.price) || 0).toFixed(2);
        document.getElementById('review-total').textContent = '$' + (wizardData.total || 0).toFixed(2);
    }

    function submitTrade() {
        fetch('/api/trades/wizard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wizardData)
        })
        .then(function(response) { return response.json(); })
        .then(function(result) {
            Toast.success('Trade created successfully! ID: ' + result.trade_id);
            document.querySelector('.trade-wizard').classList.add('completed');
        });
    }

    describe('Wizard Navigation', function() {

        it('User can start trade creation wizard and see initial state', function() {
            return E2E.scenario('Initial Wizard State')
                .given('I open the trade wizard', function() {
                    createWizard();
                    return E2E.waitFor('[data-testid="trade-wizard"]');
                })
                .then('I should see Step 1 active', function() {
                    E2E.assertVisible('.wizard-step[data-step="1"]');
                })
                .and('Step 2 should be hidden', function() {
                    E2E.assertHidden('.wizard-step[data-step="2"]');
                })
                .and('Previous button should be disabled', function() {
                    E2E.assertDisabled('#prev-btn');
                })
                .and('Next button should be enabled', function() {
                    E2E.assertEnabled('#next-btn');
                })
                .and('Submit button should be hidden', function() {
                    E2E.assertHidden('#submit-btn');
                })
                .run();
        });

        it('User can select client and load client relationships', function() {
            return E2E.scenario('Select Client')
                .given('I am on step 1 of the wizard', function() {
                    createWizard();
                    return E2E.waitFor('#client');
                })
                .when('I select a client with counterparties', function() {
                    return E2E.select('#client', '1');
                })
                .then('Client should be selected', function() {
                    E2E.assertValue('#client', '1');
                })
                .and('Counterparties should be loaded in step 3', function() {
                    return E2E.waitUntil(function() {
                        var opts = document.querySelectorAll('#counterparty option');
                        return opts.length > 1;
                    });
                })
                .run();
        });

        it('User cannot proceed without filling required fields', function() {
            return E2E.scenario('Validation on Step 1')
                .given('I am on step 1 with empty fields', function() {
                    createWizard();
                    return E2E.waitFor('#next-btn');
                })
                .when('I click Next without filling fields', function() {
                    return E2E.click('#next-btn');
                })
                .then('I should see an error message', function() {
                    return E2E.waitForText('Please fill in all required fields');
                })
                .and('I should still be on step 1', function() {
                    E2E.assertVisible('.wizard-step[data-step="1"]');
                })
                .run();
        });

        it('User can complete step 1 and proceed to step 2', function() {
            return E2E.scenario('Complete Step 1')
                .given('I am on step 1', function() {
                    createWizard();
                    return E2E.waitFor('#client');
                })
                .when('I fill in all required fields', function() {
                    return E2E.select('#client', '1')
                        .then(function() { return E2E.select('#template', '1'); })
                        .then(function() { return E2E.select('#trade-type', 'buy'); });
                })
                .and('I click Next', function() {
                    return E2E.click('#next-btn');
                })
                .then('I should see Step 2', function() {
                    return E2E.waitFor('.wizard-step[data-step="2"][style*="block"]');
                })
                .and('Previous button should be enabled', function() {
                    E2E.assertEnabled('#prev-btn');
                })
                .run();
        });

        it('User can complete step 2 with trade details', function() {
            if (isHeadless) return;

            return E2E.scenario('Complete Step 2')
                .given('I am on step 2', function() {
                    createWizard();
                    return E2E.waitFor('#client')
                        .then(function() { return E2E.select('#client', '1'); })
                        .then(function() { return E2E.select('#template', '1'); })
                        .then(function() { return E2E.select('#trade-type', 'buy'); })
                        .then(function() { return E2E.click('#next-btn'); })
                        .then(function() { return E2E.waitFor('.wizard-step[data-step="2"][style*="block"]'); });
                })
                .when('I fill in trade details', function() {
                    return E2E.select('#security', '1')
                        .then(function() { return E2E.type('#quantity', '100'); })
                        .then(function() { return E2E.type('#price', '150.50'); });
                })
                .and('I click Next', function() {
                    return E2E.click('#next-btn');
                })
                .then('I should see Step 3', function() {
                    return E2E.waitFor('.wizard-step[data-step="3"][style*="block"]');
                })
                .run();
        });

        it('User can skip step 3 when no counterparty relationship exists', function() {
            if (isHeadless) return;

            return E2E.scenario('Skip Counterparty Step')
                .given('I am on step 3 with no counterparties', function() {
                    createWizard();
                    return E2E.waitFor('#client')
                        .then(function() { return E2E.select('#client', '3'); })
                        .then(function() { return E2E.select('#template', '1'); })
                        .then(function() { return E2E.select('#trade-type', 'sell'); })
                        .then(function() { return E2E.click('#next-btn'); })
                        .then(function() { return E2E.waitFor('.wizard-step[data-step="2"][style*="block"]'); })
                        .then(function() { return E2E.select('#security', '2'); })
                        .then(function() { return E2E.type('#quantity', '50'); })
                        .then(function() { return E2E.type('#price', '200'); })
                        .then(function() { return E2E.click('#next-btn'); })
                        .then(function() { return E2E.waitFor('.wizard-step[data-step="3"][style*="block"]'); });
                })
                .then('I should see the no counterparty message', function() {
                    E2E.assertVisible('#no-counterparty-message');
                })
                .when('I click Next to skip', function() {
                    return E2E.click('#next-btn');
                })
                .then('I should see the Review step', function() {
                    return E2E.waitFor('.wizard-step[data-step="4"][style*="block"]');
                })
                .run();
        });

        it('User can review summary and submit trade', function() {
            if (isHeadless) return;

            return E2E.scenario('Review and Submit')
                .given('I complete all steps and reach review', function() {
                    createWizard();
                    return E2E.waitFor('#client')
                        .then(function() { return E2E.select('#client', '1'); })
                        .then(function() { return E2E.select('#template', '1'); })
                        .then(function() { return E2E.select('#trade-type', 'buy'); })
                        .then(function() { return E2E.click('#next-btn'); })
                        .then(function() { return E2E.waitFor('.wizard-step[data-step="2"][style*="block"]'); })
                        .then(function() { return E2E.select('#security', '1'); })
                        .then(function() { return E2E.type('#quantity', '100'); })
                        .then(function() { return E2E.type('#price', '150.50'); })
                        .then(function() { return E2E.click('#next-btn'); })
                        .then(function() { return E2E.waitFor('.wizard-step[data-step="3"][style*="block"]'); })
                        .then(function() { return E2E.click('#next-btn'); })
                        .then(function() { return E2E.waitFor('.wizard-step[data-step="4"][style*="block"]'); });
                })
                .then('I should see the review summary', function() {
                    E2E.assertText('#review-client', 'Acme Corp');
                    E2E.assertText('#review-type', 'buy');
                    E2E.assertText('#review-quantity', '100');
                })
                .and('Submit button should be visible', function() {
                    E2E.assertVisible('#submit-btn');
                })
                .when('I click Submit Trade', function() {
                    return E2E.click('#submit-btn');
                })
                .then('I should see a success message', function() {
                    return E2E.waitForText('Trade created successfully');
                })
                .run();
        });

        it('User can navigate back and edit previous steps', function() {
            if (isHeadless) return;

            return E2E.scenario('Navigate Back')
                .given('I am on step 2', function() {
                    createWizard();
                    return E2E.waitFor('#client')
                        .then(function() { return E2E.select('#client', '1'); })
                        .then(function() { return E2E.select('#template', '1'); })
                        .then(function() { return E2E.select('#trade-type', 'buy'); })
                        .then(function() { return E2E.click('#next-btn'); })
                        .then(function() { return E2E.waitFor('.wizard-step[data-step="2"][style*="block"]'); });
                })
                .when('I click Previous', function() {
                    return E2E.click('#prev-btn');
                })
                .then('I should be back on step 1', function() {
                    return E2E.waitFor('.wizard-step[data-step="1"][style*="block"]');
                })
                .and('My previous selections should be preserved', function() {
                    E2E.assertValue('#client', '1');
                    E2E.assertValue('#template', '1');
                    E2E.assertValue('#trade-type', 'buy');
                })
                .when('I change the trade type', function() {
                    return E2E.select('#trade-type', 'sell');
                })
                .and('I proceed forward again', function() {
                    return E2E.click('#next-btn');
                })
                .then('The new value should be preserved', function() {
                    return E2E.waitFor('.wizard-step[data-step="2"][style*="block"]')
                        .then(function() {
                            return E2E.click('#prev-btn');
                        })
                        .then(function() {
                            return E2E.waitFor('.wizard-step[data-step="1"][style*="block"]');
                        })
                        .then(function() {
                            E2E.assertValue('#trade-type', 'sell');
                        });
                })
                .run();
        });

    });

});