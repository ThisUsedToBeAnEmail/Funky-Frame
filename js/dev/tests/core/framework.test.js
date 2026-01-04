/**
 * FunkyTests Framework Self-Tests
 *
 * These tests verify that the test framework itself works correctly.
 */

describe('FunkyTests Framework', function() {

    describe('Basic Assertions', function() {

        it('toBe checks strict equality', function() {
            expect(1).toBe(1);
            expect('hello').toBe('hello');
            expect(true).toBe(true);
            expect(null).toBe(null);
        });

        it('toBe fails for different values', function() {
            expect(1).not.toBe(2);
            expect('hello').not.toBe('world');
            expect(1).not.toBe('1'); // Strict equality
        });

        it('toEqual checks deep equality', function() {
            expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
            expect([1, 2, 3]).toEqual([1, 2, 3]);
            expect({ nested: { value: 'test' } }).toEqual({ nested: { value: 'test' } });
        });

        it('toBeTruthy and toBeFalsy work', function() {
            expect(true).toBeTruthy();
            expect(1).toBeTruthy();
            expect('string').toBeTruthy();
            expect({}).toBeTruthy();

            expect(false).toBeFalsy();
            expect(0).toBeFalsy();
            expect('').toBeFalsy();
            expect(null).toBeFalsy();
            expect(undefined).toBeFalsy();
        });

        it('toBeDefined and toBeUndefined work', function() {
            var defined = 'value';
            var undef;

            expect(defined).toBeDefined();
            expect(undef).toBeUndefined();
            expect(null).toBeDefined(); // null is defined, just null
        });

        it('toBeNull works', function() {
            expect(null).toBeNull();
            expect(undefined).not.toBeNull();
            expect(0).not.toBeNull();
        });

    });

    describe('Number Assertions', function() {

        it('toBeGreaterThan works', function() {
            expect(10).toBeGreaterThan(5);
            expect(0).toBeGreaterThan(-1);
        });

        it('toBeLessThan works', function() {
            expect(5).toBeLessThan(10);
            expect(-1).toBeLessThan(0);
        });

        it('toBeCloseTo works with precision', function() {
            expect(3.14159).toBeCloseTo(3.14, 2);
            expect(0.1 + 0.2).toBeCloseTo(0.3, 5);
        });

    });

    describe('String Assertions', function() {

        it('toContain works for strings', function() {
            expect('hello world').toContain('world');
            expect('hello world').toContain('hello');
            expect('hello world').not.toContain('foo');
        });

        it('toMatch works with regex', function() {
            expect('hello123').toMatch(/\d+/);
            expect('hello@example.com').toMatch(/^.+@.+\..+$/);
        });

        it('toStartWith works', function() {
            expect('hello world').toStartWith('hello');
            expect('hello world').not.toStartWith('world');
        });

        it('toEndWith works', function() {
            expect('hello world').toEndWith('world');
            expect('hello world').not.toEndWith('hello');
        });

    });

    describe('Array Assertions', function() {

        it('toContain works for arrays', function() {
            expect([1, 2, 3]).toContain(2);
            expect(['a', 'b', 'c']).toContain('b');
            expect([1, 2, 3]).not.toContain(4);
        });

        it('toHaveLength works', function() {
            expect([1, 2, 3]).toHaveLength(3);
            expect('hello').toHaveLength(5);
            expect([]).toHaveLength(0);
        });

        it('toBeEmpty works', function() {
            expect([]).toBeEmpty();
            expect('').toBeEmpty();
            expect([1]).not.toBeEmpty();
        });

    });

    describe('Object Assertions', function() {

        it('toHaveProperty checks property existence', function() {
            var obj = { name: 'test', value: 42 };
            expect(obj).toHaveProperty('name');
            expect(obj).toHaveProperty('value');
            expect(obj).not.toHaveProperty('missing');
        });

        it('toHaveProperty checks property value', function() {
            var obj = { name: 'test', value: 42 };
            expect(obj).toHaveProperty('name', 'test');
            expect(obj).toHaveProperty('value', 42);
        });

    });

    describe('Error Assertions', function() {

        it('toThrow catches errors', function() {
            expect(function() {
                throw new Error('test error');
            }).toThrow();
        });

        it('toThrow checks error message', function() {
            expect(function() {
                throw new Error('specific error message');
            }).toThrow('specific error');
        });

        it('toThrow checks error type', function() {
            expect(function() {
                throw new TypeError('type error');
            }).toThrowError(TypeError);
        });

        it('toThrow with regex', function() {
            expect(function() {
                throw new Error('Error code: 404');
            }).toThrow(/\d{3}/);
        });

    });

    describe('Negation', function() {

        it('not.toBe works', function() {
            expect(1).not.toBe(2);
            expect('a').not.toBe('b');
        });

        it('not.toEqual works', function() {
            expect({ a: 1 }).not.toEqual({ a: 2 });
            expect([1, 2]).not.toEqual([1, 2, 3]);
        });

        it('not.toContain works', function() {
            expect([1, 2, 3]).not.toContain(4);
            expect('hello').not.toContain('x');
        });

    });

});

