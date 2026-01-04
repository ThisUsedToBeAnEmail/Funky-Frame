/**
 * Demo test suite for the assertion details tour
 * This test is specifically designed to showcase the assertion details feature
 * @tour assertion-details
 */
describe('Demo: Assertion Details', function() {

    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="demo-container">' +
                '<button id="demo-btn" class="btn">Click Me</button>' +
                '<input type="text" id="demo-input" value="hello">' +
                '<ul id="demo-list">' +
                    '<li class="item">Item 1</li>' +
                    '<li class="item">Item 2</li>' +
                    '<li class="item">Item 3</li>' +
                '</ul>' +
            '</div>'
        );
    });

    afterEach(function() {
        fixture.destroy();
    });

    it('demo assertion details', function() {
        // DOM assertions
        var btn = document.getElementById('demo-btn');
        expect(btn).toBeInDocument();
        expect(btn).toHaveClass('btn');
        expect(btn).toHaveText('Click Me');

        // Value assertions
        var input = document.getElementById('demo-input');
        expect(input.value).toBe('hello');
        expect(input.value).toContain('ell');

        // Array/collection assertions
        var items = document.querySelectorAll('.item');
        expect(items).toHaveLength(3);
    });

});
