/**
 * Tests for Funky.Renderers
 * DataTable Column Render Functions
 */
FunkyTests.describe('Funky.Component.Renderers', function() {
    var expect = FunkyTests.expect;
    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.Renderers).toBeDefined();
        });

        FunkyTests.it('has text method', function() {
            expect(typeof Funky.Renderers.text).toBe('function');
        });

        FunkyTests.it('has number method', function() {
            expect(typeof Funky.Renderers.number).toBe('function');
        });

        FunkyTests.it('has boolean method', function() {
            expect(typeof Funky.Renderers.boolean).toBe('function');
        });

        FunkyTests.it('has id method', function() {
            expect(typeof Funky.Renderers.id).toBe('function');
        });

        FunkyTests.it('has bold method', function() {
            expect(typeof Funky.Renderers.bold).toBe('function');
        });

        FunkyTests.it('has currency method', function() {
            expect(typeof Funky.Renderers.currency).toBe('function');
        });

        FunkyTests.it('has percent method', function() {
            expect(typeof Funky.Renderers.percent).toBe('function');
        });

        FunkyTests.it('has date method', function() {
            expect(typeof Funky.Renderers.date).toBe('function');
        });

        FunkyTests.it('has dateOnly method', function() {
            expect(typeof Funky.Renderers.dateOnly).toBe('function');
        });

        FunkyTests.it('has datetime method', function() {
            expect(typeof Funky.Renderers.datetime).toBe('function');
        });

        FunkyTests.it('has activeStatus method', function() {
            expect(typeof Funky.Renderers.activeStatus).toBe('function');
        });

        FunkyTests.it('has yesNo method', function() {
            expect(typeof Funky.Renderers.yesNo).toBe('function');
        });

        FunkyTests.it('has badgeMap method', function() {
            expect(typeof Funky.Renderers.badgeMap).toBe('function');
        });

        FunkyTests.it('has truncate method', function() {
            expect(typeof Funky.Renderers.truncate).toBe('function');
        });

        FunkyTests.it('has link method', function() {
            expect(typeof Funky.Renderers.link).toBe('function');
        });

        FunkyTests.it('has actions method', function() {
            expect(typeof Funky.Renderers.actions).toBe('function');
        });

        FunkyTests.it('has get method', function() {
            expect(typeof Funky.Renderers.get).toBe('function');
        });

        FunkyTests.it('has escapeHtml method', function() {
            expect(typeof Funky.Renderers.escapeHtml).toBe('function');
        });
    });

    FunkyTests.describe('escapeHtml()', function() {
        FunkyTests.it('escapes < and >', function() {
            var result = Funky.Renderers.escapeHtml('<script>');
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
        });

        FunkyTests.it('handles null', function() {
            var result = Funky.Renderers.escapeHtml(null);
            expect(result).toBe('');
        });

        FunkyTests.it('handles undefined', function() {
            var result = Funky.Renderers.escapeHtml(undefined);
            expect(result).toBe('');
        });

        FunkyTests.it('handles numbers', function() {
            var result = Funky.Renderers.escapeHtml(123);
            expect(result).toBe('123');
        });
    });

    FunkyTests.describe('text()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.text();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns dash for null on display', function() {
            var renderer = Funky.Renderers.text();
            var result = renderer(null, 'display');
            expect(result).toBe('-');
        });

        FunkyTests.it('returns data for sort/filter', function() {
            var renderer = Funky.Renderers.text();
            var result = renderer('test', 'sort');
            expect(result).toBe('test');
        });

        FunkyTests.it('applies bold option', function() {
            var renderer = Funky.Renderers.text({ bold: true });
            var result = renderer('test', 'display');
            expect(result).toContain('fw-bold');
        });

        FunkyTests.it('applies className option', function() {
            var renderer = Funky.Renderers.text({ className: 'custom' });
            var result = renderer('test', 'display');
            expect(result).toContain('custom');
        });

        FunkyTests.it('applies prefix option', function() {
            var renderer = Funky.Renderers.text({ prefix: '$' });
            var result = renderer('100', 'display');
            expect(result).toContain('$100');
        });

        FunkyTests.it('applies suffix option', function() {
            var renderer = Funky.Renderers.text({ suffix: '%' });
            var result = renderer('50', 'display');
            expect(result).toContain('50%');
        });

        FunkyTests.it('uses custom emptyValue', function() {
            var renderer = Funky.Renderers.text({ emptyValue: 'N/A' });
            var result = renderer(null, 'display');
            expect(result).toBe('N/A');
        });
    });

    FunkyTests.describe('number()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.number();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns dash for null', function() {
            var renderer = Funky.Renderers.number();
            var result = renderer(null, 'display');
            expect(result).toBe('-');
        });

        FunkyTests.it('formats number with locale', function() {
            var renderer = Funky.Renderers.number();
            var result = renderer(1000, 'display');
            expect(result).toContain('1');
        });

        FunkyTests.it('respects decimals option', function() {
            var renderer = Funky.Renderers.number({ decimals: 2 });
            var result = renderer(1000.5, 'display');
            expect(result).toContain('.50');
        });
    });

    FunkyTests.describe('boolean()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.boolean();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('renders Active for true', function() {
            var renderer = Funky.Renderers.boolean();
            var result = renderer(true, 'display');
            expect(result).toContain('Active');
            expect(result).toContain('badge-active');
        });

        FunkyTests.it('renders Inactive for false', function() {
            var renderer = Funky.Renderers.boolean();
            var result = renderer(false, 'display');
            expect(result).toContain('Inactive');
            expect(result).toContain('badge-inactive');
        });

        FunkyTests.it('uses custom labels', function() {
            var renderer = Funky.Renderers.boolean({ activeLabel: 'Yes', inactiveLabel: 'No' });
            expect(renderer(true, 'display')).toContain('Yes');
            expect(renderer(false, 'display')).toContain('No');
        });
    });

    FunkyTests.describe('id()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.id();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('prefixes with #', function() {
            var renderer = Funky.Renderers.id();
            var result = renderer(123, 'display');
            expect(result).toContain('#123');
        });

        FunkyTests.it('returns empty for null', function() {
            var renderer = Funky.Renderers.id();
            var result = renderer(null, 'display');
            expect(result).toBe('');
        });

        FunkyTests.it('adds text-muted class', function() {
            var renderer = Funky.Renderers.id();
            var result = renderer(1, 'display');
            expect(result).toContain('text-muted');
        });
    });

    FunkyTests.describe('bold()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.bold();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('wraps in fw-bold span', function() {
            var renderer = Funky.Renderers.bold();
            var result = renderer('Test', 'display');
            expect(result).toContain('fw-bold');
            expect(result).toContain('Test');
        });
    });

    FunkyTests.describe('currency()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.currency();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns dash for null', function() {
            var renderer = Funky.Renderers.currency();
            var result = renderer(null, 'display');
            expect(result).toBe('-');
        });

        FunkyTests.it('formats as currency', function() {
            var renderer = Funky.Renderers.currency('USD');
            var result = renderer(1000, 'display');
            expect(result).toContain('$');
        });

        FunkyTests.it('accepts options object', function() {
            var renderer = Funky.Renderers.currency({ currency: 'EUR', decimals: 0 });
            var result = renderer(1000, 'display');
            expect(typeof result).toBe('string');
        });

        FunkyTests.it('returns numeric value for sort', function() {
            var renderer = Funky.Renderers.currency();
            var result = renderer('1000.50', 'sort');
            expect(result).toBe(1000.50);
        });
    });

    FunkyTests.describe('percent()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.percent();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns dash for null', function() {
            var renderer = Funky.Renderers.percent();
            var result = renderer(null, 'display');
            expect(result).toBe('-');
        });

        FunkyTests.it('appends % suffix', function() {
            var renderer = Funky.Renderers.percent();
            var result = renderer(50, 'display');
            expect(result).toContain('%');
        });

        FunkyTests.it('respects decimals option', function() {
            var renderer = Funky.Renderers.percent(1);
            var result = renderer(50.55, 'display');
            // toFixed(1) truncates 50.55 to 50.5
            expect(result).toBe('50.5%');
        });

        FunkyTests.it('multiplies by 100 when specified', function() {
            var renderer = Funky.Renderers.percent(2, true);
            var result = renderer(0.5, 'display');
            expect(result).toBe('50.00%');
        });

        FunkyTests.it('accepts options object', function() {
            var renderer = Funky.Renderers.percent({ decimals: 1, multiply: true });
            var result = renderer(0.75, 'display');
            expect(result).toBe('75.0%');
        });
    });

    FunkyTests.describe('date()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.date();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns dash for null', function() {
            var renderer = Funky.Renderers.date();
            var result = renderer(null, 'display');
            expect(result).toBe('-');
        });

        FunkyTests.it('formats date string', function() {
            var renderer = Funky.Renderers.date();
            var result = renderer('2024-01-15', 'display');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    FunkyTests.describe('dateOnly()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.dateOnly();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns empty for null', function() {
            var renderer = Funky.Renderers.dateOnly();
            var result = renderer(null, 'display');
            expect(result).toBe('');
        });

        FunkyTests.it('formats date without time', function() {
            var renderer = Funky.Renderers.dateOnly();
            var result = renderer('2024-01-15T10:30:00Z', 'display');
            expect(typeof result).toBe('string');
        });
    });

    FunkyTests.describe('datetime()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.datetime();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns empty for null', function() {
            var renderer = Funky.Renderers.datetime();
            var result = renderer(null, 'display');
            expect(result).toBe('');
        });
    });

    FunkyTests.describe('activeStatus()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.activeStatus();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('renders Active for true', function() {
            var renderer = Funky.Renderers.activeStatus();
            var result = renderer(true, 'display');
            expect(result).toContain('Active');
        });

        FunkyTests.it('renders Active for 1', function() {
            var renderer = Funky.Renderers.activeStatus();
            var result = renderer(1, 'display');
            expect(result).toContain('Active');
        });

        FunkyTests.it('renders Active for "1"', function() {
            var renderer = Funky.Renderers.activeStatus();
            var result = renderer('1', 'display');
            expect(result).toContain('Active');
        });

        FunkyTests.it('renders Inactive for false', function() {
            var renderer = Funky.Renderers.activeStatus();
            var result = renderer(false, 'display');
            expect(result).toContain('Inactive');
        });

        FunkyTests.it('uses custom text', function() {
            var renderer = Funky.Renderers.activeStatus({ activeText: 'On', inactiveText: 'Off' });
            expect(renderer(true, 'display')).toContain('On');
            expect(renderer(false, 'display')).toContain('Off');
        });
    });

    FunkyTests.describe('yesNo()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.yesNo();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('renders Yes for true', function() {
            var renderer = Funky.Renderers.yesNo();
            var result = renderer(true, 'display');
            expect(result).toContain('Yes');
        });

        FunkyTests.it('renders No for false', function() {
            var renderer = Funky.Renderers.yesNo();
            var result = renderer(false, 'display');
            expect(result).toContain('No');
        });

        FunkyTests.it('uses custom text', function() {
            var renderer = Funky.Renderers.yesNo({ yesText: 'Enabled', noText: 'Disabled' });
            expect(renderer(true, 'display')).toContain('Enabled');
            expect(renderer(false, 'display')).toContain('Disabled');
        });
    });

    FunkyTests.describe('badgeMap()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.badgeMap({});
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('maps value to class (simple)', function() {
            var renderer = Funky.Renderers.badgeMap({
                pending: 'badge-warning'
            });
            var result = renderer('pending', 'display');
            expect(result).toContain('badge-warning');
            expect(result).toContain('Pending');
        });

        FunkyTests.it('maps value to text and class (full)', function() {
            var renderer = Funky.Renderers.badgeMap({
                sent: { text: 'Sent!', class: 'badge-active' }
            });
            var result = renderer('sent', 'display');
            expect(result).toContain('badge-active');
            expect(result).toContain('Sent!');
        });

        FunkyTests.it('uses default class for unknown values', function() {
            var renderer = Funky.Renderers.badgeMap({});
            var result = renderer('unknown', 'display');
            expect(result).toContain('badge-inactive');
        });

        FunkyTests.it('uses custom default class', function() {
            var renderer = Funky.Renderers.badgeMap({}, { defaultClass: 'badge-warning' });
            var result = renderer('unknown', 'display');
            expect(result).toContain('badge-warning');
        });
    });

    FunkyTests.describe('truncate()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.truncate();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns empty for null', function() {
            var renderer = Funky.Renderers.truncate();
            var result = renderer(null, 'display');
            expect(result).toBe('');
        });

        FunkyTests.it('truncates long text', function() {
            var longText = 'a'.repeat(100);
            var renderer = Funky.Renderers.truncate(50);
            var result = renderer(longText, 'display');
            expect(result).toContain('...');
        });

        FunkyTests.it('preserves short text', function() {
            var renderer = Funky.Renderers.truncate(50);
            var result = renderer('short', 'display');
            expect(result).toBe('short');
        });

        FunkyTests.it('adds title with full text', function() {
            var longText = 'a'.repeat(100);
            var renderer = Funky.Renderers.truncate(10);
            var result = renderer(longText, 'display');
            expect(result).toContain('title=');
        });
    });

    FunkyTests.describe('link()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.link('/path/{id}');
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns empty for null', function() {
            var renderer = Funky.Renderers.link('/path/{id}');
            var result = renderer(null, 'display', {});
            expect(result).toBe('');
        });

        FunkyTests.it('creates link element', function() {
            var renderer = Funky.Renderers.link('/users/{id}');
            var result = renderer('John', 'display', { id: 123 });
            expect(result).toContain('<a');
            expect(result).toContain('/users/123');
            expect(result).toContain('John');
        });

        FunkyTests.it('supports newTab option', function() {
            var renderer = Funky.Renderers.link('/path', { newTab: true });
            var result = renderer('Link', 'display', {});
            expect(result).toContain('target="_blank"');
        });

        FunkyTests.it('supports function URL template', function() {
            var renderer = Funky.Renderers.link(function(row) {
                return '/custom/' + row.id;
            });
            var result = renderer('Link', 'display', { id: 456 });
            expect(result).toContain('/custom/456');
        });
    });

    FunkyTests.describe('actions()', function() {
        FunkyTests.it('returns render function', function() {
            var renderer = Funky.Renderers.actions({});
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returns empty for non-display type', function() {
            var renderer = Funky.Renderers.actions({ view: true });
            var result = renderer(null, 'sort', { id: 1 });
            expect(result).toBe('');
        });

        FunkyTests.it('renders view button', function() {
            var renderer = Funky.Renderers.actions({ view: true });
            var result = renderer(null, 'display', { id: 1 });
            expect(result).toContain('btn-view');
            expect(result).toContain('fa-eye');
        });

        FunkyTests.it('renders edit button', function() {
            var renderer = Funky.Renderers.actions({ edit: true });
            var result = renderer(null, 'display', { id: 1 });
            expect(result).toContain('btn-edit');
            expect(result).toContain('fa-edit');
        });

        FunkyTests.it('renders delete button', function() {
            var renderer = Funky.Renderers.actions({ delete: true });
            var result = renderer(null, 'display', { id: 1 });
            expect(result).toContain('btn-delete');
            expect(result).toContain('fa-trash');
        });

        FunkyTests.it('renders audit button', function() {
            var renderer = Funky.Renderers.actions({ audit: true });
            var result = renderer(null, 'display', { id: 1 });
            expect(result).toContain('btn-history');
            expect(result).toContain('fa-history');
        });

        FunkyTests.it('wraps in action-buttons div', function() {
            var renderer = Funky.Renderers.actions({ view: true });
            var result = renderer(null, 'display', { id: 1 });
            expect(result).toContain('action-buttons');
            expect(result).toContain('role="group"');
        });

        FunkyTests.it('includes aria-labels', function() {
            var renderer = Funky.Renderers.actions({ view: true });
            var result = renderer(null, 'display', { id: 123 });
            expect(result).toContain('aria-label');
            expect(result).toContain('123');
        });

        FunkyTests.it('supports custom icon for view', function() {
            var renderer = Funky.Renderers.actions({ view: { icon: 'fa-search' } });
            var result = renderer(null, 'display', { id: 1 });
            expect(result).toContain('fa-search');
        });

        FunkyTests.it('supports custom title for edit', function() {
            var renderer = Funky.Renderers.actions({ edit: { title: 'Modify' } });
            var result = renderer(null, 'display', { id: 1 });
            expect(result).toContain('Modify');
        });

        FunkyTests.it('renders custom actions', function() {
            var renderer = Funky.Renderers.actions({
                custom: [{ icon: 'fa-star', title: 'Star', handler: 'starRow' }]
            });
            var result = renderer(null, 'display', { id: 1 });
            expect(result).toContain('fa-star');
            expect(result).toContain('Star');
        });
    });

    FunkyTests.describe('get()', function() {
        FunkyTests.it('returns null for non-string', function() {
            var result = Funky.Renderers.get(123);
            expect(result).toBe(null);
        });

        FunkyTests.it('returns null for unknown renderer', function() {
            var result = Funky.Renderers.get('unknown');
            expect(result).toBe(null);
        });

        FunkyTests.it('returns renderer by name', function() {
            var result = Funky.Renderers.get('id');
            expect(typeof result).toBe('function');
        });

        FunkyTests.it('parses name:arg format', function() {
            var result = Funky.Renderers.get('currency:EUR');
            expect(typeof result).toBe('function');
        });

        FunkyTests.it('parses name:arg1:arg2 format', function() {
            var result = Funky.Renderers.get('percent:2');
            expect(typeof result).toBe('function');
        });
    });
});