describe('Spies', function() {

    it('spy tracks calls', function() {
        var mySpy = FunkyTests.spy();

        mySpy('arg1', 'arg2');
        mySpy('arg3');

        expect(mySpy).toHaveBeenCalled();
        expect(mySpy).toHaveBeenCalledTimes(2);
    });

    it('spy tracks arguments', function() {
        var mySpy = FunkyTests.spy();

        mySpy('hello', 123);

        expect(mySpy).toHaveBeenCalledWith('hello', 123);
    });

    it('spy.and.returnValue works', function() {
        var mySpy = FunkyTests.spy().and.returnValue(42);

        var result = mySpy();

        expect(result).toBe(42);
    });

    it('spy.and.callFake works', function() {
        var mySpy = FunkyTests.spy().and.callFake(function(x) {
            return x * 2;
        });

        expect(mySpy(5)).toBe(10);
        expect(mySpy(3)).toBe(6);
    });

    it('spy.calls provides call info', function() {
        var mySpy = FunkyTests.spy();

        mySpy('first');
        mySpy('second');
        mySpy('third');

        expect(mySpy.calls.count()).toBe(3);
        expect(mySpy.calls.first()).toEqual(['first']);
        expect(mySpy.calls.mostRecent()).toEqual(['third']);
        expect(mySpy.calls.argsFor(1)).toEqual(['second']);
    });

    it('spyOn replaces object method', function() {
        var obj = {
            method: function() { return 'original'; }
        };

        FunkyTests.spyOn(obj, 'method').and.returnValue('mocked');

        expect(obj.method()).toBe('mocked');
    });

    it('spyOn.and.callThrough calls original', function() {
        var obj = {
            method: function(x) { return x * 2; }
        };

        FunkyTests.spyOn(obj, 'method').and.callThrough();

        expect(obj.method(5)).toBe(10);
        expect(obj.method).toHaveBeenCalledWith(5);
    });

});

describe('Async Tests', function() {

    it('supports done callback', function(done) {
        setTimeout(function() {
            expect(true).toBe(true);
            done();
        }, 10);
    });

    it('supports promises', function() {
        return new Promise(function(resolve) {
            setTimeout(function() {
                expect(1 + 1).toBe(2);
                resolve();
            }, 10);
        });
    });

    it('supports async/await style', function() {
        return FunkyTests.delay(10).then(function() {
            expect(true).toBeTruthy();
        });
    });

});

describe('Hooks', function() {
    var counter = 0;

    beforeEach(function() {
        counter++;
    });

    afterEach(function() {
        // Cleanup could go here
    });

    it('beforeEach runs before first test', function() {
        expect(counter).toBeGreaterThan(0);
    });

    it('beforeEach runs before second test', function() {
        expect(counter).toBeGreaterThan(1);
    });

});

describe('Test Fixtures', function() {

    it('creates and destroys fixtures', function() {
        var fixture = FunkyTests.fixture('<div id="test-div"><span>Hello</span></div>');

        expect(fixture.el).toBeInDocument();
        expect(fixture.query('#test-div')).toBeDefined();
        expect(fixture.query('span').textContent).toBe('Hello');

        fixture.destroy();

        expect(document.getElementById('test-div')).toBeNull();
    });

});

