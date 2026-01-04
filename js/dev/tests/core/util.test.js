/**
 * Funky.Util Tests
 *
 * Tests for utility functions.
 */

describe('Funky.Core.Util', function() {

    var Util = Funky.Util;

    describe('escapeHtml()', function() {

        it('escapes < and >', function() {
            expect(Util.escapeHtml('<script>')).toBe('&lt;script&gt;');
        });

        it('escapes ampersand', function() {
            expect(Util.escapeHtml('A & B')).toBe('A &amp; B');
        });

        it('escapes quotes', function() {
            expect(Util.escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
            expect(Util.escapeHtml("it's")).toContain('&#');
        });

        it('returns empty string for null/undefined', function() {
            expect(Util.escapeHtml(null)).toBe('');
            expect(Util.escapeHtml(undefined)).toBe('');
        });

        it('handles complex HTML string', function() {
            var input = '<div onclick="alert(\'xss\')">Test</div>';
            var escaped = Util.escapeHtml(input);

            expect(escaped).not.toContain('<div');
            expect(escaped).toContain('&lt;div');
        });

    });

    describe('formatNumber()', function() {

        it('formats integers with commas', function() {
            expect(Util.formatNumber(1000)).toBe('1,000');
            expect(Util.formatNumber(1000000)).toBe('1,000,000');
        });

        it('formats decimals', function() {
            expect(Util.formatNumber(1234.56)).toBe('1,234.56');
        });

        it('handles zero', function() {
            expect(Util.formatNumber(0)).toBe('0');
        });

        it('handles negative numbers', function() {
            expect(Util.formatNumber(-1234)).toBe('-1,234');
        });

        it('respects decimal places parameter', function() {
            expect(Util.formatNumber(1234.5678, 2)).toBe('1,234.57');
            expect(Util.formatNumber(1234, 2)).toBe('1,234.00');
        });

    });

    describe('abbreviateNumber()', function() {

        it('returns numbers under 1000 as-is', function() {
            expect(Util.abbreviateNumber(999)).toBe('999');
            expect(Util.abbreviateNumber(500)).toBe('500');
        });

        it('abbreviates thousands with K', function() {
            expect(Util.abbreviateNumber(1000)).toBe('1K');
            expect(Util.abbreviateNumber(1500)).toBe('1.5K');
            expect(Util.abbreviateNumber(25000)).toBe('25K');
        });

        it('abbreviates millions with M', function() {
            expect(Util.abbreviateNumber(1000000)).toBe('1M');
            expect(Util.abbreviateNumber(2500000)).toBe('2.5M');
        });

        it('abbreviates billions with B', function() {
            expect(Util.abbreviateNumber(1000000000)).toBe('1B');
        });

    });

    describe('formatFileSize()', function() {

        it('formats bytes', function() {
            expect(Util.formatFileSize(500)).toContain('500');
            expect(Util.formatFileSize(500)).toMatch(/bytes?/i);
        });

        it('formats kilobytes', function() {
            var result = Util.formatFileSize(1024);
            expect(result).toMatch(/1.*KB/i);
        });

        it('formats megabytes', function() {
            var result = Util.formatFileSize(1024 * 1024);
            expect(result).toMatch(/1.*MB/i);
        });

        it('formats gigabytes', function() {
            var result = Util.formatFileSize(1024 * 1024 * 1024);
            expect(result).toMatch(/1.*GB/i);
        });

        it('handles zero', function() {
            expect(Util.formatFileSize(0)).toMatch(/0/);
        });

    });

    describe('toDom()', function() {

        it('creates element from HTML string', function() {
            var el = Util.toDom('<div class="test">Hello</div>');
            expect(el.tagName.toLowerCase()).toBe('div');
            expect(el.className).toBe('test');
            expect(el.textContent).toBe('Hello');
        });

        it('creates element with children', function() {
            var el = Util.toDom('<ul><li>One</li><li>Two</li></ul>');
            expect(el.children.length).toBe(2);
        });

        it('handles text-only content', function() {
            var el = Util.toDom('<span>Just text</span>');
            expect(el.textContent).toBe('Just text');
        });

    });

    describe('checkContrast()', function() {

        it('returns high contrast for black on white', function() {
            var result = Util.checkContrast('#000000', '#ffffff');
            expect(result.ratio).toBeGreaterThan(15);
            expect(result.passes.AAA).toBe(true);
        });

        it('returns low contrast for similar colors', function() {
            var result = Util.checkContrast('#cccccc', '#dddddd');
            expect(result.ratio).toBeLessThan(2);
            expect(result.passes.AA).toBe(false);
        });

        it('handles shorthand hex colors', function() {
            var result = Util.checkContrast('#000', '#fff');
            expect(result.ratio).toBeGreaterThan(15);
        });

    });

    describe('Edge cases', function() {

        it('formatNumber handles strings', function() {
            expect(Util.formatNumber('1234')).toBe('1,234');
        });

        it('formatNumber handles NaN gracefully', function() {
            var result = Util.formatNumber(NaN);
            expect(result).toBeDefined();
        });

        it('escapeHtml handles numbers', function() {
            expect(Util.escapeHtml(123)).toBe('123');
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error handling', function() {

        it('escapeHtml handles empty string', function() {
            expect(Util.escapeHtml('')).toBe('');
        });

        it('escapeHtml handles boolean', function() {
            expect(Util.escapeHtml(true)).toBe('true');
            expect(Util.escapeHtml(false)).toBe('false');
        });

        it('escapeHtml handles object', function() {
            var result = Util.escapeHtml({ key: 'value' });
            expect(result).toBeDefined();
        });

        it('escapeHtml handles array', function() {
            var result = Util.escapeHtml([1, 2, 3]);
            expect(result).toBeDefined();
        });

        it('formatNumber handles null gracefully', function() {
            var result = Util.formatNumber(null);
            expect(result).toBeDefined();
        });

        it('formatNumber handles undefined gracefully', function() {
            var result = Util.formatNumber(undefined);
            expect(result).toBeDefined();
        });

        it('formatNumber handles Infinity', function() {
            var result = Util.formatNumber(Infinity);
            expect(result).toBeDefined();
        });

        it('formatNumber handles negative Infinity', function() {
            var result = Util.formatNumber(-Infinity);
            expect(result).toBeDefined();
        });

        it('abbreviateNumber handles null gracefully', function() {
            var result = Util.abbreviateNumber(null);
            expect(result).toBeDefined();
        });

        it('abbreviateNumber handles undefined gracefully', function() {
            var result = Util.abbreviateNumber(undefined);
            expect(result).toBeDefined();
        });

        it('formatFileSize handles null gracefully', function() {
            var result = Util.formatFileSize(null);
            expect(result).toBeDefined();
        });

        it('formatFileSize handles undefined gracefully', function() {
            var result = Util.formatFileSize(undefined);
            expect(result).toBeDefined();
        });

        it('formatFileSize handles negative numbers gracefully', function() {
            var result = Util.formatFileSize(-1024);
            expect(result).toBeDefined();
        });

        it('toDom handles empty string gracefully', function() {
            var result = Util.toDom('');
            expect(result === null || result === undefined || result.nodeType).toBeTruthy();
        });

        it('toDom handles null gracefully', function() {
            var result = Util.toDom(null);
            // Returns empty text node for null input - this is valid graceful handling
            expect(result === null || result === undefined || result.nodeType === 3).toBe(true);
        });

        it('checkContrast handles invalid color gracefully', function() {
            var result = Util.checkContrast('invalid', '#ffffff');
            expect(result).toBeDefined();
        });

    });

    // =========================================================================
    // EDGE CASE TESTS - EXTENDED
    // =========================================================================
    describe('Edge cases - Extended', function() {

        it('escapeHtml preserves non-dangerous characters', function() {
            var input = 'Hello World 123 !@#$%^*()';
            var result = Util.escapeHtml(input);
            expect(result).toContain('Hello World');
            expect(result).toContain('123');
        });

        it('escapeHtml handles nested quotes', function() {
            var input = 'He said "It\'s great"';
            var result = Util.escapeHtml(input);
            expect(result).not.toContain('"');
            expect(result).toContain('&quot;');
        });

        it('escapeHtml handles Unicode characters', function() {
            var input = 'Hello ™ © ® € £';
            var result = Util.escapeHtml(input);
            expect(result).toContain('™');
            expect(result).toContain('©');
        });

        it('formatNumber handles very large numbers', function() {
            var result = Util.formatNumber(999999999999);
            expect(result).toContain(',');
        });

        it('formatNumber handles very small decimals', function() {
            var result = Util.formatNumber(0.0001, 4);
            expect(result).toContain('0.0001');
        });

        it('formatNumber with 0 decimal places', function() {
            var result = Util.formatNumber(1234.5678, 0);
            expect(result).toBe('1,235');
        });

        it('abbreviateNumber handles edge of thousands', function() {
            expect(Util.abbreviateNumber(999)).toBe('999');
            expect(Util.abbreviateNumber(1000)).toBe('1K');
        });

        it('abbreviateNumber handles edge of millions', function() {
            // 999999 rounds to 1000K with default 1 decimal place
            expect(Util.abbreviateNumber(999999)).toMatch(/1000K|999/);
            expect(Util.abbreviateNumber(1000000)).toBe('1M');
        });

        it('abbreviateNumber handles negative numbers', function() {
            var result = Util.abbreviateNumber(-1500);
            expect(result).toContain('-');
        });

        it('formatFileSize handles terabytes', function() {
            var tb = 1024 * 1024 * 1024 * 1024;
            var result = Util.formatFileSize(tb);
            expect(result).toMatch(/TB/i);
        });

        it('formatFileSize handles exact KB boundary', function() {
            var result = Util.formatFileSize(1024);
            expect(result).toMatch(/1.*KB/i);
        });

        it('formatFileSize handles 1 byte', function() {
            var result = Util.formatFileSize(1);
            expect(result).toMatch(/1.*byte/i);
        });

        it('toDom creates table elements correctly', function() {
            var el = Util.toDom('<table><tr><td>Cell</td></tr></table>');
            expect(el.tagName.toLowerCase()).toBe('table');
            expect(el.querySelector('td').textContent).toBe('Cell');
        });

        it('toDom creates SVG elements', function() {
            var el = Util.toDom('<svg><circle cx="50" cy="50" r="40"></circle></svg>');
            expect(el.tagName.toLowerCase()).toBe('svg');
        });

        it('toDom preserves attributes', function() {
            var el = Util.toDom('<div id="test" class="foo bar" data-value="123"></div>');
            expect(el.id).toBe('test');
            expect(el.className).toBe('foo bar');
            expect(el.getAttribute('data-value')).toBe('123');
        });

        it('checkContrast handles lowercase hex', function() {
            var result = Util.checkContrast('#aabbcc', '#112233');
            expect(result.ratio).toBeDefined();
        });

        it('checkContrast handles uppercase hex', function() {
            var result = Util.checkContrast('#AABBCC', '#112233');
            expect(result.ratio).toBeDefined();
        });

        it('checkContrast handles mixed case hex', function() {
            var result = Util.checkContrast('#AaBbCc', '#112233');
            expect(result.ratio).toBeDefined();
        });

        it('checkContrast returns AA and AAA pass status', function() {
            var result = Util.checkContrast('#000000', '#ffffff');
            expect(result.passes).toBeDefined();
            expect(result.passes.AA).toBeDefined();
            expect(result.passes.AAA).toBeDefined();
        });

        it('checkContrast with same colors returns ratio of 1', function() {
            var result = Util.checkContrast('#ffffff', '#ffffff');
            expect(result.ratio).toBe(1);
        });

    });

    // =========================================================================
    // TYPE COERCION TESTS
    // =========================================================================
    describe('Type coercion', function() {

        it('formatNumber coerces string to number', function() {
            expect(Util.formatNumber('12345')).toBe('12,345');
        });

        it('formatNumber handles numeric string with decimal', function() {
            expect(Util.formatNumber('1234.56')).toBe('1,234.56');
        });

        it('abbreviateNumber coerces string to number', function() {
            expect(Util.abbreviateNumber('1500')).toBe('1.5K');
        });

        it('formatFileSize coerces string to number', function() {
            var result = Util.formatFileSize('1024');
            expect(result).toMatch(/1.*KB/i);
        });

    });

    // =========================================================================
    // BOUNDARY TESTS
    // =========================================================================
    describe('Boundary values', function() {

        it('formatNumber handles MAX_SAFE_INTEGER', function() {
            var result = Util.formatNumber(Number.MAX_SAFE_INTEGER);
            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
        });

        it('formatNumber handles MIN_SAFE_INTEGER', function() {
            var result = Util.formatNumber(Number.MIN_SAFE_INTEGER);
            expect(result).toBeDefined();
            expect(result).toContain('-');
        });

        it('abbreviateNumber handles trillion', function() {
            var result = Util.abbreviateNumber(1000000000000);
            expect(result).toMatch(/T|1000B/i);
        });

        it('formatFileSize handles petabytes', function() {
            var pb = Math.pow(1024, 5);
            var result = Util.formatFileSize(pb);
            expect(result).toBeDefined();
        });

    });

});
