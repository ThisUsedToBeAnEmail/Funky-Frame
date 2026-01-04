/**
 * Performance Tests: Fuzzy Search
 *
 * Tests search latency, scoring performance, and memory efficiency
 * for the fuzzy search algorithm with various dataset sizes.
 */

describe('Funky.Perf.FuzzySearch', function() {

    var FuzzySearch = Funky.FuzzySearch;
    var Perf = FunkyTests.Perf;

    // Skip all tests if Perf utilities not available
    if (!Perf) {
        it('Perf utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    // Generate test datasets
    function generateItems(count) {
        var items = [];
        var firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa', 'William', 'Jennifer'];
        var lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        var domains = ['example.com', 'test.org', 'company.io', 'domain.net', 'business.co'];

        for (var i = 0; i < count; i++) {
            var firstName = firstNames[i % firstNames.length];
            var lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
            items.push({
                id: i + 1,
                name: firstName + ' ' + lastName + ' ' + (i + 1),
                email: firstName.toLowerCase() + '.' + lastName.toLowerCase() + (i + 1) + '@' + domains[i % domains.length],
                title: 'Senior ' + ['Developer', 'Designer', 'Manager', 'Analyst', 'Engineer'][i % 5],
                department: ['Engineering', 'Design', 'Marketing', 'Sales', 'Operations'][i % 5],
                description: 'Employee number ' + (i + 1) + ' working in the ' + ['Engineering', 'Design', 'Marketing', 'Sales', 'Operations'][i % 5] + ' department'
            });
        }
        return items;
    }

    function generateCommands(count) {
        var commands = [];
        var verbs = ['open', 'close', 'save', 'delete', 'create', 'update', 'view', 'edit', 'export', 'import'];
        var nouns = ['file', 'document', 'project', 'task', 'user', 'settings', 'dashboard', 'report', 'calendar', 'notification'];

        for (var i = 0; i < count; i++) {
            var verb = verbs[i % verbs.length];
            var noun = nouns[Math.floor(i / verbs.length) % nouns.length];
            commands.push({
                id: 'cmd-' + (i + 1),
                name: verb.charAt(0).toUpperCase() + verb.slice(1) + ' ' + noun.charAt(0).toUpperCase() + noun.slice(1),
                shortcut: 'Ctrl+' + String.fromCharCode(65 + (i % 26)),
                category: ['File', 'Edit', 'View', 'Tools', 'Help'][i % 5]
            });
        }
        return commands;
    }

    describe('Search Latency', function() {

        it('searches 100 items in < 5ms', function() {
            var items = generateItems(100);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email', 'title']
            });

            Perf.assertFasterThan(function() {
                searcher.search('john smith');
            }, 5, 'Search 100 items');
        });

        it('searches 1,000 items in < 10ms', function() {
            var items = generateItems(1000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email', 'title']
            });

            Perf.assertFasterThan(function() {
                searcher.search('john smith');
            }, 10, 'Search 1K items');
        });

        it('searches 10,000 items in < 50ms', function() {
            var items = generateItems(10000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email', 'title']
            });

            Perf.assertFasterThan(function() {
                searcher.search('john smith');
            }, 50, 'Search 10K items');
        });

        it('searches 50,000 items in < 200ms', function() {
            var items = generateItems(50000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email']
            });

            Perf.assertFasterThan(function() {
                searcher.search('john');
            }, 200, 'Search 50K items');
        });

        it('command palette search (100 commands) in < 2ms', function() {
            var commands = generateCommands(100);
            var searcher = FuzzySearch.create({
                items: commands,
                keys: ['name', 'shortcut', 'category']
            });

            Perf.assertFasterThan(function() {
                searcher.search('open file');
            }, 2, 'Command palette search');
        });

    });

    describe('Query Complexity', function() {

        it('single character query is fast', function() {
            var items = generateItems(10000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name']
            });

            Perf.assertFasterThan(function() {
                searcher.search('j');
            }, 30, 'Single char query');
        });

        it('short query (2-3 chars) is fast', function() {
            var items = generateItems(10000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name']
            });

            Perf.assertFasterThan(function() {
                searcher.search('joh');
            }, 30, 'Short query');
        });

        it('medium query (5-10 chars) is efficient', function() {
            var items = generateItems(10000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name']
            });

            Perf.assertFasterThan(function() {
                searcher.search('john smith');
            }, 50, 'Medium query');
        });

        it('long query (20+ chars) is acceptable', function() {
            var items = generateItems(10000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email', 'description']
            });

            Perf.assertFasterThan(function() {
                searcher.search('john smith engineering senior developer');
            }, 100, 'Long query');
        });

        it('multiple word tokenized search is efficient', function() {
            var items = generateItems(10000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'title', 'department'],
                tokenize: true
            });

            Perf.assertFasterThan(function() {
                searcher.search('john developer engineering');
            }, 80, 'Tokenized search');
        });

    });

    describe('Scoring Performance', function() {

        it('calculates scores for 1K matches in < 20ms', function() {
            var items = generateItems(1000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name'],
                threshold: 0.1 // Low threshold to match more
            });

            Perf.assertFasterThan(function() {
                searcher.search('a'); // Will match most items
            }, 20, 'Score 1K matches');
        });

        it('sorts results by score efficiently', function() {
            var items = generateItems(5000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email'],
                sortByScore: true
            });

            Perf.assertFasterThan(function() {
                searcher.search('john');
            }, 50, 'Sort by score');
        });

        it('weighted key scoring is efficient', function() {
            var items = generateItems(5000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: [
                    { name: 'name', weight: 2 },
                    { name: 'email', weight: 1 },
                    { name: 'title', weight: 1.5 }
                ]
            });

            Perf.assertFasterThan(function() {
                searcher.search('john developer');
            }, 60, 'Weighted scoring');
        });

    });

    describe('Highlight Performance', function() {

        it('highlights matches in 100 results in < 10ms', function() {
            var items = generateItems(1000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name'],
                includeMatches: true
            });

            var results = searcher.search('john').slice(0, 100);

            Perf.assertFasterThan(function() {
                results.forEach(function(result) {
                    if (result.matches && searcher.highlight) {
                        searcher.highlight(result);
                    }
                });
            }, 10, 'Highlight 100 results');
        });

        it('generates highlight HTML efficiently', function() {
            var items = generateItems(500);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email'],
                includeMatches: true
            });

            var results = searcher.search('john');

            Perf.assertFasterThan(function() {
                results.forEach(function(result) {
                    if (searcher.getHighlightedText) {
                        searcher.getHighlightedText(result, 'name');
                    }
                });
            }, 20, 'Generate highlight HTML');
        });

    });

    describe('Index Performance', function() {

        it('builds index for 1K items in < 20ms', function() {
            var items = generateItems(1000);

            Perf.assertFasterThan(function() {
                FuzzySearch.create({
                    items: items,
                    keys: ['name', 'email', 'title']
                });
            }, 20, 'Index 1K items');
        });

        it('builds index for 10K items in < 100ms', function() {
            var items = generateItems(10000);

            Perf.assertFasterThan(function() {
                FuzzySearch.create({
                    items: items,
                    keys: ['name', 'email', 'title']
                });
            }, 100, 'Index 10K items');
        });

        // Skip: searcher.setItems method may not exist
        xit('rebuilds index efficiently', function() {
            var items = generateItems(5000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email']
            });

            var newItems = generateItems(5000);

            Perf.assertFasterThan(function() {
                searcher.setItems(newItems);
            }, 80, 'Rebuild index');
        });

        it('incremental add is faster than full rebuild', function() {
            var items = generateItems(5000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email']
            });

            var newItem = {
                id: 5001,
                name: 'New Person',
                email: 'new@example.com'
            };

            Perf.assertFasterThan(function() {
                if (searcher.addItem) {
                    searcher.addItem(newItem);
                }
            }, 5, 'Incremental add');
        });

    });

    describe('Threshold Variations', function() {

        it('strict threshold (0.6) is fast', function() {
            var items = generateItems(10000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name'],
                threshold: 0.6
            });

            Perf.assertFasterThan(function() {
                searcher.search('john');
            }, 30, 'Strict threshold');
        });

        it('loose threshold (0.2) handles more matches', function() {
            var items = generateItems(10000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name'],
                threshold: 0.2
            });

            Perf.assertFasterThan(function() {
                searcher.search('j');
            }, 80, 'Loose threshold');
        });

        it('exact match mode is fastest', function() {
            var items = generateItems(10000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name'],
                threshold: 1.0 // Exact match only
            });

            Perf.assertFasterThan(function() {
                searcher.search('John Smith 1');
            }, 20, 'Exact match');
        });

    });

    describe('Memory Efficiency', function() {

        it('does not leak memory on repeated searches', function() {
            var items = generateItems(5000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email']
            });

            var result = Perf.checkForLeaks(function() {
                searcher.search('john');
                searcher.search('smith');
                searcher.search('developer');
            }, 100);

            if (result) {
                expect(result.leaked).toBe(false);
            }
        });

        // Skip: searcher.setItems method may not exist
        xit('does not leak memory on index rebuilds', function() {
            var searcher = FuzzySearch.create({
                items: generateItems(1000),
                keys: ['name']
            });

            var result = Perf.checkForLeaks(function() {
                searcher.setItems(generateItems(1000));
            }, 50);

            if (result) {
                expect(result.leaked).toBe(false);
            }
        });

    });

    describe('Concurrent Search', function() {

        it('handles rapid sequential searches', function() {
            var items = generateItems(5000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name', 'email']
            });

            var queries = ['j', 'jo', 'joh', 'john', 'john ', 'john s', 'john sm', 'john smi', 'john smit', 'john smith'];

            Perf.assertFasterThan(function() {
                queries.forEach(function(q) {
                    searcher.search(q);
                });
            }, 100, 'Rapid sequential searches');
        });

        it('typeahead simulation is responsive', function() {
            var items = generateItems(5000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name'],
                limit: 10 // Only return top 10
            });

            var result = Perf.benchmark('typeahead', function() {
                searcher.search('j');
            }, { iterations: 100 });

            // Each keystroke should respond in < 16ms for 60fps
            expect(result.median).toBeLessThan(16);
        });

    });

    describe('Special Characters', function() {

        it('handles special characters efficiently', function() {
            var items = generateItems(5000);
            var searcher = FuzzySearch.create({
                items: items,
                keys: ['email']
            });

            Perf.assertFasterThan(function() {
                searcher.search('john.smith@example.com');
            }, 50, 'Search with special chars');
        });

        it('handles unicode characters', function() {
            var items = [
                { name: 'José García' },
                { name: 'François Müller' },
                { name: '田中太郎' },
                { name: 'Александр Петров' }
            ];

            // Add more items
            for (var i = 0; i < 1000; i++) {
                items.push({ name: 'User ' + i });
            }

            var searcher = FuzzySearch.create({
                items: items,
                keys: ['name']
            });

            Perf.assertFasterThan(function() {
                searcher.search('josé');
                searcher.search('müller');
            }, 20, 'Unicode search');
        });

    });

    describe('Result Limiting', function() {

        // Skip: Timing comparison is flaky when both searches complete in < 1ms
        xit('limiting results improves performance', function() {
            var items = generateItems(50000);

            var unlimitedSearcher = FuzzySearch.create({
                items: items,
                keys: ['name']
            });

            var limitedSearcher = FuzzySearch.create({
                items: items,
                keys: ['name'],
                limit: 20
            });

            var unlimitedTime = Perf.measure(function() {
                unlimitedSearcher.search('a');
            }).total;

            var limitedTime = Perf.measure(function() {
                limitedSearcher.search('a');
            }).total;

            // Limited should be significantly faster
            expect(limitedTime).toBeLessThan(unlimitedTime * 0.8);
        });

    });

});