describe('DOM Assertions', function() {

    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="dom-test">' +
                '<button class="btn primary" disabled>Click Me</button>' +
                '<input type="text" value="hello">' +
                '<div style="display: none;">Hidden</div>' +
            '</div>'
        );
    });

    afterEach(function() {
        fixture.destroy();
    });

    it('toBeInDocument works', function() {
        expect(fixture.el).toBeInDocument();
        expect(fixture.query('button')).toBeInDocument();
    });

    it('toHaveClass works', function() {
        var btn = fixture.query('button');
        expect(btn).toHaveClass('btn');
        expect(btn).toHaveClass('primary');
        expect(btn).not.toHaveClass('secondary');
    });

    it('toHaveAttribute works', function() {
        var btn = fixture.query('button');
        expect(btn).toHaveAttribute('disabled');
        expect(btn).not.toHaveAttribute('hidden');
    });

    it('toHaveAttribute checks value', function() {
        var input = fixture.query('input');
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('value', 'hello');
    });

    it('toHaveText works', function() {
        var btn = fixture.query('button');
        expect(btn).toHaveText('Click Me');
    });

    it('toBeVisible and toBeHidden work', function() {
        var btn = fixture.query('button');
        var hidden = fixture.query('#dom-test > div');

        expect(btn).toBeVisible();
        expect(hidden).toBeHidden();
    });

});

describe('Event Simulation', function() {

    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="event-test">' +
                '<button id="click-btn">Click</button>' +
                '<input type="text" id="text-input">' +
            '</div>'
        );
    });

    afterEach(function() {
        fixture.destroy();
    });

    it('simulate.click triggers click handler', function() {
        var clicked = false;
        var btn = fixture.query('#click-btn');

        btn.addEventListener('click', function() {
            clicked = true;
        });

        FunkyTests.simulate.click(btn);

        expect(clicked).toBe(true);
    });

    it('simulate.input sets value and triggers events', function() {
        var inputFired = false;
        var input = fixture.query('#text-input');

        input.addEventListener('input', function() {
            inputFired = true;
        });

        FunkyTests.simulate.input(input, 'new value');

        expect(input.value).toBe('new value');
        expect(inputFired).toBe(true);
    });

    it('simulate.keydown triggers key event', function() {
        var keyPressed = null;
        var btn = fixture.query('#click-btn');

        btn.addEventListener('keydown', function(e) {
            keyPressed = e.key;
        });

        FunkyTests.simulate.keydown(btn, { key: 'Enter' });

        expect(keyPressed).toBe('Enter');
    });

});

describe('waitFor', function() {

    it('resolves when element appears', function() {
        var fixture = FunkyTests.fixture('<div id="wait-container"></div>');
        var container = fixture.query('#wait-container');

        // Add element after delay
        setTimeout(function() {
            container.innerHTML = '<span id="delayed">Appeared!</span>';
        }, 50);

        return FunkyTests.waitFor('#delayed').then(function(el) {
            expect(el).toBeInDocument();
            expect(el.textContent).toBe('Appeared!');
            fixture.destroy();
        });
    });

    it('resolves when condition is true', function() {
        var value = false;

        setTimeout(function() {
            value = true;
        }, 50);

        return FunkyTests.waitFor(function() {
            return value;
        }).then(function(result) {
            expect(result).toBe(true);
        });
    });

});

describe('Fake Timers', function() {

    afterEach(function() {
        FunkyTests.useRealTimers();
    });

    it('useFakeTimers controls setTimeout', function() {
        FunkyTests.useFakeTimers();

        var called = false;
        setTimeout(function() {
            called = true;
        }, 1000);

        expect(called).toBe(false);

        FunkyTests.advanceTimersByTime(500);
        expect(called).toBe(false);

        FunkyTests.advanceTimersByTime(500);
        expect(called).toBe(true);
    });

    it('useFakeTimers controls setInterval', function() {
        FunkyTests.useFakeTimers();

        var count = 0;
        setInterval(function() {
            count++;
        }, 100);

        FunkyTests.advanceTimersByTime(350);
        expect(count).toBe(3);
    });

    it('clearTimeout works with fake timers', function() {
        FunkyTests.useFakeTimers();

        var called = false;
        var id = setTimeout(function() {
            called = true;
        }, 100);

        clearTimeout(id);
        FunkyTests.advanceTimersByTime(200);

        expect(called).toBe(false);
    });

});

describe('Skipped Tests', function() {

    xit('this test is skipped', function() {
        // This should not run
        expect(true).toBe(false);
    });

    it('this test runs normally', function() {
        expect(true).toBe(true);
    });

});
