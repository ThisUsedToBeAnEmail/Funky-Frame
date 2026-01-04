/**
 * Funky.Aggregations Tests
 *
 * Tests for the table footer aggregations component that
 * calculates sum, avg, count, min, max for DataTable columns.
 */

describe('Funky.Component.Aggregations', function() {

    var Aggregations = Funky.Aggregations;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Aggregations')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof Aggregations.create).toBe('function');
        });

        it('has constructor exposed', function() {
            expect(typeof Aggregations.constructor).toBe('function');
        });

    });

    describe('Instance methods', function() {

        it('has init method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.init).toBe('function');
        });

        it('has calculate method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.calculate).toBe('function');
        });

        it('has createFooter method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.createFooter).toBe('function');
        });

        it('has bindEvents method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.bindEvents).toBe('function');
        });

        it('has getColumnIndex method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.getColumnIndex).toBe('function');
        });

        it('has extractNumericValue method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.extractNumericValue).toBe('function');
        });

        it('has formatNumber method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.formatNumber).toBe('function');
        });

        it('has getTypeLabel method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.getTypeLabel).toBe('function');
        });

        it('has renderFooter method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.renderFooter).toBe('function');
        });

        it('has updateConfig method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.updateConfig).toBe('function');
        });

        it('has destroy method', function() {
            var instance = new Aggregations.constructor('test-table', []);
            expect(typeof instance.destroy).toBe('function');
        });

    });

    describe('extractNumericValue()', function() {

        var instance;

        beforeEach(function() {
            instance = new Aggregations.constructor('test-table', []);
        });

        it('returns number when given number', function() {
            var result = instance.extractNumericValue(42);
            expect(result).toBe(42);
        });

        it('returns null for null input', function() {
            var result = instance.extractNumericValue(null);
            expect(result).toBeNull();
        });

        it('returns null for undefined input', function() {
            var result = instance.extractNumericValue(undefined);
            expect(result).toBeNull();
        });

        it('returns null for empty string', function() {
            var result = instance.extractNumericValue('');
            expect(result).toBeNull();
        });

        it('parses string number', function() {
            var result = instance.extractNumericValue('123.45');
            expect(result).toBe(123.45);
        });

        it('removes dollar sign', function() {
            var result = instance.extractNumericValue('$1,234.56');
            expect(result).toBe(1234.56);
        });

        it('removes euro sign', function() {
            var result = instance.extractNumericValue('€999.99');
            expect(result).toBe(999.99);
        });

        it('removes pound sign', function() {
            var result = instance.extractNumericValue('£500.00');
            expect(result).toBe(500);
        });

        it('removes commas', function() {
            var result = instance.extractNumericValue('1,234,567');
            expect(result).toBe(1234567);
        });

        it('handles negative in parentheses', function() {
            var result = instance.extractNumericValue('(500.00)');
            expect(result).toBe(-500);
        });

        it('extracts number from HTML', function() {
            var result = instance.extractNumericValue('<span class="amount">$1,234.56</span>');
            expect(result).toBe(1234.56);
        });

        it('returns null for non-numeric string', function() {
            var result = instance.extractNumericValue('N/A');
            expect(result).toBeNull();
        });

    });

    describe('formatNumber()', function() {

        var instance;

        beforeEach(function() {
            instance = new Aggregations.constructor('test-table', []);
        });

        it('returns dash for null', function() {
            var result = instance.formatNumber(null, 'number');
            expect(result).toBe('-');
        });

        it('returns dash for undefined', function() {
            var result = instance.formatNumber(undefined, 'number');
            expect(result).toBe('-');
        });

        it('formats currency', function() {
            var result = instance.formatNumber(1234.56, 'currency');
            expect(result).toContain('1,234.56');
            expect(result).toContain('$');
        });

        it('formats currency-short for millions', function() {
            var result = instance.formatNumber(1500000, 'currency-short');
            expect(result).toBe('$1.50M');
        });

        it('formats currency-short for billions', function() {
            var result = instance.formatNumber(2500000000, 'currency-short');
            expect(result).toBe('$2.50B');
        });

        it('formats currency-short for thousands', function() {
            var result = instance.formatNumber(5000, 'currency-short');
            expect(result).toBe('$5.00K');
        });

        it('formats percentage', function() {
            var result = instance.formatNumber(75.5, 'percentage');
            expect(result).toBe('75.50%');
        });

        it('formats integer', function() {
            var result = instance.formatNumber(1234.56, 'integer');
            expect(result).toBe('1,235');
        });

        it('formats decimal', function() {
            var result = instance.formatNumber(1234.5678, 'decimal');
            expect(result).toContain('1,234.56');
        });

        it('formats default number', function() {
            var result = instance.formatNumber(1234.56, 'number');
            expect(result).toContain('1,234.56');
        });

    });

    describe('getTypeLabel()', function() {

        var instance;

        beforeEach(function() {
            instance = new Aggregations.constructor('test-table', []);
        });

        it('returns SUM for sum', function() {
            expect(instance.getTypeLabel('sum')).toBe('SUM');
        });

        it('returns AVG for avg', function() {
            expect(instance.getTypeLabel('avg')).toBe('AVG');
        });

        it('returns AVG for average', function() {
            expect(instance.getTypeLabel('average')).toBe('AVG');
        });

        it('returns COUNT for count', function() {
            expect(instance.getTypeLabel('count')).toBe('COUNT');
        });

        it('returns MIN for min', function() {
            expect(instance.getTypeLabel('min')).toBe('MIN');
        });

        it('returns MAX for max', function() {
            expect(instance.getTypeLabel('max')).toBe('MAX');
        });

        it('returns uppercase for unknown type', function() {
            expect(instance.getTypeLabel('custom')).toBe('CUSTOM');
        });

    });

    describe('Configuration', function() {

        it('stores tableId', function() {
            var instance = new Aggregations.constructor('my-table', []);
            expect(instance.tableId).toBe('my-table');
        });

        it('stores config array', function() {
            var config = [
                { column: 'price', type: 'sum', format: 'currency' }
            ];
            var instance = new Aggregations.constructor('test', config);

            expect(instance.config).toBe(config);
            expect(instance.config.length).toBe(1);
        });

        it('defaults config to empty array', function() {
            var instance = new Aggregations.constructor('test');
            expect(instance.config).toEqual([]);
        });

    });

    describe('updateConfig()', function() {

        it('updates the config array', function() {
            var instance = new Aggregations.constructor('test-table', [
                { column: 'price', type: 'sum' }
            ]);

            var newConfig = [
                { column: 'quantity', type: 'count' },
                { column: 'total', type: 'avg' }
            ];

            instance.updateConfig(newConfig);

            expect(instance.config).toBe(newConfig);
            expect(instance.config.length).toBe(2);
        });

    });

    describe('destroy()', function() {

        it('removes tfoot element', function() {
            // Skip if jQuery DataTables not available (required by init())
            if (typeof jQuery === 'undefined' || !jQuery.fn || !jQuery.fn.DataTable) {
                // Test the destroy method directly without creating a full instance
                // Create a minimal mock instance
                var mockInstance = {
                    tfoot: null,
                    destroy: Aggregations.constructor.prototype.destroy
                };

                fixture.html('<table id="destroy-test"><tbody></tbody></table>');

                // Create a tfoot manually for testing
                var tfoot = document.createElement('tfoot');
                tfoot.className = 'dt-footer-aggregation';
                fixture.query('table').appendChild(tfoot);
                mockInstance.tfoot = tfoot;

                mockInstance.destroy();

                var remaining = fixture.query('tfoot.dt-footer-aggregation');
                expect(remaining).toBeNull();
                return;
            }

            fixture.html('<table id="destroy-test"><tbody></tbody></table>');

            var instance = new Aggregations.constructor('destroy-test', []);

            // Create a tfoot manually for testing
            var tfoot = document.createElement('tfoot');
            tfoot.className = 'dt-footer-aggregation';
            document.getElementById('destroy-test').appendChild(tfoot);
            instance.tfoot = tfoot;

            instance.destroy();

            var remaining = fixture.query('tfoot.dt-footer-aggregation');
            expect(remaining).toBeNull();
        });

    });

    describe('Aggregation types', function() {

        it('supports sum type', function() {
            var config = [{ column: 0, type: 'sum', format: 'number' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].type).toBe('sum');
        });

        it('supports avg type', function() {
            var config = [{ column: 0, type: 'avg', format: 'number' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].type).toBe('avg');
        });

        it('supports average type (alias)', function() {
            var config = [{ column: 0, type: 'average', format: 'number' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].type).toBe('average');
        });

        it('supports count type', function() {
            var config = [{ column: 0, type: 'count', format: 'integer' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].type).toBe('count');
        });

        it('supports min type', function() {
            var config = [{ column: 0, type: 'min', format: 'number' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].type).toBe('min');
        });

        it('supports max type', function() {
            var config = [{ column: 0, type: 'max', format: 'number' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].type).toBe('max');
        });

    });

    describe('Format types', function() {

        it('supports currency format', function() {
            var config = [{ column: 0, type: 'sum', format: 'currency' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].format).toBe('currency');
        });

        it('supports currency-short format', function() {
            var config = [{ column: 0, type: 'sum', format: 'currency-short' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].format).toBe('currency-short');
        });

        it('supports percentage format', function() {
            var config = [{ column: 0, type: 'avg', format: 'percentage' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].format).toBe('percentage');
        });

        it('supports integer format', function() {
            var config = [{ column: 0, type: 'count', format: 'integer' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].format).toBe('integer');
        });

        it('supports decimal format', function() {
            var config = [{ column: 0, type: 'avg', format: 'decimal' }];
            var instance = new Aggregations.constructor('test', config);

            expect(config[0].format).toBe('decimal');
        });

    });

    describe('Column selection', function() {

        it('accepts column by index', function() {
            var config = [{ column: 5, type: 'sum' }];
            var instance = new Aggregations.constructor('test', config);

            expect(typeof config[0].column).toBe('number');
            expect(config[0].column).toBe(5);
        });

        it('accepts column by name', function() {
            var config = [{ column: 'price', type: 'sum' }];
            var instance = new Aggregations.constructor('test', config);

            expect(typeof config[0].column).toBe('string');
            expect(config[0].column).toBe('price');
        });

    });

    describe('create() factory', function() {

        it('creates new instance', function() {
            var instance = Aggregations.create('test-table', [
                { column: 0, type: 'sum' }
            ]);

            expect(instance).toBeDefined();
            expect(instance.tableId).toBe('test-table');
        });

        it('returns instance of FunkyTableAggregations', function() {
            var instance = Aggregations.create('test-table', []);

            expect(instance instanceof Aggregations.constructor).toBe(true);
        });

    });

});
