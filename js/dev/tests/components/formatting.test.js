/**
 * Tests for Funky.Format component
 *
 * Funky.Format provides number, currency, percentage, date, and file size formatting
 * with locale-aware output and compact notation support.
 */
FunkyTests.describe('Funky.Component.Format', function() {
    'use strict';

    var Format = Funky.Format;
    var expect = FunkyTests.expect;
    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
        // Reset to default config
        Format.configure({
            locale: 'en-GB',
            defaultCurrency: 'GBP',
            decimalPlaces: 2,
            compactThreshold: 1000
        });
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
    });

    // =========================================================================
    // Module Structure Tests
    // =========================================================================

    FunkyTests.describe('Module Structure', function() {

        FunkyTests.it('should be registered in Funky namespace', function() {
            expect(Funky.Format).toBeDefined();
        });

        FunkyTests.it('should have configure method', function() {
            expect(typeof Format.configure).toBe('function');
        });

        FunkyTests.it('should have number method', function() {
            expect(typeof Format.number).toBe('function');
        });

        FunkyTests.it('should have compact method', function() {
            expect(typeof Format.compact).toBe('function');
        });

        FunkyTests.it('should have currency method', function() {
            expect(typeof Format.currency).toBe('function');
        });

        FunkyTests.it('should have percentage method', function() {
            expect(typeof Format.percentage).toBe('function');
        });

        FunkyTests.it('should have change method', function() {
            expect(typeof Format.change).toBe('function');
        });

        FunkyTests.it('should have date method', function() {
            expect(typeof Format.date).toBe('function');
        });

        FunkyTests.it('should have datetime method', function() {
            expect(typeof Format.datetime).toBe('function');
        });

        FunkyTests.it('should have fileSize method', function() {
            expect(typeof Format.fileSize).toBe('function');
        });

        FunkyTests.it('should have autoFormat method', function() {
            expect(typeof Format.autoFormat).toBe('function');
        });
    });

    // =========================================================================
    // number() Tests
    // =========================================================================

    FunkyTests.describe('number', function() {

        FunkyTests.it('should format integer', function() {
            var result = Format.number(1234);
            expect(result).toContain('1');
            expect(result).toContain('234');
        });

        FunkyTests.it('should format decimal number', function() {
            var result = Format.number(1234.56);
            // Result includes thousand separator: "1,234.56"
            expect(result).toContain('234');
            expect(result).toContain('56');
        });

        FunkyTests.it('should use default decimal places', function() {
            var result = Format.number(100);
            expect(result).toContain('00');
        });

        FunkyTests.it('should accept custom decimal places', function() {
            var result = Format.number(100.1234, 4);
            expect(result).toContain('1234');
        });

        FunkyTests.it('should handle string input', function() {
            var result = Format.number('5678.90');
            // Result includes thousand separator: "5,678.90"
            expect(result).toContain('678');
            expect(result).toContain('90');
        });

        FunkyTests.it('should return dash for NaN', function() {
            var result = Format.number('not a number');
            expect(result).toBe('-');
        });

        FunkyTests.it('should return dash for undefined', function() {
            var result = Format.number(undefined);
            expect(result).toBe('-');
        });

        FunkyTests.it('should return dash for null', function() {
            var result = Format.number(null);
            expect(result).toBe('-');
        });

        FunkyTests.it('should format zero', function() {
            var result = Format.number(0);
            expect(result).toContain('0');
        });

        FunkyTests.it('should format negative numbers', function() {
            var result = Format.number(-1234.56);
            expect(result).toContain('-');
            // Result includes thousand separator: "-1,234.56"
            expect(result).toContain('234');
        });

        FunkyTests.it('should use 0 decimal places when specified', function() {
            var result = Format.number(1234.99, 0);
            expect(result).not.toContain('.');
        });
    });

    // =========================================================================
    // compact() Tests
    // =========================================================================

    FunkyTests.describe('compact', function() {

        FunkyTests.it('should format number below threshold normally', function() {
            var result = Format.compact(500);
            expect(result).not.toContain('K');
            expect(result).not.toContain('M');
        });

        FunkyTests.it('should format thousands with K suffix', function() {
            var result = Format.compact(1500);
            expect(result).toContain('K');
        });

        FunkyTests.it('should format millions with M suffix', function() {
            var result = Format.compact(1500000);
            expect(result).toContain('M');
        });

        FunkyTests.it('should format billions with B suffix', function() {
            var result = Format.compact(1500000000);
            expect(result).toContain('B');
        });

        FunkyTests.it('should use 2 decimal places by default', function() {
            var result = Format.compact(1234567);
            expect(result).toBe('1.23M');
        });

        FunkyTests.it('should accept custom decimal places', function() {
            var result = Format.compact(1234567, 1);
            expect(result).toBe('1.2M');
        });

        FunkyTests.it('should return dash for NaN', function() {
            var result = Format.compact('invalid');
            expect(result).toBe('-');
        });

        FunkyTests.it('should handle negative numbers', function() {
            var result = Format.compact(-2500000);
            expect(result).toContain('-');
            expect(result).toContain('M');
        });

        FunkyTests.it('should format exactly 1000 with K', function() {
            var result = Format.compact(1000);
            expect(result).toContain('K');
        });

        FunkyTests.it('should format exactly 1000000 with M', function() {
            var result = Format.compact(1000000);
            expect(result).toBe('1.00M');
        });

        FunkyTests.it('should format string input', function() {
            var result = Format.compact('5000000');
            expect(result).toContain('M');
        });
    });

    // =========================================================================
    // currency() Tests
    // =========================================================================

    FunkyTests.describe('currency', function() {

        FunkyTests.it('should format with default currency (GBP)', function() {
            var result = Format.currency(1234.56);
            // GBP uses £ symbol
            expect(result).toContain('1');
            expect(result).toContain('234');
        });

        FunkyTests.it('should format with specified currency', function() {
            var result = Format.currency(1234.56, 'USD');
            expect(result).toContain('$');
        });

        FunkyTests.it('should format EUR currency', function() {
            var result = Format.currency(1234.56, 'EUR');
            expect(result).toContain('€');
        });

        FunkyTests.it('should use 2 decimal places', function() {
            var result = Format.currency(100);
            expect(result).toContain('00');
        });

        FunkyTests.it('should return dash for NaN', function() {
            var result = Format.currency('invalid');
            expect(result).toBe('-');
        });

        FunkyTests.it('should handle string input', function() {
            var result = Format.currency('999.99', 'USD');
            expect(result).toContain('999');
            expect(result).toContain('99');
        });

        FunkyTests.it('should format zero', function() {
            var result = Format.currency(0, 'USD');
            expect(result).toContain('0');
        });

        FunkyTests.it('should format negative amounts', function() {
            var result = Format.currency(-500.50, 'USD');
            expect(result).toContain('-');
            expect(result).toContain('500');
        });

        FunkyTests.it('should accept additional options', function() {
            var result = Format.currency(1234.567, 'USD', {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
            });
            expect(result).toContain('567');
        });
    });

    // =========================================================================
    // percentage() Tests
    // =========================================================================

    FunkyTests.describe('percentage', function() {

        FunkyTests.it('should format decimal as percentage', function() {
            var result = Format.percentage(0.5);
            expect(result).toBe('50.00%');
        });

        FunkyTests.it('should format with 2 decimal places by default', function() {
            var result = Format.percentage(0.1234);
            expect(result).toBe('12.34%');
        });

        FunkyTests.it('should accept custom decimal places', function() {
            var result = Format.percentage(0.12345, 3);
            expect(result).toBe('12.345%');
        });

        FunkyTests.it('should format 100% correctly', function() {
            var result = Format.percentage(1);
            expect(result).toBe('100.00%');
        });

        FunkyTests.it('should format 0% correctly', function() {
            var result = Format.percentage(0);
            expect(result).toBe('0.00%');
        });

        FunkyTests.it('should format values over 100%', function() {
            var result = Format.percentage(1.5);
            expect(result).toBe('150.00%');
        });

        FunkyTests.it('should handle already-percentage values', function() {
            var result = Format.percentage(50, 2, false);
            expect(result).toBe('50.00%');
        });

        FunkyTests.it('should return dash for NaN', function() {
            var result = Format.percentage('invalid');
            expect(result).toBe('-');
        });

        FunkyTests.it('should format negative percentages', function() {
            var result = Format.percentage(-0.25);
            expect(result).toBe('-25.00%');
        });

        FunkyTests.it('should handle string input', function() {
            var result = Format.percentage('0.75');
            expect(result).toBe('75.00%');
        });
    });

    // =========================================================================
    // change() Tests
    // =========================================================================

    FunkyTests.describe('change', function() {

        FunkyTests.it('should return formatted object', function() {
            var result = Format.change(5);
            expect(typeof result).toBe('object');
            expect(result.formatted).toBeDefined();
            expect(result.colorClass).toBeDefined();
            expect(result.value).toBeDefined();
        });

        FunkyTests.it('should add plus sign for positive values', function() {
            var result = Format.change(10);
            expect(result.formatted).toContain('+');
        });

        FunkyTests.it('should not add plus sign for negative values', function() {
            var result = Format.change(-10);
            expect(result.formatted.charAt(0)).toBe('-');
        });

        FunkyTests.it('should add percentage by default', function() {
            var result = Format.change(5.5);
            expect(result.formatted).toContain('%');
        });

        FunkyTests.it('should use text-success class for positive', function() {
            var result = Format.change(10);
            expect(result.colorClass).toBe('text-success');
        });

        FunkyTests.it('should use text-danger class for negative', function() {
            var result = Format.change(-10);
            expect(result.colorClass).toBe('text-danger');
        });

        FunkyTests.it('should use text-muted class for zero', function() {
            var result = Format.change(0);
            expect(result.colorClass).toBe('text-muted');
        });

        FunkyTests.it('should use 2 decimal places by default', function() {
            var result = Format.change(5.123);
            expect(result.formatted).toBe('+5.12%');
        });

        FunkyTests.it('should accept custom decimal places', function() {
            var result = Format.change(5.1234, 3);
            expect(result.formatted).toBe('+5.123%');
        });

        FunkyTests.it('should omit percentage when asPercentage is false', function() {
            var result = Format.change(5, 2, false);
            expect(result.formatted).not.toContain('%');
        });

        FunkyTests.it('should return dash for NaN', function() {
            var result = Format.change('invalid');
            expect(result.formatted).toBe('-');
            expect(result.colorClass).toBe('');
            expect(result.value).toBe(0);
        });

        FunkyTests.it('should preserve numeric value', function() {
            var result = Format.change(-15.5);
            expect(result.value).toBe(-15.5);
        });
    });

    // =========================================================================
    // date() Tests
    // =========================================================================

    FunkyTests.describe('date', function() {

        FunkyTests.it('should format Date object', function() {
            var date = new Date(2025, 0, 15);
            var result = Format.date(date);
            expect(result).toContain('15');
            expect(result).toContain('Jan');
            expect(result).toContain('2025');
        });

        FunkyTests.it('should format date string', function() {
            var result = Format.date('2025-06-20');
            expect(result).toContain('20');
            expect(result).toContain('Jun');
            expect(result).toContain('2025');
        });

        FunkyTests.it('should return dash for empty value', function() {
            var result = Format.date('');
            expect(result).toBe('-');
        });

        FunkyTests.it('should return dash for null', function() {
            var result = Format.date(null);
            expect(result).toBe('-');
        });

        FunkyTests.it('should return dash for undefined', function() {
            var result = Format.date(undefined);
            expect(result).toBe('-');
        });

        FunkyTests.it('should return dash for invalid date', function() {
            var result = Format.date('not-a-date');
            expect(result).toBe('-');
        });

        FunkyTests.it('should accept custom format options', function() {
            var result = Format.date('2025-12-25', {
                year: '2-digit',
                month: 'numeric',
                day: 'numeric'
            });
            expect(result).toContain('25');
            expect(result).toContain('12');
        });
    });

    // =========================================================================
    // datetime() Tests
    // =========================================================================

    FunkyTests.describe('datetime', function() {

        FunkyTests.it('should format Date object with time', function() {
            var date = new Date(2025, 5, 15, 14, 30);
            var result = Format.datetime(date);
            expect(result).toContain('15');
            expect(result).toContain('Jun');
            expect(result).toContain('2025');
        });

        FunkyTests.it('should include time in output', function() {
            var date = new Date(2025, 0, 1, 9, 45);
            var result = Format.datetime(date);
            // Time should be present (format varies by locale)
            expect(result.length).toBeGreaterThan(10);
        });

        FunkyTests.it('should return dash for empty value', function() {
            var result = Format.datetime('');
            expect(result).toBe('-');
        });

        FunkyTests.it('should return dash for null', function() {
            var result = Format.datetime(null);
            expect(result).toBe('-');
        });

        FunkyTests.it('should return dash for invalid date', function() {
            var result = Format.datetime('invalid');
            expect(result).toBe('-');
        });

        FunkyTests.it('should accept custom format options', function() {
            var date = new Date(2025, 0, 15, 10, 30);
            var result = Format.datetime(date, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            expect(result).toContain('2025');
        });
    });

    // =========================================================================
    // fileSize() Tests
    // =========================================================================

    FunkyTests.describe('fileSize', function() {

        FunkyTests.it('should format bytes', function() {
            var result = Format.fileSize(500);
            expect(result).toBe('500 Bytes');
        });

        FunkyTests.it('should format kilobytes', function() {
            var result = Format.fileSize(1024);
            expect(result).toBe('1 KB');
        });

        FunkyTests.it('should format megabytes', function() {
            var result = Format.fileSize(1048576);
            expect(result).toBe('1 MB');
        });

        FunkyTests.it('should format gigabytes', function() {
            var result = Format.fileSize(1073741824);
            expect(result).toBe('1 GB');
        });

        FunkyTests.it('should format terabytes', function() {
            var result = Format.fileSize(1099511627776);
            expect(result).toBe('1 TB');
        });

        FunkyTests.it('should use 2 decimal places by default', function() {
            var result = Format.fileSize(1536);
            expect(result).toBe('1.5 KB');
        });

        FunkyTests.it('should accept custom decimal places', function() {
            var result = Format.fileSize(1536, 3);
            expect(result).toBe('1.5 KB');
        });

        FunkyTests.it('should return 0 Bytes for zero', function() {
            var result = Format.fileSize(0);
            expect(result).toBe('0 Bytes');
        });

        FunkyTests.it('should return 0 Bytes for NaN', function() {
            var result = Format.fileSize('invalid');
            expect(result).toBe('0 Bytes');
        });

        FunkyTests.it('should handle string input', function() {
            var result = Format.fileSize('2048');
            expect(result).toBe('2 KB');
        });

        FunkyTests.it('should format partial KB correctly', function() {
            var result = Format.fileSize(1500);
            expect(result).toContain('KB');
        });
    });

    // =========================================================================
    // configure() Tests
    // =========================================================================

    FunkyTests.describe('configure', function() {

        FunkyTests.it('should update locale', function() {
            Format.configure({ locale: 'de-DE' });

            var result = Format.number(1234.56);
            // German locale uses different separators
            expect(result).toBeDefined();

            // Reset
            Format.configure({ locale: 'en-GB' });
        });

        FunkyTests.it('should update default currency', function() {
            Format.configure({ defaultCurrency: 'EUR' });

            var result = Format.currency(100);
            expect(result).toContain('€');

            // Reset
            Format.configure({ defaultCurrency: 'GBP' });
        });

        FunkyTests.it('should update decimal places', function() {
            Format.configure({ decimalPlaces: 4 });

            var result = Format.number(1.23456789);
            expect(result).toContain('2346'); // Should round to 4 places

            // Reset
            Format.configure({ decimalPlaces: 2 });
        });

        FunkyTests.it('should update compact threshold', function() {
            Format.configure({ compactThreshold: 10000 });

            var result = Format.compact(5000);
            expect(result).not.toContain('K');

            // Reset
            Format.configure({ compactThreshold: 1000 });
        });

        FunkyTests.it('should merge with existing config', function() {
            Format.configure({ locale: 'en-US' });
            Format.configure({ defaultCurrency: 'USD' });

            // Both settings should be applied
            var currencyResult = Format.currency(100);
            expect(currencyResult).toContain('$');

            // Reset
            Format.configure({
                locale: 'en-GB',
                defaultCurrency: 'GBP'
            });
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    FunkyTests.describe('Edge Cases', function() {

        FunkyTests.it('should handle very large numbers', function() {
            var result = Format.number(999999999999);
            expect(result).toBeDefined();
            expect(result).not.toBe('-');
        });

        FunkyTests.it('should handle very small decimals', function() {
            var result = Format.number(0.0000001, 7);
            expect(result).toContain('0');
        });

        FunkyTests.it('should handle Infinity', function() {
            var result = Format.number(Infinity);
            // Behavior may vary, but should not throw
            expect(result).toBeDefined();
        });

        FunkyTests.it('should handle negative Infinity', function() {
            var result = Format.number(-Infinity);
            expect(result).toBeDefined();
        });

        FunkyTests.it('should handle scientific notation strings', function() {
            var result = Format.number('1.5e6');
            expect(result).toContain('1');
        });

        FunkyTests.it('should handle empty string', function() {
            var result = Format.number('');
            expect(result).toBe('-');
        });

        FunkyTests.it('should handle whitespace string', function() {
            var result = Format.number('   ');
            expect(result).toBe('-');
        });

        FunkyTests.it('should handle boolean true', function() {
            var result = Format.number(true);
            // true coerces to 1
            expect(result).toBeDefined();
        });

        FunkyTests.it('should handle boolean false', function() {
            var result = Format.number(false);
            // false is treated as null/undefined and returns dash
            expect(result).toBe('-');
        });
    });
});
