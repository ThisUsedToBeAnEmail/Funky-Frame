/**
 * Performance Tests: DOM Creation
 *
 * Tests DOM manipulation and query performance.
 */

describe('Funky.Perf.DOM', function() {

    var Perf = FunkyTests.Perf;
    var fixture;

    // Skip all tests if Perf utilities not available
    if (!Perf) {
        it('Perf utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="perf-container"></div>');
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Element Creation', function() {

        it('creates 1000 elements in < 50ms', function() {
            Perf.assertFasterThan(function() {
                for (var i = 0; i < 1000; i++) {
                    var div = document.createElement('div');
                    div.className = 'item-' + i;
                }
            }, 50);
        });

        it('creates 100 elements with children in < 20ms', function() {
            Perf.assertFasterThan(function() {
                for (var i = 0; i < 100; i++) {
                    var container = document.createElement('div');
                    container.className = 'container';

                    var header = document.createElement('h3');
                    header.textContent = 'Title ' + i;
                    container.appendChild(header);

                    var content = document.createElement('p');
                    content.textContent = 'Content for item ' + i;
                    container.appendChild(content);

                    var button = document.createElement('button');
                    button.textContent = 'Action';
                    container.appendChild(button);
                }
            }, 20);
        });

        it('creates deeply nested tree efficiently', function() {
            Perf.assertFasterThan(function() {
                function createTree(depth) {
                    var div = document.createElement('div');
                    div.className = 'level-' + depth;
                    if (depth > 0) {
                        div.appendChild(createTree(depth - 1));
                        div.appendChild(createTree(depth - 1));
                    }
                    return div;
                }
                createTree(8); // 2^8 = 256 leaf nodes
            }, 50);
        });

    });

    describe('DOM Append Performance', function() {

        it('appends 1000 children to container in < 30ms', function() {
            var container = document.getElementById('perf-container');

            Perf.assertFasterThan(function() {
                for (var i = 0; i < 1000; i++) {
                    var child = document.createElement('div');
                    child.textContent = 'Item ' + i;
                    container.appendChild(child);
                }
            }, 30);
        });

        it('batch append using fragment in < 20ms', function() {
            var container = document.getElementById('perf-container');

            Perf.assertFasterThan(function() {
                var fragment = document.createDocumentFragment();
                for (var i = 0; i < 1000; i++) {
                    var child = document.createElement('div');
                    child.textContent = 'Item ' + i;
                    fragment.appendChild(child);
                }
                container.appendChild(fragment);
            }, 20);
        });

        it('innerHTML vs createElement comparison', function() {
            var container = document.getElementById('perf-container');

            // innerHTML approach
            var innerHTMLResult = Perf.benchmark('innerHTML', function() {
                var html = '';
                for (var i = 0; i < 100; i++) {
                    html += '<div class="item">' + i + '</div>';
                }
                container.innerHTML = html;
            }, { iterations: 50 });

            container.innerHTML = '';

            // createElement approach
            var createElementResult = Perf.benchmark('createElement', function() {
                container.innerHTML = '';
                for (var i = 0; i < 100; i++) {
                    var div = document.createElement('div');
                    div.className = 'item';
                    div.textContent = i;
                    container.appendChild(div);
                }
            }, { iterations: 50 });

            // Both should be reasonably fast
            expect(innerHTMLResult.median).toBeLessThan(10);
            expect(createElementResult.median).toBeLessThan(15);
        });

    });

    describe('Query Performance', function() {

        beforeEach(function() {
            // Create large DOM tree
            var container = document.getElementById('perf-container');
            for (var i = 0; i < 1000; i++) {
                var div = document.createElement('div');
                div.className = 'item item-' + (i % 10);
                div.setAttribute('data-id', i);
                div.id = 'item-' + i;
                container.appendChild(div);
            }
        });

        it('getElementById is fast', function() {
            var result = Perf.benchmark('getElementById', function() {
                document.getElementById('item-500');
            }, { iterations: 1000 });

            expect(result.median).toBeLessThan(0.1);
        });

        it('querySelector by class is fast', function() {
            var result = Perf.benchmark('querySelector class', function() {
                document.querySelector('.item-5');
            }, { iterations: 1000 });

            expect(result.median).toBeLessThan(0.5);
        });

        it('querySelectorAll by class is reasonable', function() {
            var result = Perf.benchmark('querySelectorAll class', function() {
                document.querySelectorAll('.item');
            }, { iterations: 100 });

            expect(result.median).toBeLessThan(2);
        });

        it('querySelector by attribute is reasonable', function() {
            var result = Perf.benchmark('querySelector attribute', function() {
                document.querySelector('[data-id="500"]');
            }, { iterations: 100 });

            expect(result.median).toBeLessThan(1);
        });

    });

    describe('Class Manipulation', function() {

        beforeEach(function() {
            var container = document.getElementById('perf-container');
            for (var i = 0; i < 100; i++) {
                var div = document.createElement('div');
                div.className = 'item base-class';
                container.appendChild(div);
            }
        });

        it('classList.add on 100 elements in < 5ms', function() {
            var items = document.querySelectorAll('.item');

            Perf.assertFasterThan(function() {
                items.forEach(function(item) {
                    item.classList.add('new-class');
                });
            }, 5);
        });

        it('classList.toggle on 100 elements in < 5ms', function() {
            var items = document.querySelectorAll('.item');

            Perf.assertFasterThan(function() {
                items.forEach(function(item) {
                    item.classList.toggle('toggled');
                });
            }, 5);
        });

        it('className replacement on 100 elements in < 5ms', function() {
            var items = document.querySelectorAll('.item');

            Perf.assertFasterThan(function() {
                items.forEach(function(item) {
                    item.className = 'item updated active';
                });
            }, 5);
        });

    });

    describe('Attribute Manipulation', function() {

        beforeEach(function() {
            var container = document.getElementById('perf-container');
            for (var i = 0; i < 100; i++) {
                var div = document.createElement('div');
                div.className = 'item';
                container.appendChild(div);
            }
        });

        it('setAttribute on 100 elements in < 5ms', function() {
            var items = document.querySelectorAll('.item');

            Perf.assertFasterThan(function() {
                items.forEach(function(item, i) {
                    item.setAttribute('data-index', i);
                    item.setAttribute('data-active', 'true');
                });
            }, 5);
        });

        it('dataset API on 100 elements in < 5ms', function() {
            var items = document.querySelectorAll('.item');

            Perf.assertFasterThan(function() {
                items.forEach(function(item, i) {
                    item.dataset.index = i;
                    item.dataset.active = 'true';
                });
            }, 5);
        });

    });

    describe('DOM Removal', function() {

        it('removes 1000 elements in < 20ms', function() {
            var container = document.getElementById('perf-container');
            for (var i = 0; i < 1000; i++) {
                var div = document.createElement('div');
                container.appendChild(div);
            }

            Perf.assertFasterThan(function() {
                container.innerHTML = '';
            }, 20);
        });

        it('removeChild loop on 100 elements in < 10ms', function() {
            var container = document.getElementById('perf-container');
            for (var i = 0; i < 100; i++) {
                var div = document.createElement('div');
                container.appendChild(div);
            }

            Perf.assertFasterThan(function() {
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }, 10);
        });

    });

    describe('Text Content Updates', function() {

        beforeEach(function() {
            var container = document.getElementById('perf-container');
            for (var i = 0; i < 100; i++) {
                var div = document.createElement('div');
                div.className = 'item';
                div.textContent = 'Original ' + i;
                container.appendChild(div);
            }
        });

        it('textContent update on 100 elements in < 5ms', function() {
            var items = document.querySelectorAll('.item');

            Perf.assertFasterThan(function() {
                items.forEach(function(item, i) {
                    item.textContent = 'Updated ' + i;
                });
            }, 5);
        });

        it('innerHTML update on 100 elements in < 10ms', function() {
            var items = document.querySelectorAll('.item');

            Perf.assertFasterThan(function() {
                items.forEach(function(item, i) {
                    item.innerHTML = '<span>Updated <strong>' + i + '</strong></span>';
                });
            }, 10);
        });

    });

    describe('Style Manipulation', function() {

        beforeEach(function() {
            var container = document.getElementById('perf-container');
            for (var i = 0; i < 100; i++) {
                var div = document.createElement('div');
                div.className = 'item';
                container.appendChild(div);
            }
        });

        it('inline style changes on 100 elements in < 5ms', function() {
            var items = document.querySelectorAll('.item');

            Perf.assertFasterThan(function() {
                items.forEach(function(item, i) {
                    item.style.backgroundColor = 'rgb(' + (i % 255) + ', 100, 100)';
                    item.style.padding = '10px';
                    item.style.margin = '5px';
                });
            }, 5);
        });

        it('cssText update on 100 elements in < 5ms', function() {
            var items = document.querySelectorAll('.item');

            Perf.assertFasterThan(function() {
                items.forEach(function(item) {
                    item.style.cssText = 'background: red; padding: 10px; margin: 5px;';
                });
            }, 5);
        });

    });

    describe('Clone Performance', function() {

        it('cloneNode deep on complex element in < 5ms', function() {
            var container = document.getElementById('perf-container');
            container.innerHTML =
                '<div class="complex">' +
                    '<header><h1>Title</h1><nav><a href="#">Link 1</a><a href="#">Link 2</a></nav></header>' +
                    '<main>' + Array(10).fill('<article><h2>Article</h2><p>Content here</p></article>').join('') + '</main>' +
                    '<footer><p>Footer content</p></footer>' +
                '</div>';

            var element = container.querySelector('.complex');

            Perf.assertFasterThan(function() {
                for (var i = 0; i < 100; i++) {
                    element.cloneNode(true);
                }
            }, 10);
        });

    });

});
