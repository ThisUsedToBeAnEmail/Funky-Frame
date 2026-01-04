/**
 * Funky.Date Tests
 *
 * Tests for date manipulation, comparison, formatting, and calendar grid generation.
 */

describe('Funky.Core.Date', function() {

    var DateUtil = Funky.Date;

    // =========================================================================
    // COMPARISON METHODS
    // =========================================================================

    describe('Comparison Methods', function() {

        describe('isSameDay()', function() {

            it('returns true for same day', function() {
                var date1 = new Date(2025, 0, 15, 10, 30);
                var date2 = new Date(2025, 0, 15, 14, 45);
                expect(DateUtil.isSameDay(date1, date2)).toBe(true);
            });

            it('returns false for different days', function() {
                var date1 = new Date(2025, 0, 15);
                var date2 = new Date(2025, 0, 16);
                expect(DateUtil.isSameDay(date1, date2)).toBe(false);
            });

            it('returns false for different months', function() {
                var date1 = new Date(2025, 0, 15);
                var date2 = new Date(2025, 1, 15);
                expect(DateUtil.isSameDay(date1, date2)).toBe(false);
            });

            it('returns false for different years', function() {
                var date1 = new Date(2025, 0, 15);
                var date2 = new Date(2024, 0, 15);
                expect(DateUtil.isSameDay(date1, date2)).toBe(false);
            });

            it('ignores time component', function() {
                var date1 = new Date(2025, 0, 15, 0, 0, 0, 0);
                var date2 = new Date(2025, 0, 15, 23, 59, 59, 999);
                expect(DateUtil.isSameDay(date1, date2)).toBe(true);
            });

            it('handles null first argument', function() {
                expect(DateUtil.isSameDay(null, new Date())).toBe(false);
            });

            it('handles null second argument', function() {
                expect(DateUtil.isSameDay(new Date(), null)).toBe(false);
            });

            it('handles both arguments null', function() {
                expect(DateUtil.isSameDay(null, null)).toBe(false);
            });

            it('handles undefined inputs', function() {
                expect(DateUtil.isSameDay(undefined, new Date())).toBe(false);
                expect(DateUtil.isSameDay(new Date(), undefined)).toBe(false);
            });

        });

        describe('isToday()', function() {

            it('returns true for today', function() {
                expect(DateUtil.isToday(new Date())).toBe(true);
            });

            it('returns true for today at different times', function() {
                var today = new Date();
                today.setHours(23, 59, 59, 999);
                expect(DateUtil.isToday(today)).toBe(true);
            });

            it('returns false for yesterday', function() {
                var yesterday = DateUtil.addDays(new Date(), -1);
                expect(DateUtil.isToday(yesterday)).toBe(false);
            });

            it('returns false for tomorrow', function() {
                var tomorrow = DateUtil.addDays(new Date(), 1);
                expect(DateUtil.isToday(tomorrow)).toBe(false);
            });

            it('handles null input', function() {
                expect(DateUtil.isToday(null)).toBe(false);
            });

            it('handles undefined input', function() {
                expect(DateUtil.isToday(undefined)).toBe(false);
            });

        });

        describe('isSameMonth()', function() {

            it('returns true for same month and year', function() {
                var date1 = new Date(2025, 5, 1);
                var date2 = new Date(2025, 5, 30);
                expect(DateUtil.isSameMonth(date1, date2)).toBe(true);
            });

            it('returns false for same month different year', function() {
                var date1 = new Date(2025, 5, 15);
                var date2 = new Date(2024, 5, 15);
                expect(DateUtil.isSameMonth(date1, date2)).toBe(false);
            });

            it('returns false for different month same year', function() {
                var date1 = new Date(2025, 5, 15);
                var date2 = new Date(2025, 6, 15);
                expect(DateUtil.isSameMonth(date1, date2)).toBe(false);
            });

            it('handles null inputs', function() {
                expect(DateUtil.isSameMonth(null, new Date())).toBe(false);
                expect(DateUtil.isSameMonth(new Date(), null)).toBe(false);
                expect(DateUtil.isSameMonth(null, null)).toBe(false);
            });

        });

        describe('isWeekend()', function() {

            it('returns true for Saturday', function() {
                // January 4, 2025 is a Saturday
                var saturday = new Date(2025, 0, 4);
                expect(DateUtil.isWeekend(saturday)).toBe(true);
            });

            it('returns true for Sunday', function() {
                // January 5, 2025 is a Sunday
                var sunday = new Date(2025, 0, 5);
                expect(DateUtil.isWeekend(sunday)).toBe(true);
            });

            it('returns false for Monday', function() {
                // January 6, 2025 is a Monday
                var monday = new Date(2025, 0, 6);
                expect(DateUtil.isWeekend(monday)).toBe(false);
            });

            it('returns false for Tuesday', function() {
                // January 7, 2025 is a Tuesday
                var tuesday = new Date(2025, 0, 7);
                expect(DateUtil.isWeekend(tuesday)).toBe(false);
            });

            it('returns false for Wednesday', function() {
                // January 8, 2025 is a Wednesday
                var wednesday = new Date(2025, 0, 8);
                expect(DateUtil.isWeekend(wednesday)).toBe(false);
            });

            it('returns false for Thursday', function() {
                // January 9, 2025 is a Thursday
                var thursday = new Date(2025, 0, 9);
                expect(DateUtil.isWeekend(thursday)).toBe(false);
            });

            it('returns false for Friday', function() {
                // January 10, 2025 is a Friday
                var friday = new Date(2025, 0, 10);
                expect(DateUtil.isWeekend(friday)).toBe(false);
            });

            it('handles null input', function() {
                expect(DateUtil.isWeekend(null)).toBe(false);
            });

        });

        describe('isBefore()', function() {

            it('returns true for earlier date', function() {
                var earlier = new Date(2025, 0, 10);
                var later = new Date(2025, 0, 15);
                expect(DateUtil.isBefore(earlier, later)).toBe(true);
            });

            it('returns false for later date', function() {
                var earlier = new Date(2025, 0, 10);
                var later = new Date(2025, 0, 15);
                expect(DateUtil.isBefore(later, earlier)).toBe(false);
            });

            it('returns false for same date', function() {
                var date = new Date(2025, 0, 15, 12, 0);
                expect(DateUtil.isBefore(date, date)).toBe(false);
            });

            it('compares time component when same day', function() {
                var earlier = new Date(2025, 0, 15, 10, 0);
                var later = new Date(2025, 0, 15, 14, 0);
                expect(DateUtil.isBefore(earlier, later)).toBe(true);
                expect(DateUtil.isBefore(later, earlier)).toBe(false);
            });

            it('handles null inputs', function() {
                expect(DateUtil.isBefore(null, new Date())).toBe(false);
                expect(DateUtil.isBefore(new Date(), null)).toBe(false);
                expect(DateUtil.isBefore(null, null)).toBe(false);
            });

        });

        describe('isAfter()', function() {

            it('returns true for later date', function() {
                var earlier = new Date(2025, 0, 10);
                var later = new Date(2025, 0, 15);
                expect(DateUtil.isAfter(later, earlier)).toBe(true);
            });

            it('returns false for earlier date', function() {
                var earlier = new Date(2025, 0, 10);
                var later = new Date(2025, 0, 15);
                expect(DateUtil.isAfter(earlier, later)).toBe(false);
            });

            it('returns false for same date', function() {
                var date = new Date(2025, 0, 15, 12, 0);
                expect(DateUtil.isAfter(date, date)).toBe(false);
            });

            it('compares time component when same day', function() {
                var earlier = new Date(2025, 0, 15, 10, 0);
                var later = new Date(2025, 0, 15, 14, 0);
                expect(DateUtil.isAfter(later, earlier)).toBe(true);
                expect(DateUtil.isAfter(earlier, later)).toBe(false);
            });

            it('handles null inputs', function() {
                expect(DateUtil.isAfter(null, new Date())).toBe(false);
                expect(DateUtil.isAfter(new Date(), null)).toBe(false);
                expect(DateUtil.isAfter(null, null)).toBe(false);
            });

        });

        describe('isInRange()', function() {

            it('returns true for date within range', function() {
                var date = new Date(2025, 0, 15);
                var start = new Date(2025, 0, 10);
                var end = new Date(2025, 0, 20);
                expect(DateUtil.isInRange(date, start, end)).toBe(true);
            });

            it('returns true for date equal to start (inclusive)', function() {
                var start = new Date(2025, 0, 10);
                var end = new Date(2025, 0, 20);
                expect(DateUtil.isInRange(start, start, end)).toBe(true);
            });

            it('returns true for date equal to end (inclusive)', function() {
                var start = new Date(2025, 0, 10);
                var end = new Date(2025, 0, 20);
                expect(DateUtil.isInRange(end, start, end)).toBe(true);
            });

            it('returns false for date before range', function() {
                var date = new Date(2025, 0, 5);
                var start = new Date(2025, 0, 10);
                var end = new Date(2025, 0, 20);
                expect(DateUtil.isInRange(date, start, end)).toBe(false);
            });

            it('returns false for date after range', function() {
                var date = new Date(2025, 0, 25);
                var start = new Date(2025, 0, 10);
                var end = new Date(2025, 0, 20);
                expect(DateUtil.isInRange(date, start, end)).toBe(false);
            });

            it('returns true when only start is specified and date is after', function() {
                var date = new Date(2025, 0, 15);
                var start = new Date(2025, 0, 10);
                expect(DateUtil.isInRange(date, start, null)).toBe(true);
            });

            it('returns false when only start is specified and date is before', function() {
                var date = new Date(2025, 0, 5);
                var start = new Date(2025, 0, 10);
                expect(DateUtil.isInRange(date, start, null)).toBe(false);
            });

            it('returns true when only end is specified and date is before', function() {
                var date = new Date(2025, 0, 15);
                var end = new Date(2025, 0, 20);
                expect(DateUtil.isInRange(date, null, end)).toBe(true);
            });

            it('returns false when only end is specified and date is after', function() {
                var date = new Date(2025, 0, 25);
                var end = new Date(2025, 0, 20);
                expect(DateUtil.isInRange(date, null, end)).toBe(false);
            });

            it('returns true when no bounds specified', function() {
                var date = new Date(2025, 0, 15);
                expect(DateUtil.isInRange(date, null, null)).toBe(true);
            });

            it('handles null date input', function() {
                var start = new Date(2025, 0, 10);
                var end = new Date(2025, 0, 20);
                expect(DateUtil.isInRange(null, start, end)).toBe(false);
            });

        });

        describe('compare()', function() {

            it('returns -1 for date1 before date2', function() {
                var date1 = new Date(2025, 0, 10);
                var date2 = new Date(2025, 0, 15);
                expect(DateUtil.compare(date1, date2)).toBe(-1);
            });

            it('returns 1 for date1 after date2', function() {
                var date1 = new Date(2025, 0, 15);
                var date2 = new Date(2025, 0, 10);
                expect(DateUtil.compare(date1, date2)).toBe(1);
            });

            it('returns 0 for equal dates', function() {
                var date1 = new Date(2025, 0, 15, 12, 30);
                var date2 = new Date(2025, 0, 15, 12, 30);
                expect(DateUtil.compare(date1, date2)).toBe(0);
            });

            it('handles null inputs', function() {
                expect(DateUtil.compare(null, new Date())).toBe(0);
                expect(DateUtil.compare(new Date(), null)).toBe(0);
                expect(DateUtil.compare(null, null)).toBe(0);
            });

        });

    });

    // =========================================================================
    // BOUNDARY METHODS
    // =========================================================================

    describe('Boundary Methods', function() {

        describe('startOfDay()', function() {

            it('returns 00:00:00.000', function() {
                var date = new Date(2025, 0, 15, 14, 30, 45, 500);
                var result = DateUtil.startOfDay(date);

                expect(result.getHours()).toBe(0);
                expect(result.getMinutes()).toBe(0);
                expect(result.getSeconds()).toBe(0);
                expect(result.getMilliseconds()).toBe(0);
            });

            it('preserves date components', function() {
                var date = new Date(2025, 5, 20, 14, 30);
                var result = DateUtil.startOfDay(date);

                expect(result.getFullYear()).toBe(2025);
                expect(result.getMonth()).toBe(5);
                expect(result.getDate()).toBe(20);
            });

            it('does not mutate input', function() {
                var date = new Date(2025, 0, 15, 14, 30);
                var original = date.getTime();
                DateUtil.startOfDay(date);

                expect(date.getTime()).toBe(original);
            });

            it('returns new Date object', function() {
                var date = new Date(2025, 0, 15, 14, 30);
                var result = DateUtil.startOfDay(date);

                expect(result).not.toBe(date);
            });

            it('handles null input', function() {
                expect(DateUtil.startOfDay(null)).toBeNull();
            });

        });

        describe('endOfDay()', function() {

            it('returns 23:59:59.999', function() {
                var date = new Date(2025, 0, 15, 14, 30, 45, 500);
                var result = DateUtil.endOfDay(date);

                expect(result.getHours()).toBe(23);
                expect(result.getMinutes()).toBe(59);
                expect(result.getSeconds()).toBe(59);
                expect(result.getMilliseconds()).toBe(999);
            });

            it('preserves date components', function() {
                var date = new Date(2025, 5, 20, 14, 30);
                var result = DateUtil.endOfDay(date);

                expect(result.getFullYear()).toBe(2025);
                expect(result.getMonth()).toBe(5);
                expect(result.getDate()).toBe(20);
            });

            it('does not mutate input', function() {
                var date = new Date(2025, 0, 15, 14, 30);
                var original = date.getTime();
                DateUtil.endOfDay(date);

                expect(date.getTime()).toBe(original);
            });

            it('handles null input', function() {
                expect(DateUtil.endOfDay(null)).toBeNull();
            });

        });

        describe('startOfMonth()', function() {

            it('returns first day of month', function() {
                var date = new Date(2025, 5, 15);
                var result = DateUtil.startOfMonth(date);

                expect(result.getDate()).toBe(1);
                expect(result.getMonth()).toBe(5);
                expect(result.getFullYear()).toBe(2025);
            });

            it('time is 00:00:00.000', function() {
                var date = new Date(2025, 5, 15, 14, 30);
                var result = DateUtil.startOfMonth(date);

                expect(result.getHours()).toBe(0);
                expect(result.getMinutes()).toBe(0);
                expect(result.getSeconds()).toBe(0);
                expect(result.getMilliseconds()).toBe(0);
            });

            it('works for all months', function() {
                for (var m = 0; m < 12; m++) {
                    var date = new Date(2025, m, 15);
                    var result = DateUtil.startOfMonth(date);
                    expect(result.getDate()).toBe(1);
                    expect(result.getMonth()).toBe(m);
                }
            });

            it('handles null input', function() {
                expect(DateUtil.startOfMonth(null)).toBeNull();
            });

        });

        describe('endOfMonth()', function() {

            it('returns last day of month', function() {
                var date = new Date(2025, 0, 15); // January
                var result = DateUtil.endOfMonth(date);
                expect(result.getDate()).toBe(31);
            });

            it('time is 23:59:59.999', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.endOfMonth(date);

                expect(result.getHours()).toBe(23);
                expect(result.getMinutes()).toBe(59);
                expect(result.getSeconds()).toBe(59);
                expect(result.getMilliseconds()).toBe(999);
            });

            it('handles 28 day month (February non-leap)', function() {
                var date = new Date(2025, 1, 10); // February 2025 (non-leap)
                var result = DateUtil.endOfMonth(date);
                expect(result.getDate()).toBe(28);
            });

            it('handles 29 day month (February leap year)', function() {
                var date = new Date(2024, 1, 10); // February 2024 (leap)
                var result = DateUtil.endOfMonth(date);
                expect(result.getDate()).toBe(29);
            });

            it('handles 30 day months', function() {
                var april = new Date(2025, 3, 10);
                expect(DateUtil.endOfMonth(april).getDate()).toBe(30);

                var june = new Date(2025, 5, 10);
                expect(DateUtil.endOfMonth(june).getDate()).toBe(30);

                var september = new Date(2025, 8, 10);
                expect(DateUtil.endOfMonth(september).getDate()).toBe(30);

                var november = new Date(2025, 10, 10);
                expect(DateUtil.endOfMonth(november).getDate()).toBe(30);
            });

            it('handles 31 day months', function() {
                var january = new Date(2025, 0, 10);
                expect(DateUtil.endOfMonth(january).getDate()).toBe(31);

                var march = new Date(2025, 2, 10);
                expect(DateUtil.endOfMonth(march).getDate()).toBe(31);

                var december = new Date(2025, 11, 10);
                expect(DateUtil.endOfMonth(december).getDate()).toBe(31);
            });

            it('handles null input', function() {
                expect(DateUtil.endOfMonth(null)).toBeNull();
            });

        });

        describe('startOfWeek()', function() {

            it('returns correct day for weekStarts=0 (Sunday)', function() {
                // January 15, 2025 is a Wednesday
                var wednesday = new Date(2025, 0, 15);
                var result = DateUtil.startOfWeek(wednesday, 0);
                expect(result.getDay()).toBe(0); // Sunday
                expect(result.getDate()).toBe(12); // January 12
            });

            it('returns correct day for weekStarts=1 (Monday)', function() {
                // January 15, 2025 is a Wednesday
                var wednesday = new Date(2025, 0, 15);
                var result = DateUtil.startOfWeek(wednesday, 1);
                expect(result.getDay()).toBe(1); // Monday
                expect(result.getDate()).toBe(13); // January 13
            });

            it('returns same day if already at week start', function() {
                // January 12, 2025 is a Sunday
                var sunday = new Date(2025, 0, 12);
                var result = DateUtil.startOfWeek(sunday, 0);
                expect(result.getDate()).toBe(12);
            });

            it('time is 00:00:00.000', function() {
                var date = new Date(2025, 0, 15, 14, 30);
                var result = DateUtil.startOfWeek(date, 0);

                expect(result.getHours()).toBe(0);
                expect(result.getMinutes()).toBe(0);
                expect(result.getSeconds()).toBe(0);
                expect(result.getMilliseconds()).toBe(0);
            });

            it('handles null input', function() {
                expect(DateUtil.startOfWeek(null)).toBeNull();
            });

            it('defaults to Sunday start when weekStarts not specified', function() {
                var wednesday = new Date(2025, 0, 15);
                var result = DateUtil.startOfWeek(wednesday);
                expect(result.getDay()).toBe(0);
            });

        });

        describe('endOfWeek()', function() {

            it('returns correct day for weekStarts=0 (ends Saturday)', function() {
                // January 15, 2025 is a Wednesday
                var wednesday = new Date(2025, 0, 15);
                var result = DateUtil.endOfWeek(wednesday, 0);
                expect(result.getDay()).toBe(6); // Saturday
                expect(result.getDate()).toBe(18); // January 18
            });

            it('returns correct day for weekStarts=1 (ends Sunday)', function() {
                // January 15, 2025 is a Wednesday
                var wednesday = new Date(2025, 0, 15);
                var result = DateUtil.endOfWeek(wednesday, 1);
                expect(result.getDay()).toBe(0); // Sunday
                expect(result.getDate()).toBe(19); // January 19
            });

            it('time is 23:59:59.999', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.endOfWeek(date, 0);

                expect(result.getHours()).toBe(23);
                expect(result.getMinutes()).toBe(59);
                expect(result.getSeconds()).toBe(59);
                expect(result.getMilliseconds()).toBe(999);
            });

            it('handles null input', function() {
                expect(DateUtil.endOfWeek(null)).toBeNull();
            });

        });

    });

    // =========================================================================
    // ARITHMETIC METHODS
    // =========================================================================

    describe('Arithmetic Methods', function() {

        describe('addDays()', function() {

            it('adds positive days', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.addDays(date, 5);
                expect(result.getDate()).toBe(20);
            });

            it('subtracts with negative days', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.addDays(date, -5);
                expect(result.getDate()).toBe(10);
            });

            it('returns same date for 0 days', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.addDays(date, 0);
                expect(result.getDate()).toBe(15);
            });

            it('crosses month boundary forward', function() {
                var date = new Date(2025, 0, 30);
                var result = DateUtil.addDays(date, 5);
                expect(result.getMonth()).toBe(1); // February
                expect(result.getDate()).toBe(4);
            });

            it('crosses month boundary backward', function() {
                var date = new Date(2025, 1, 3);
                var result = DateUtil.addDays(date, -5);
                expect(result.getMonth()).toBe(0); // January
                expect(result.getDate()).toBe(29);
            });

            it('crosses year boundary forward', function() {
                var date = new Date(2024, 11, 30);
                var result = DateUtil.addDays(date, 5);
                expect(result.getFullYear()).toBe(2025);
                expect(result.getMonth()).toBe(0);
                expect(result.getDate()).toBe(4);
            });

            it('crosses year boundary backward', function() {
                var date = new Date(2025, 0, 3);
                var result = DateUtil.addDays(date, -5);
                expect(result.getFullYear()).toBe(2024);
                expect(result.getMonth()).toBe(11);
                expect(result.getDate()).toBe(29);
            });

            it('does not mutate input', function() {
                var date = new Date(2025, 0, 15);
                var original = date.getTime();
                DateUtil.addDays(date, 5);
                expect(date.getTime()).toBe(original);
            });

            it('returns new Date object', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.addDays(date, 5);
                expect(result).not.toBe(date);
            });

            it('handles null input', function() {
                expect(DateUtil.addDays(null, 5)).toBeNull();
            });

        });

        describe('addMonths()', function() {

            it('adds positive months', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.addMonths(date, 3);
                expect(result.getMonth()).toBe(3); // April
                expect(result.getDate()).toBe(15);
            });

            it('subtracts with negative months', function() {
                var date = new Date(2025, 5, 15);
                var result = DateUtil.addMonths(date, -3);
                expect(result.getMonth()).toBe(2); // March
            });

            it('returns same month for 0 months', function() {
                var date = new Date(2025, 5, 15);
                var result = DateUtil.addMonths(date, 0);
                expect(result.getMonth()).toBe(5);
            });

            it('crosses year boundary forward', function() {
                var date = new Date(2025, 10, 15); // November
                var result = DateUtil.addMonths(date, 3);
                expect(result.getFullYear()).toBe(2026);
                expect(result.getMonth()).toBe(1); // February
            });

            it('crosses year boundary backward', function() {
                var date = new Date(2025, 1, 15); // February
                var result = DateUtil.addMonths(date, -3);
                expect(result.getFullYear()).toBe(2024);
                expect(result.getMonth()).toBe(10); // November
            });

            it('handles month-end edge case Jan 31 + 1 month = Feb 28', function() {
                var jan31 = new Date(2025, 0, 31);
                var result = DateUtil.addMonths(jan31, 1);
                expect(result.getMonth()).toBe(1);
                expect(result.getDate()).toBe(28);
            });

            it('handles month-end edge case Jan 31 + 1 month in leap year = Feb 29', function() {
                var jan31 = new Date(2024, 0, 31);
                var result = DateUtil.addMonths(jan31, 1);
                expect(result.getMonth()).toBe(1);
                expect(result.getDate()).toBe(29);
            });

            it('handles month-end edge case Mar 31 - 1 month = Feb 28', function() {
                var mar31 = new Date(2025, 2, 31);
                var result = DateUtil.addMonths(mar31, -1);
                expect(result.getMonth()).toBe(1);
                expect(result.getDate()).toBe(28);
            });

            it('does not mutate input', function() {
                var date = new Date(2025, 0, 15);
                var original = date.getTime();
                DateUtil.addMonths(date, 3);
                expect(date.getTime()).toBe(original);
            });

            it('handles null input', function() {
                expect(DateUtil.addMonths(null, 3)).toBeNull();
            });

        });

        describe('addYears()', function() {

            it('adds positive years', function() {
                var date = new Date(2025, 5, 15);
                var result = DateUtil.addYears(date, 2);
                expect(result.getFullYear()).toBe(2027);
                expect(result.getMonth()).toBe(5);
                expect(result.getDate()).toBe(15);
            });

            it('subtracts with negative years', function() {
                var date = new Date(2025, 5, 15);
                var result = DateUtil.addYears(date, -2);
                expect(result.getFullYear()).toBe(2023);
            });

            it('does not mutate input', function() {
                var date = new Date(2025, 0, 15);
                var original = date.getTime();
                DateUtil.addYears(date, 2);
                expect(date.getTime()).toBe(original);
            });

            it('handles null input', function() {
                expect(DateUtil.addYears(null, 2)).toBeNull();
            });

        });

        describe('daysInMonth()', function() {

            it('returns 31 for January', function() {
                var date = new Date(2025, 0, 15);
                expect(DateUtil.daysInMonth(date)).toBe(31);
            });

            it('returns 28 for February non-leap year', function() {
                var date = new Date(2025, 1, 15);
                expect(DateUtil.daysInMonth(date)).toBe(28);
            });

            it('returns 29 for February leap year', function() {
                var date = new Date(2024, 1, 15);
                expect(DateUtil.daysInMonth(date)).toBe(29);
            });

            it('returns 30 for April', function() {
                var date = new Date(2025, 3, 15);
                expect(DateUtil.daysInMonth(date)).toBe(30);
            });

            it('returns 31 for July', function() {
                var date = new Date(2025, 6, 15);
                expect(DateUtil.daysInMonth(date)).toBe(31);
            });

            it('handles null input', function() {
                expect(DateUtil.daysInMonth(null)).toBe(0);
            });

        });

        describe('clone()', function() {

            it('returns new Date object with same time', function() {
                var date = new Date(2025, 5, 15, 14, 30, 45, 123);
                var result = DateUtil.clone(date);
                expect(result.getTime()).toBe(date.getTime());
            });

            it('returns different object', function() {
                var date = new Date(2025, 5, 15);
                var result = DateUtil.clone(date);
                expect(result).not.toBe(date);
            });

            it('modifying clone does not affect original', function() {
                var date = new Date(2025, 5, 15);
                var result = DateUtil.clone(date);
                result.setDate(20);
                expect(date.getDate()).toBe(15);
            });

            it('handles null input', function() {
                expect(DateUtil.clone(null)).toBeNull();
            });

        });

    });

    // =========================================================================
    // GRID GENERATION
    // =========================================================================

    describe('Grid Generation', function() {

        describe('generateMonthGrid()', function() {

            it('returns array of weeks', function() {
                var date = new Date(2025, 0, 15);
                var grid = DateUtil.generateMonthGrid(date, 0);

                expect(Array.isArray(grid)).toBe(true);
                expect(grid.length).toBe(6); // Always 6 weeks for consistent height
            });

            it('each week has 7 days', function() {
                var date = new Date(2025, 0, 15);
                var grid = DateUtil.generateMonthGrid(date, 0);

                grid.forEach(function(week) {
                    expect(week.length).toBe(7);
                });
            });

            it('first day respects weekStarts=0 (Sunday)', function() {
                var date = new Date(2025, 0, 15);
                var grid = DateUtil.generateMonthGrid(date, 0);
                expect(grid[0][0].date.getDay()).toBe(0); // Sunday
            });

            it('first day respects weekStarts=1 (Monday)', function() {
                var date = new Date(2025, 0, 15);
                var grid = DateUtil.generateMonthGrid(date, 1);
                expect(grid[0][0].date.getDay()).toBe(1); // Monday
            });

            it('days have correct date property', function() {
                var date = new Date(2025, 0, 15);
                var grid = DateUtil.generateMonthGrid(date, 0);

                grid.forEach(function(week) {
                    week.forEach(function(day) {
                        expect(day.date instanceof Date).toBe(true);
                        expect(day.day).toBe(day.date.getDate());
                        expect(day.month).toBe(day.date.getMonth());
                        expect(day.year).toBe(day.date.getFullYear());
                    });
                });
            });

            it('days have correct isCurrentMonth flag', function() {
                var date = new Date(2025, 0, 15); // January 2025
                var grid = DateUtil.generateMonthGrid(date, 0);

                var hasCurrentMonth = false;
                var hasOtherMonth = false;

                grid.forEach(function(week) {
                    week.forEach(function(day) {
                        if (day.isCurrentMonth) {
                            expect(day.month).toBe(0); // January
                            hasCurrentMonth = true;
                        } else {
                            expect(day.month !== 0).toBe(true);
                            hasOtherMonth = true;
                        }
                    });
                });

                expect(hasCurrentMonth).toBe(true);
                expect(hasOtherMonth).toBe(true);
            });

            it('days have correct isToday flag', function() {
                var today = new Date();
                var grid = DateUtil.generateMonthGrid(today, 0);

                var todayCount = 0;
                grid.forEach(function(week) {
                    week.forEach(function(day) {
                        if (day.isToday) {
                            todayCount++;
                        }
                    });
                });

                expect(todayCount).toBe(1);
            });

            it('days have correct isWeekend flag', function() {
                var date = new Date(2025, 0, 15);
                var grid = DateUtil.generateMonthGrid(date, 0);

                grid.forEach(function(week) {
                    week.forEach(function(day) {
                        var dayOfWeek = day.date.getDay();
                        if (dayOfWeek === 0 || dayOfWeek === 6) {
                            expect(day.isWeekend).toBe(true);
                        } else {
                            expect(day.isWeekend).toBe(false);
                        }
                    });
                });
            });

            it('days have dateString property', function() {
                var date = new Date(2025, 0, 15);
                var grid = DateUtil.generateMonthGrid(date, 0);

                grid.forEach(function(week) {
                    week.forEach(function(day) {
                        expect(typeof day.dateString).toBe('string');
                        expect(day.dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                    });
                });
            });

            it('grid covers full month', function() {
                var date = new Date(2025, 0, 15); // January 2025
                var grid = DateUtil.generateMonthGrid(date, 0);

                var firstDays = [];
                grid.forEach(function(week) {
                    week.forEach(function(day) {
                        if (day.isCurrentMonth && day.day === 1) {
                            firstDays.push(day);
                        }
                    });
                });

                expect(firstDays.length).toBe(1);

                var lastDays = [];
                grid.forEach(function(week) {
                    week.forEach(function(day) {
                        if (day.isCurrentMonth && day.day === 31) {
                            lastDays.push(day);
                        }
                    });
                });

                expect(lastDays.length).toBe(1);
            });

            it('handles null input', function() {
                var result = DateUtil.generateMonthGrid(null, 0);
                expect(Array.isArray(result)).toBe(true);
                expect(result.length).toBe(0);
            });

        });

        describe('generateWeekGrid()', function() {

            it('returns object with days and slots', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.generateWeekGrid(date);

                expect(result.days).toBeDefined();
                expect(result.slots).toBeDefined();
                expect(Array.isArray(result.days)).toBe(true);
                expect(Array.isArray(result.slots)).toBe(true);
            });

            it('has 7 days', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.generateWeekGrid(date);
                expect(result.days.length).toBe(7);
            });

            it('days have required properties', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.generateWeekGrid(date);

                result.days.forEach(function(day) {
                    expect(day.date instanceof Date).toBe(true);
                    expect(typeof day.day).toBe('number');
                    expect(typeof day.dayOfWeek).toBe('number');
                    expect(typeof day.isToday).toBe('boolean');
                    expect(typeof day.isWeekend).toBe('boolean');
                    expect(typeof day.dateString).toBe('string');
                });
            });

            it('slots are generated correctly', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.generateWeekGrid(date, {
                    startHour: 9,
                    endHour: 17,
                    slotDuration: 30
                });

                // 8 hours * 2 slots per hour = 16 slots
                expect(result.slots.length).toBe(16);
            });

            it('handles null input', function() {
                var result = DateUtil.generateWeekGrid(null);
                expect(result.days.length).toBe(0);
                expect(result.slots.length).toBe(0);
            });

        });

        describe('generateDayGrid()', function() {

            it('returns object with day and slots', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.generateDayGrid(date);

                expect(result.day).toBeDefined();
                expect(result.slots).toBeDefined();
                expect(Array.isArray(result.slots)).toBe(true);
            });

            it('day has required properties', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.generateDayGrid(date);

                expect(result.day.date instanceof Date).toBe(true);
                expect(typeof result.day.day).toBe('number');
                expect(typeof result.day.dayOfWeek).toBe('number');
                expect(typeof result.day.isToday).toBe('boolean');
                expect(typeof result.day.isWeekend).toBe('boolean');
                expect(typeof result.day.dateString).toBe('string');
            });

            it('slots have time property', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.generateDayGrid(date);

                result.slots.forEach(function(slot) {
                    expect(typeof slot.time).toBe('string');
                    expect(slot.time).toMatch(/^\d{2}:\d{2}$/);
                });
            });

            it('handles null input', function() {
                var result = DateUtil.generateDayGrid(null);
                expect(result.day).toBeNull();
                expect(result.slots.length).toBe(0);
            });

        });

        describe('getViewRange()', function() {

            it('returns correct range for month view', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.getViewRange(date, 'month', 0);

                expect(result.start instanceof Date).toBe(true);
                expect(result.end instanceof Date).toBe(true);
                // Start should be before the 1st (previous month days)
                expect(result.start.getTime()).toBeLessThanOrEqual(new Date(2025, 0, 1).getTime());
            });

            it('returns correct range for week view', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.getViewRange(date, 'week', 0);

                expect(result.start instanceof Date).toBe(true);
                expect(result.end instanceof Date).toBe(true);
                expect(result.start.getDay()).toBe(0); // Sunday
                expect(result.end.getDay()).toBe(6); // Saturday
            });

            it('returns correct range for day view', function() {
                var date = new Date(2025, 0, 15, 14, 30);
                var result = DateUtil.getViewRange(date, 'day', 0);

                expect(result.start.getHours()).toBe(0);
                expect(result.end.getHours()).toBe(23);
                expect(result.start.getDate()).toBe(15);
                expect(result.end.getDate()).toBe(15);
            });

            it('handles null input', function() {
                var result = DateUtil.getViewRange(null, 'month', 0);
                expect(result.start).toBeNull();
                expect(result.end).toBeNull();
            });

        });

    });

    // =========================================================================
    // FORMATTING METHODS
    // =========================================================================

    describe('Formatting Methods', function() {

        describe('toDateString()', function() {

            it('returns YYYY-MM-DD format', function() {
                var date = new Date(2025, 0, 15);
                expect(DateUtil.toDateString(date)).toBe('2025-01-15');
            });

            it('pads month with leading zero', function() {
                var date = new Date(2025, 0, 15);
                expect(DateUtil.toDateString(date)).toContain('-01-');
            });

            it('pads day with leading zero', function() {
                var date = new Date(2025, 0, 5);
                expect(DateUtil.toDateString(date)).toBe('2025-01-05');
            });

            it('handles double-digit months', function() {
                var date = new Date(2025, 11, 15);
                expect(DateUtil.toDateString(date)).toBe('2025-12-15');
            });

            it('handles double-digit days', function() {
                var date = new Date(2025, 0, 25);
                expect(DateUtil.toDateString(date)).toBe('2025-01-25');
            });

            it('handles null input', function() {
                expect(DateUtil.toDateString(null)).toBe('');
            });

        });

        describe('toTimeString()', function() {

            it('returns HH:MM format by default', function() {
                var date = new Date(2025, 0, 15, 14, 30);
                expect(DateUtil.toTimeString(date)).toBe('14:30');
            });

            it('returns HH:MM:SS when includeSeconds=true', function() {
                var date = new Date(2025, 0, 15, 14, 30, 45);
                expect(DateUtil.toTimeString(date, true)).toBe('14:30:45');
            });

            it('pads with leading zeros', function() {
                var date = new Date(2025, 0, 15, 5, 8, 3);
                expect(DateUtil.toTimeString(date)).toBe('05:08');
                expect(DateUtil.toTimeString(date, true)).toBe('05:08:03');
            });

            it('handles midnight', function() {
                var date = new Date(2025, 0, 15, 0, 0, 0);
                expect(DateUtil.toTimeString(date)).toBe('00:00');
            });

            it('handles 23:59:59', function() {
                var date = new Date(2025, 0, 15, 23, 59, 59);
                expect(DateUtil.toTimeString(date)).toBe('23:59');
                expect(DateUtil.toTimeString(date, true)).toBe('23:59:59');
            });

            it('handles null input', function() {
                expect(DateUtil.toTimeString(null)).toBe('');
            });

        });

        describe('formatTime()', function() {

            it('formats hours and minutes', function() {
                expect(DateUtil.formatTime(14, 30)).toBe('14:30');
            });

            it('pads single-digit hours', function() {
                expect(DateUtil.formatTime(5, 30)).toBe('05:30');
            });

            it('pads single-digit minutes', function() {
                expect(DateUtil.formatTime(14, 5)).toBe('14:05');
            });

            it('handles midnight', function() {
                expect(DateUtil.formatTime(0, 0)).toBe('00:00');
            });

        });

        describe('format()', function() {

            it('formats with default options', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.format(date);
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            });

            it('respects custom options', function() {
                var date = new Date(2025, 0, 15);
                var result = DateUtil.format(date, { month: 'long', day: 'numeric', year: 'numeric' }, 'en-US');
                expect(result).toContain('January');
                expect(result).toContain('15');
                expect(result).toContain('2025');
            });

            it('respects locale parameter', function() {
                var date = new Date(2025, 0, 15);
                var enResult = DateUtil.format(date, { month: 'long' }, 'en-US');
                var deResult = DateUtil.format(date, { month: 'long' }, 'de-DE');

                expect(enResult).toBe('January');
                expect(deResult).toBe('Januar');
            });

            it('returns empty string for null input', function() {
                expect(DateUtil.format(null)).toBe('');
            });

        });

    });

    // =========================================================================
    // PARSING METHODS
    // =========================================================================

    describe('Parsing Methods', function() {

        describe('parse()', function() {

            it('parses Date object (returns clone)', function() {
                var original = new Date(2025, 0, 15, 10, 30);
                var result = DateUtil.parse(original);

                expect(result.getTime()).toBe(original.getTime());
                expect(result).not.toBe(original);
            });

            it('parses ISO date string', function() {
                var result = DateUtil.parse('2025-01-15');
                expect(result.getFullYear()).toBe(2025);
                expect(result.getMonth()).toBe(0);
                expect(result.getDate()).toBe(15);
            });

            it('parses ISO datetime string', function() {
                var result = DateUtil.parse('2025-01-15T10:30:00');
                expect(result.getFullYear()).toBe(2025);
                expect(result.getHours()).toBe(10);
                expect(result.getMinutes()).toBe(30);
            });

            it('parses timestamp in milliseconds', function() {
                var timestamp = new Date(2025, 0, 15, 10, 30).getTime();
                var result = DateUtil.parse(timestamp);
                expect(result.getFullYear()).toBe(2025);
                expect(result.getMonth()).toBe(0);
                expect(result.getDate()).toBe(15);
            });

            it('parses timestamp in seconds (auto-detect)', function() {
                var seconds = Math.floor(new Date(2025, 0, 15).getTime() / 1000);
                var result = DateUtil.parse(seconds);
                expect(result.getFullYear()).toBe(2025);
                expect(result.getMonth()).toBe(0);
                expect(result.getDate()).toBe(15);
            });

            it('returns null for invalid input', function() {
                expect(DateUtil.parse('invalid')).toBe(null);
                expect(DateUtil.parse('not-a-date')).toBe(null);
            });

            it('returns null for null input', function() {
                expect(DateUtil.parse(null)).toBe(null);
            });

            it('returns null for undefined input', function() {
                expect(DateUtil.parse(undefined)).toBe(null);
            });

            it('returns null for empty string', function() {
                expect(DateUtil.parse('')).toBe(null);
            });

        });

    });

    // =========================================================================
    // LOCALIZED NAMES
    // =========================================================================

    describe('Localized Names', function() {

        describe('getDayNames()', function() {

            it('returns 7 day names', function() {
                var names = DateUtil.getDayNames('en-US', 'short', 0);
                expect(names.length).toBe(7);
            });

            it('respects locale (en-US)', function() {
                var names = DateUtil.getDayNames('en-US', 'long', 0);
                expect(names).toContain('Sunday');
                expect(names).toContain('Monday');
            });

            it('respects format narrow', function() {
                var names = DateUtil.getDayNames('en-US', 'narrow', 0);
                expect(names[0]).toBe('S'); // Sunday
            });

            it('respects format short', function() {
                var names = DateUtil.getDayNames('en-US', 'short', 0);
                expect(names[0]).toBe('Sun');
            });

            it('respects format long', function() {
                var names = DateUtil.getDayNames('en-US', 'long', 0);
                expect(names[0]).toBe('Sunday');
            });

            it('respects weekStarts=0 (Sunday first)', function() {
                var names = DateUtil.getDayNames('en-US', 'short', 0);
                expect(names[0]).toBe('Sun');
                expect(names[6]).toBe('Sat');
            });

            it('respects weekStarts=1 (Monday first)', function() {
                var names = DateUtil.getDayNames('en-US', 'short', 1);
                expect(names[0]).toBe('Mon');
                expect(names[6]).toBe('Sun');
            });

            it('defaults work correctly', function() {
                var names = DateUtil.getDayNames();
                expect(names.length).toBe(7);
                expect(names[0]).toBe('Sun');
            });

        });

        describe('getMonthNames()', function() {

            it('returns 12 month names', function() {
                var names = DateUtil.getMonthNames('en-US', 'long');
                expect(names.length).toBe(12);
            });

            it('respects locale (en-US)', function() {
                var names = DateUtil.getMonthNames('en-US', 'long');
                expect(names[0]).toBe('January');
                expect(names[11]).toBe('December');
            });

            it('respects format narrow', function() {
                var names = DateUtil.getMonthNames('en-US', 'narrow');
                expect(names[0]).toBe('J'); // January
            });

            it('respects format short', function() {
                var names = DateUtil.getMonthNames('en-US', 'short');
                expect(names[0]).toBe('Jan');
            });

            it('respects format long', function() {
                var names = DateUtil.getMonthNames('en-US', 'long');
                expect(names[0]).toBe('January');
            });

            it('defaults work correctly', function() {
                var names = DateUtil.getMonthNames();
                expect(names.length).toBe(12);
                expect(names[0]).toBe('January');
            });

        });

    });

    // =========================================================================
    // WEEK NUMBERS
    // =========================================================================

    describe('Week Numbers', function() {

        describe('getWeekNumber()', function() {

            it('returns value between 1 and 53', function() {
                var date = new Date(2025, 0, 15);
                var weekNum = DateUtil.getWeekNumber(date);
                expect(weekNum).toBeGreaterThanOrEqual(1);
                expect(weekNum).toBeLessThanOrEqual(53);
            });

            it('returns 1 for first week of year', function() {
                // January 1, 2025 is in week 1
                var date = new Date(2025, 0, 1);
                var weekNum = DateUtil.getWeekNumber(date);
                expect(weekNum).toBe(1);
            });

            it('calculates mid-year week correctly', function() {
                // June 15, 2025
                var date = new Date(2025, 5, 15);
                var weekNum = DateUtil.getWeekNumber(date);
                expect(weekNum).toBeGreaterThan(20);
                expect(weekNum).toBeLessThan(30);
            });

            it('calculates year-end week correctly', function() {
                var date = new Date(2025, 11, 31);
                var weekNum = DateUtil.getWeekNumber(date);
                expect(weekNum === 1 || weekNum >= 52).toBe(true);
            });

            it('handles year boundary weeks', function() {
                // December 31, 2024 might be in week 1 of 2025
                var date = new Date(2024, 11, 31);
                var weekNum = DateUtil.getWeekNumber(date);
                expect(weekNum >= 1).toBe(true);
            });

            it('returns 0 for null input', function() {
                expect(DateUtil.getWeekNumber(null)).toBe(0);
            });

        });

        describe('getWeeksInYear()', function() {

            it('returns 52 for most years', function() {
                // 2025 has 52 weeks
                expect(DateUtil.getWeeksInYear(2025)).toBe(52);
            });

            it('returns 53 for years with 53 weeks', function() {
                // 2020 had 53 weeks
                expect(DateUtil.getWeeksInYear(2020)).toBe(53);
            });

            it('returns value between 52 and 53', function() {
                for (var year = 2020; year <= 2030; year++) {
                    var weeks = DateUtil.getWeeksInYear(year);
                    expect(weeks === 52 || weeks === 53).toBe(true);
                }
            });

        });

    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error Handling', function() {

        it('all comparison methods handle null gracefully', function() {
            expect(function() { DateUtil.isSameDay(null, null); }).not.toThrow();
            expect(function() { DateUtil.isToday(null); }).not.toThrow();
            expect(function() { DateUtil.isSameMonth(null, null); }).not.toThrow();
            expect(function() { DateUtil.isWeekend(null); }).not.toThrow();
            expect(function() { DateUtil.isBefore(null, null); }).not.toThrow();
            expect(function() { DateUtil.isAfter(null, null); }).not.toThrow();
            expect(function() { DateUtil.isInRange(null, null, null); }).not.toThrow();
            expect(function() { DateUtil.compare(null, null); }).not.toThrow();
        });

        it('all boundary methods handle null gracefully', function() {
            expect(function() { DateUtil.startOfDay(null); }).not.toThrow();
            expect(function() { DateUtil.endOfDay(null); }).not.toThrow();
            expect(function() { DateUtil.startOfMonth(null); }).not.toThrow();
            expect(function() { DateUtil.endOfMonth(null); }).not.toThrow();
            expect(function() { DateUtil.startOfWeek(null); }).not.toThrow();
            expect(function() { DateUtil.endOfWeek(null); }).not.toThrow();
        });

        it('all arithmetic methods handle null gracefully', function() {
            expect(function() { DateUtil.addDays(null, 5); }).not.toThrow();
            expect(function() { DateUtil.addMonths(null, 5); }).not.toThrow();
            expect(function() { DateUtil.addYears(null, 5); }).not.toThrow();
            expect(function() { DateUtil.daysInMonth(null); }).not.toThrow();
            expect(function() { DateUtil.clone(null); }).not.toThrow();
        });

        it('all grid methods handle null gracefully', function() {
            expect(function() { DateUtil.generateMonthGrid(null); }).not.toThrow();
            expect(function() { DateUtil.generateWeekGrid(null); }).not.toThrow();
            expect(function() { DateUtil.generateDayGrid(null); }).not.toThrow();
            expect(function() { DateUtil.getViewRange(null); }).not.toThrow();
        });

        it('all formatting methods handle null gracefully', function() {
            expect(function() { DateUtil.toDateString(null); }).not.toThrow();
            expect(function() { DateUtil.toTimeString(null); }).not.toThrow();
            expect(function() { DateUtil.format(null); }).not.toThrow();
        });

        it('parse handles null gracefully', function() {
            expect(function() { DateUtil.parse(null); }).not.toThrow();
        });

        it('getWeekNumber handles null gracefully', function() {
            expect(function() { DateUtil.getWeekNumber(null); }).not.toThrow();
        });

    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    describe('Edge Cases', function() {

        it('handles year 2000 (Y2K)', function() {
            var date = new Date(2000, 0, 1);
            expect(DateUtil.toDateString(date)).toBe('2000-01-01');
        });

        it('handles year 1970 (Unix epoch)', function() {
            var date = new Date(1970, 0, 1);
            expect(DateUtil.toDateString(date)).toBe('1970-01-01');
        });

        it('handles far future dates', function() {
            var date = new Date(2100, 11, 31);
            expect(DateUtil.toDateString(date)).toBe('2100-12-31');
        });

        it('handles leap year February 29', function() {
            var leapDay = new Date(2024, 1, 29);
            expect(DateUtil.daysInMonth(leapDay)).toBe(29);
            expect(DateUtil.toDateString(leapDay)).toBe('2024-02-29');
        });

        it('handles DST transitions', function() {
            // March 9, 2025 - DST starts in US
            var dstStart = new Date(2025, 2, 9);
            var result = DateUtil.addDays(dstStart, 1);
            expect(result.getDate()).toBe(10);
        });

        it('handles very large day additions', function() {
            var date = new Date(2025, 0, 1);
            var result = DateUtil.addDays(date, 365);
            expect(result.getFullYear()).toBe(2026);
        });

        it('handles very large month additions', function() {
            var date = new Date(2025, 0, 15);
            var result = DateUtil.addMonths(date, 24);
            expect(result.getFullYear()).toBe(2027);
            expect(result.getMonth()).toBe(0);
        });

        it('handles negative timestamp', function() {
            // Before Unix epoch
            var result = DateUtil.parse(-86400000);
            expect(result.getFullYear()).toBe(1969);
        });

    });

    // =========================================================================
    // IMMUTABILITY
    // =========================================================================

    describe('Immutability', function() {

        it('startOfDay does not mutate input', function() {
            var date = new Date(2025, 0, 15, 14, 30);
            var original = date.getTime();
            DateUtil.startOfDay(date);
            expect(date.getTime()).toBe(original);
        });

        it('endOfDay does not mutate input', function() {
            var date = new Date(2025, 0, 15, 14, 30);
            var original = date.getTime();
            DateUtil.endOfDay(date);
            expect(date.getTime()).toBe(original);
        });

        it('startOfMonth does not mutate input', function() {
            var date = new Date(2025, 0, 15, 14, 30);
            var original = date.getTime();
            DateUtil.startOfMonth(date);
            expect(date.getTime()).toBe(original);
        });

        it('endOfMonth does not mutate input', function() {
            var date = new Date(2025, 0, 15, 14, 30);
            var original = date.getTime();
            DateUtil.endOfMonth(date);
            expect(date.getTime()).toBe(original);
        });

        it('startOfWeek does not mutate input', function() {
            var date = new Date(2025, 0, 15, 14, 30);
            var original = date.getTime();
            DateUtil.startOfWeek(date);
            expect(date.getTime()).toBe(original);
        });

        it('endOfWeek does not mutate input', function() {
            var date = new Date(2025, 0, 15, 14, 30);
            var original = date.getTime();
            DateUtil.endOfWeek(date);
            expect(date.getTime()).toBe(original);
        });

        it('addDays does not mutate input', function() {
            var date = new Date(2025, 0, 15);
            var original = date.getTime();
            DateUtil.addDays(date, 10);
            expect(date.getTime()).toBe(original);
        });

        it('addMonths does not mutate input', function() {
            var date = new Date(2025, 0, 15);
            var original = date.getTime();
            DateUtil.addMonths(date, 3);
            expect(date.getTime()).toBe(original);
        });

        it('addYears does not mutate input', function() {
            var date = new Date(2025, 0, 15);
            var original = date.getTime();
            DateUtil.addYears(date, 2);
            expect(date.getTime()).toBe(original);
        });

        it('clone does not share reference', function() {
            var date = new Date(2025, 0, 15);
            var cloned = DateUtil.clone(date);
            cloned.setDate(20);
            expect(date.getDate()).toBe(15);
        });

    });

});
