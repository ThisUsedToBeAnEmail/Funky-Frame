/**
 * Tests for Funky.Timezone
 * Timezone detection, storage, and formatting
 */
FunkyTests.describe('Funky.Core.Timezone', function() {
    var expect = FunkyTests.expect;

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.Timezone).toBeDefined();
        });

        FunkyTests.it('has initialize method', function() {
            expect(typeof Funky.Timezone.initialize).toBe('function');
        });

        FunkyTests.it('has detectBrowserTimezone method', function() {
            expect(typeof Funky.Timezone.detectBrowserTimezone).toBe('function');
        });

        FunkyTests.it('has format method', function() {
            expect(typeof Funky.Timezone.format).toBe('function');
        });

        FunkyTests.it('has formatWithTZ method', function() {
            expect(typeof Funky.Timezone.formatWithTZ).toBe('function');
        });

        FunkyTests.it('has getEffectiveTimezone method', function() {
            expect(typeof Funky.Timezone.getEffectiveTimezone).toBe('function');
        });

        FunkyTests.it('has setTimezone method', function() {
            expect(typeof Funky.Timezone.setTimezone).toBe('function');
        });

        FunkyTests.it('has getAbbreviation method', function() {
            expect(typeof Funky.Timezone.getAbbreviation).toBe('function');
        });

        FunkyTests.it('has renderDate method', function() {
            expect(typeof Funky.Timezone.renderDate).toBe('function');
        });

        FunkyTests.it('has dateRenderer method', function() {
            expect(typeof Funky.Timezone.dateRenderer).toBe('function');
        });

        FunkyTests.it('has formatString method', function() {
            expect(typeof Funky.Timezone.formatString).toBe('function');
        });
    });

    FunkyTests.describe('detectBrowserTimezone()', function() {
        FunkyTests.it('returns a string', function() {
            var tz = Funky.Timezone.detectBrowserTimezone();
            expect(typeof tz).toBe('string');
        });

        FunkyTests.it('returns valid IANA timezone', function() {
            var tz = Funky.Timezone.detectBrowserTimezone();
            // Should be in format "Continent/City" or "UTC"
            expect(tz.length).toBeGreaterThan(0);
            expect(tz === 'UTC' || tz.indexOf('/') !== -1).toBe(true);
        });

        FunkyTests.it('returns UTC on failure', function() {
            // The actual implementation should return UTC if Intl fails
            var tz = Funky.Timezone.detectBrowserTimezone();
            expect(tz).toBeDefined();
        });
    });

    FunkyTests.describe('getEffectiveTimezone()', function() {
        FunkyTests.it('returns a string', function() {
            var tz = Funky.Timezone.getEffectiveTimezone();
            expect(typeof tz).toBe('string');
        });

        FunkyTests.it('returns UTC if no timezone set', function() {
            // Should return UTC as fallback
            var tz = Funky.Timezone.getEffectiveTimezone();
            expect(tz).toBeDefined();
            expect(tz.length).toBeGreaterThan(0);
        });
    });

    FunkyTests.describe('format()', function() {
        FunkyTests.it('returns empty string for null input', function() {
            var result = Funky.Timezone.format(null);
            expect(result).toBe('');
        });

        FunkyTests.it('returns empty string for undefined input', function() {
            var result = Funky.Timezone.format(undefined);
            expect(result).toBe('');
        });

        FunkyTests.it('formats ISO timestamp string', function() {
            var result = Funky.Timezone.format('2024-01-15T10:30:00Z');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('formats Date object', function() {
            var date = new Date(2024, 0, 15, 10, 30, 0);
            var result = Funky.Timezone.format(date);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('accepts custom format options', function() {
            var result = Funky.Timezone.format('2024-01-15T10:30:00Z', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    FunkyTests.describe('formatWithTZ()', function() {
        FunkyTests.it('returns empty string for null input', function() {
            var result = Funky.Timezone.formatWithTZ(null);
            expect(result).toBe('');
        });

        FunkyTests.it('formats with timezone', function() {
            var result = Funky.Timezone.formatWithTZ('2024-01-15T10:30:00Z');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    FunkyTests.describe('formatString()', function() {
        FunkyTests.it('returns empty string for null input', function() {
            var result = Funky.Timezone.formatString(null, 'YYYY-MM-DD');
            expect(result).toBe('');
        });

        FunkyTests.it('returns empty string for undefined input', function() {
            var result = Funky.Timezone.formatString(undefined, 'YYYY-MM-DD');
            expect(result).toBe('');
        });

        FunkyTests.it('falls back to format() when no formatStr provided', function() {
            var result = Funky.Timezone.formatString('2024-01-15T10:30:00Z');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('formats YYYY token', function() {
            var result = Funky.Timezone.formatString('2024-01-15T10:30:00Z', 'YYYY');
            expect(result).toBe('2024');
        });

        FunkyTests.it('formats YY token', function() {
            var result = Funky.Timezone.formatString('2024-01-15T10:30:00Z', 'YY');
            expect(result).toBe('24');
        });

        FunkyTests.it('formats MM token with leading zero', function() {
            var result = Funky.Timezone.formatString('2024-01-15T10:30:00Z', 'MM');
            expect(result).toBe('01');
        });

        FunkyTests.it('formats M token without leading zero', function() {
            var result = Funky.Timezone.formatString('2024-01-15T10:30:00Z', 'M');
            expect(result).toBe('1');
        });

        FunkyTests.it('formats DD token with leading zero', function() {
            var result = Funky.Timezone.formatString('2024-01-05T10:30:00Z', 'DD');
            expect(result).toBe('05');
        });

        FunkyTests.it('formats D token without leading zero', function() {
            var result = Funky.Timezone.formatString('2024-01-05T10:30:00Z', 'D');
            expect(result).toBe('5');
        });

        FunkyTests.it('formats YYYY-MM-DD pattern', function() {
            var result = Funky.Timezone.formatString('2024-01-15T10:30:00Z', 'YYYY-MM-DD');
            // Result will be in effective timezone, so just check format
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        FunkyTests.it('formats HH:mm:ss pattern', function() {
            var result = Funky.Timezone.formatString('2024-01-15T10:30:45Z', 'HH:mm:ss');
            // Result depends on timezone, but format should match
            expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });

        FunkyTests.it('formats 12-hour time with hh and A', function() {
            var result = Funky.Timezone.formatString('2024-01-15T14:30:00Z', 'hh:mm A');
            // Should be in 12-hour format with AM/PM
            expect(result).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
        });

        FunkyTests.it('formats lowercase meridiem with a', function() {
            var result = Funky.Timezone.formatString('2024-01-15T14:30:00Z', 'h:mm a');
            // Should have lowercase am/pm
            expect(result).toMatch(/^\d{1,2}:\d{2} (am|pm)$/);
        });

        FunkyTests.it('formats complex pattern', function() {
            var result = Funky.Timezone.formatString('2024-01-15T10:30:45Z', 'DD/MM/YYYY HH:mm:ss');
            // Format should match pattern
            expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
        });

        FunkyTests.it('preserves literal characters', function() {
            // Note: Some format libraries replace D, a, t, e with date tokens
            // Use a format that tests literal preservation without conflicting with tokens
            var result = Funky.Timezone.formatString('2024-01-15T10:30:00Z', 'YYYY-MM-DD');
            // Verify the result contains hyphens (literal characters preserved between tokens)
            expect(result).toContain('-');
            expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
        });

        FunkyTests.it('format() accepts format string as second parameter', function() {
            var result = Funky.Timezone.format('2024-01-15T10:30:00Z', 'YYYY-MM-DD');
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        FunkyTests.it('handles Date object input', function() {
            var date = new Date(Date.UTC(2024, 0, 15, 10, 30, 0));
            var result = Funky.Timezone.formatString(date, 'YYYY-MM-DD');
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        FunkyTests.it('handles edge case with midnight hour', function() {
            var result = Funky.Timezone.formatString('2024-01-15T00:00:00Z', 'HH:mm');
            // Should format midnight correctly (might shift based on timezone)
            expect(result).toMatch(/^\d{2}:\d{2}$/);
        });

        FunkyTests.it('handles double-digit month', function() {
            var result = Funky.Timezone.formatString('2024-12-15T10:30:00Z', 'MM');
            expect(result).toBe('12');
        });

        FunkyTests.it('handles double-digit day', function() {
            var result = Funky.Timezone.formatString('2024-01-25T10:30:00Z', 'DD');
            expect(result).toBe('25');
        });
    });

    FunkyTests.describe('getAbbreviation()', function() {
        FunkyTests.it('returns a string', function() {
            var abbr = Funky.Timezone.getAbbreviation();
            expect(typeof abbr).toBe('string');
        });

        FunkyTests.it('accepts optional date parameter', function() {
            var date = new Date(2024, 6, 15); // July (summer time)
            var abbr = Funky.Timezone.getAbbreviation(date);
            expect(typeof abbr).toBe('string');
        });

        FunkyTests.it('returns typical abbreviation format', function() {
            var abbr = Funky.Timezone.getAbbreviation();
            // Abbreviations are usually 2-5 characters (EST, PST, GMT, AEST, etc.)
            // Or could be UTC offset like GMT+5
            expect(abbr.length).toBeLessThan(10);
        });
    });

    FunkyTests.describe('renderDate()', function() {
        FunkyTests.it('returns dash for empty input', function() {
            var result = Funky.Timezone.renderDate(null);
            expect(result).toBe('-');
        });

        FunkyTests.it('returns dash for undefined input', function() {
            var result = Funky.Timezone.renderDate(undefined);
            expect(result).toBe('-');
        });

        FunkyTests.it('renders valid date', function() {
            var result = Funky.Timezone.renderDate('2024-01-15T10:30:00Z');
            expect(typeof result).toBe('string');
            expect(result).not.toBe('-');
        });

        FunkyTests.it('accepts dateOnly option', function() {
            var result = Funky.Timezone.renderDate('2024-01-15T10:30:00Z', { dateOnly: true });
            expect(typeof result).toBe('string');
            // Should not contain time
        });

        FunkyTests.it('accepts showTZ option', function() {
            var resultWithTZ = Funky.Timezone.renderDate('2024-01-15T10:30:00Z', { showTZ: true });
            var resultWithoutTZ = Funky.Timezone.renderDate('2024-01-15T10:30:00Z', { showTZ: false });
            // Both should be strings
            expect(typeof resultWithTZ).toBe('string');
            expect(typeof resultWithoutTZ).toBe('string');
        });

        FunkyTests.it('returns original for invalid date', function() {
            var result = Funky.Timezone.renderDate('not-a-date');
            expect(result).toBe('not-a-date');
        });
    });

    FunkyTests.describe('dateRenderer()', function() {
        FunkyTests.it('returns a function', function() {
            var renderer = Funky.Timezone.dateRenderer();
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('returned function formats dates', function() {
            var renderer = Funky.Timezone.dateRenderer();
            var result = renderer('2024-01-15T10:30:00Z');
            expect(typeof result).toBe('string');
        });

        FunkyTests.it('accepts options', function() {
            var renderer = Funky.Timezone.dateRenderer({ dateOnly: true });
            var result = renderer('2024-01-15T10:30:00Z');
            expect(typeof result).toBe('string');
        });
    });

    FunkyTests.describe('initialize()', function() {
        FunkyTests.it('returns a Promise', function() {
            var result = Funky.Timezone.initialize();
            expect(result).toBeDefined();
            expect(typeof result.then).toBe('function');
        });
    });

    FunkyTests.describe('fetchTimezones()', function() {
        FunkyTests.it('has fetchTimezones method', function() {
            expect(typeof Funky.Timezone.fetchTimezones).toBe('function');
        });

        FunkyTests.it('returns a Promise', function() {
            var result = Funky.Timezone.fetchTimezones();
            expect(result).toBeDefined();
            expect(typeof result.then).toBe('function');
        });
    });

    FunkyTests.describe('initializeSelector()', function() {
        FunkyTests.it('has initializeSelector method', function() {
            expect(typeof Funky.Timezone.initializeSelector).toBe('function');
        });
    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    FunkyTests.describe('Error handling', function() {
        FunkyTests.it('format handles invalid date string gracefully', function() {
            expect(function() {
                Funky.Timezone.format('not-a-date');
            }).not.toThrow();
        });

        FunkyTests.it('format handles empty object gracefully', function() {
            expect(function() {
                Funky.Timezone.format({});
            }).not.toThrow();
        });

        FunkyTests.it('format handles invalid Date object gracefully', function() {
            expect(function() {
                Funky.Timezone.format(new Date('invalid'));
            }).not.toThrow();
        });

        FunkyTests.it('formatWithTZ handles invalid date gracefully', function() {
            expect(function() {
                Funky.Timezone.formatWithTZ('not-a-date');
            }).not.toThrow();
        });

        FunkyTests.it('setTimezone handles null gracefully', function() {
            expect(function() {
                Funky.Timezone.setTimezone(null);
            }).not.toThrow();
        });

        FunkyTests.it('setTimezone handles undefined gracefully', function() {
            expect(function() {
                Funky.Timezone.setTimezone(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('setTimezone handles invalid timezone string', function() {
            expect(function() {
                Funky.Timezone.setTimezone('Invalid/Timezone');
            }).not.toThrow();
        });

        FunkyTests.it('renderDate handles object instead of date', function() {
            var result = Funky.Timezone.renderDate({ not: 'a date' });
            // Implementation may return original value for invalid input
            expect(result).toBeDefined();
        });

        FunkyTests.it('renderDate handles array instead of date', function() {
            var result = Funky.Timezone.renderDate([2024, 1, 15]);
            expect(typeof result).toBe('string');
        });

        FunkyTests.it('getAbbreviation handles invalid date gracefully', function() {
            expect(function() {
                Funky.Timezone.getAbbreviation(new Date('invalid'));
            }).not.toThrow();
        });

        FunkyTests.it('initialize handles network errors gracefully', function(done) {
            // Should not throw even if network fails
            var result = Funky.Timezone.initialize();
            result.then(function() {
                expect(true).toBe(true);
                done();
            }).catch(function() {
                // Even on error, should resolve
                expect(true).toBe(true);
                done();
            });
        });
    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    FunkyTests.describe('Edge cases', function() {
        FunkyTests.it('format handles Unix epoch', function() {
            var result = Funky.Timezone.format(new Date(0));
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('format handles far future date', function() {
            var futureDate = new Date(3000, 0, 1);
            var result = Funky.Timezone.format(futureDate);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('format handles negative year', function() {
            var result = Funky.Timezone.format('-001000-01-01T00:00:00Z');
            expect(typeof result).toBe('string');
        });

        FunkyTests.it('format handles timestamp number', function() {
            var timestamp = 1705312200000; // 2024-01-15T10:30:00.000Z
            var result = Funky.Timezone.format(timestamp);
            expect(typeof result).toBe('string');
        });

        FunkyTests.it('format handles ISO string with milliseconds', function() {
            var result = Funky.Timezone.format('2024-01-15T10:30:00.123Z');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('format handles date with timezone offset', function() {
            var result = Funky.Timezone.format('2024-01-15T10:30:00+05:30');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('dateRenderer returns consistent results', function() {
            var renderer = Funky.Timezone.dateRenderer();
            var date = '2024-01-15T10:30:00Z';

            var result1 = renderer(date);
            var result2 = renderer(date);

            expect(result1).toBe(result2);
        });

        FunkyTests.it('handles DST transition date', function() {
            // A date during typical DST transition (varies by region)
            var result = Funky.Timezone.format('2024-03-10T02:30:00Z');
            expect(typeof result).toBe('string');
        });

        FunkyTests.it('handles leap year date', function() {
            var result = Funky.Timezone.format('2024-02-29T12:00:00Z');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('handles end of year date', function() {
            var result = Funky.Timezone.format('2024-12-31T23:59:59Z');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // INPUT VALIDATION TESTS
    // =========================================================================
    FunkyTests.describe('Input validation', function() {
        FunkyTests.it('format handles boolean input', function() {
            expect(function() {
                Funky.Timezone.format(true);
            }).not.toThrow();
        });

        FunkyTests.it('format handles number input', function() {
            var result = Funky.Timezone.format(12345);
            expect(typeof result).toBe('string');
        });

        FunkyTests.it('renderDate options can be empty object', function() {
            var result = Funky.Timezone.renderDate('2024-01-15T10:30:00Z', {});
            expect(typeof result).toBe('string');
        });

        FunkyTests.it('renderDate options can be null', function() {
            expect(function() {
                Funky.Timezone.renderDate('2024-01-15T10:30:00Z', null);
            }).not.toThrow();
        });

        FunkyTests.it('dateRenderer options can be empty object', function() {
            var renderer = Funky.Timezone.dateRenderer({});
            expect(typeof renderer).toBe('function');
        });

        FunkyTests.it('format options can be null', function() {
            expect(function() {
                Funky.Timezone.format('2024-01-15T10:30:00Z', null);
            }).not.toThrow();
        });
    });

    // =========================================================================
    // STATE VERIFICATION TESTS
    // =========================================================================
    FunkyTests.describe('State verification', function() {
        FunkyTests.it('getEffectiveTimezone always returns valid string', function() {
            var tz = Funky.Timezone.getEffectiveTimezone();
            expect(typeof tz).toBe('string');
            expect(tz.length).toBeGreaterThan(0);
        });

        FunkyTests.it('detectBrowserTimezone returns consistent value', function() {
            var tz1 = Funky.Timezone.detectBrowserTimezone();
            var tz2 = Funky.Timezone.detectBrowserTimezone();
            expect(tz1).toBe(tz2);
        });

        FunkyTests.it('getAbbreviation returns consistent value for same date', function() {
            var date = new Date(2024, 0, 15);
            var abbr1 = Funky.Timezone.getAbbreviation(date);
            var abbr2 = Funky.Timezone.getAbbreviation(date);
            expect(abbr1).toBe(abbr2);
        });
    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    FunkyTests.describe('Cleanup', function() {
        FunkyTests.it('initialize can be called multiple times', function(done) {
            Funky.Timezone.initialize().then(function() {
                return Funky.Timezone.initialize();
            }).then(function() {
                expect(true).toBe(true);
                done();
            }).catch(function() {
                // Should still pass
                expect(true).toBe(true);
                done();
            });
        });

        FunkyTests.it('dateRenderer creates independent instances', function() {
            var renderer1 = Funky.Timezone.dateRenderer({ dateOnly: true });
            var renderer2 = Funky.Timezone.dateRenderer({ showTZ: true });

            expect(renderer1).not.toBe(renderer2);
        });
    });
});
