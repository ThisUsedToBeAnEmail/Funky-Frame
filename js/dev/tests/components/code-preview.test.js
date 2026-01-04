/**
 * Funky.CodePreview Tests
 */
FunkyTests.describe('Funky.CodePreview', function() {

	var expect = FunkyTests.expect;
	var fixture;

	// =========================================================================
	// MODULE REGISTRATION
	// =========================================================================

	FunkyTests.describe('Module Registration', function() {
		FunkyTests.it('is registered with Funky', function() {
			expect(Funky.isRegistered('CodePreview')).toBe(true);
		});

		FunkyTests.it('exposes public API', function() {
			expect(typeof Funky.CodePreview.create).toBe('function');
			expect(typeof Funky.CodePreview.render).toBe('function');
			expect(typeof Funky.CodePreview.toHTML).toBe('function');
			expect(typeof Funky.CodePreview.highlight).toBe('function');
			expect(typeof Funky.CodePreview.formatSource).toBe('function');
		});
	});

	// =========================================================================
	// RENDERING
	// =========================================================================

	FunkyTests.describe('Rendering', function() {
		var container;

		FunkyTests.beforeEach(function() {
			fixture = FunkyTests.fixture('<div id="test-code-preview"></div>');
			container = fixture.el;  // fixture.el IS the #test-code-preview element
		});

		FunkyTests.afterEach(function() {
			fixture.cleanup();
		});

		FunkyTests.it('renders code into container', function() {
			var code = 'var x = 1;';
			Funky.CodePreview.render(container, code, { language: 'javascript' });

			expect(container.querySelector('.code-preview')).toBeTruthy();
			expect(container.querySelector('.code-preview__code')).toBeTruthy();
			expect(container.textContent).toContain('var x = 1');
		});

		FunkyTests.it('creates instance with create()', function() {
			var instance = Funky.CodePreview.create(container, { language: 'javascript' });
			instance.setCode('var y = 2;');

			expect(container.textContent).toContain('var y = 2');
			expect(typeof instance.setCode).toBe('function');
			expect(typeof instance.destroy).toBe('function');
		});

		FunkyTests.it('shows language label by default', function() {
			Funky.CodePreview.render(container, 'code', { language: 'javascript' });

			var label = container.querySelector('.code-preview__language');
			expect(label).toBeTruthy();
			expect(label.textContent).toBe('JavaScript');
		});

		FunkyTests.it('hides language label when showLanguage is false', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				showLanguage: false
			});

			expect(container.querySelector('.code-preview__language')).toBeFalsy();
		});

		FunkyTests.it('shows copy button by default', function() {
			Funky.CodePreview.render(container, 'code', { language: 'javascript' });

			expect(container.querySelector('.code-preview__copy')).toBeTruthy();
		});

		FunkyTests.it('hides copy button when showCopy is false', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				showCopy: false
			});

			expect(container.querySelector('.code-preview__copy')).toBeFalsy();
		});

		FunkyTests.it('applies custom className', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				className: 'my-custom-class'
			});

			expect(container.querySelector('.code-preview.my-custom-class')).toBeTruthy();
		});

		FunkyTests.it('applies maxHeight style', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				maxHeight: 200
			});

			var body = container.querySelector('.code-preview__body');
			expect(body.style.maxHeight).toBe('200px');
		});

		FunkyTests.it('applies wrapLines class', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				wrapLines: true
			});

			expect(container.querySelector('.code-preview--wrapped')).toBeTruthy();
		});
	});

	// =========================================================================
	// SYNTAX HIGHLIGHTING
	// =========================================================================

	FunkyTests.describe('Syntax Highlighting', function() {
		FunkyTests.it('highlights JavaScript keywords', function() {
			var html = Funky.CodePreview.highlight('function test() { return true; }', 'javascript');

			expect(html).toContain('syntax-keyword');
			expect(html).toContain('>function<');
			expect(html).toContain('>return<');
		});

		FunkyTests.it('highlights JavaScript strings', function() {
			var html = Funky.CodePreview.highlight('var s = "hello";', 'javascript');

			expect(html).toContain('syntax-string');
		});

		FunkyTests.it('highlights JavaScript template strings', function() {
			var html = Funky.CodePreview.highlight('var s = `hello ${name}`;', 'javascript');

			expect(html).toContain('syntax-string');
		});

		FunkyTests.it('highlights JavaScript numbers', function() {
			var html = Funky.CodePreview.highlight('var n = 42;', 'javascript');

			expect(html).toContain('syntax-number');
			expect(html).toContain('>42<');
		});

		FunkyTests.it('highlights JavaScript comments', function() {
			var html = Funky.CodePreview.highlight('// comment\ncode', 'javascript');

			expect(html).toContain('syntax-comment');
		});

		FunkyTests.it('highlights JavaScript multi-line comments', function() {
			var html = Funky.CodePreview.highlight('/* multi\nline */', 'javascript');

			expect(html).toContain('syntax-comment');
		});

		FunkyTests.it('highlights JavaScript built-ins', function() {
			var html = Funky.CodePreview.highlight('return true;', 'javascript');

			expect(html).toContain('syntax-builtin');
			expect(html).toContain('>true<');
		});

		FunkyTests.it('highlights false and null as built-ins', function() {
			var html = Funky.CodePreview.highlight('var a = false; var b = null;', 'javascript');

			expect(html).toContain('syntax-builtin');
		});

		FunkyTests.it('highlights JSON property names', function() {
			var html = Funky.CodePreview.highlight('{"name": "value"}', 'json');

			expect(html).toContain('syntax-property');
		});

		FunkyTests.it('highlights JSON strings', function() {
			var html = Funky.CodePreview.highlight('{"key": "value"}', 'json');

			expect(html).toContain('syntax-string');
		});

		FunkyTests.it('highlights JSON numbers', function() {
			var html = Funky.CodePreview.highlight('{"count": 42}', 'json');

			expect(html).toContain('syntax-number');
		});

		FunkyTests.it('highlights JSON booleans', function() {
			var html = Funky.CodePreview.highlight('{"active": true}', 'json');

			expect(html).toContain('syntax-builtin');
		});

		FunkyTests.it('highlights HTML tags', function() {
			var html = Funky.CodePreview.highlight('<div class="test"></div>', 'html');

			expect(html).toContain('syntax-tag');
		});

		FunkyTests.it('highlights HTML attributes', function() {
			var html = Funky.CodePreview.highlight('<div class="test"></div>', 'html');

			expect(html).toContain('syntax-attribute');
		});

		FunkyTests.it('highlights HTML comments', function() {
			var html = Funky.CodePreview.highlight('<!-- comment -->', 'html');

			expect(html).toContain('syntax-comment');
		});

		// Regression tests for HTML syntax highlighting self-interference bug
		// The attribute regex was matching class= in our own <span class="syntax-*"> tags
		FunkyTests.it('does not produce malformed HTML with self-interference', function() {
			var html = Funky.CodePreview.highlight('<div class="test"></div>', 'html');

			// Should NOT contain malformed tags like <class="syntax-tag">
			expect(html).not.toContain('<class=');
			expect(html).not.toContain('<span class="syntax-attribute">class</span>=<span class="syntax-string">"syntax-tag"</span>');
		});

		FunkyTests.it('handles multiple attributes correctly', function() {
			var html = Funky.CodePreview.highlight('<input type="text" name="email" class="form-control">', 'html');

			// Should have proper structure
			expect(html).toContain('syntax-tag');
			expect(html).toContain('syntax-attribute');
			expect(html).toContain('syntax-string');

			// Should NOT contain malformed output
			expect(html).not.toContain('<class=');
			expect(html).not.toContain('<type=');
			expect(html).not.toContain('<name=');
		});

		FunkyTests.it('handles nested HTML elements', function() {
			var html = Funky.CodePreview.highlight('<div class="outer"><span id="inner">text</span></div>', 'html');

			// Check structure is valid
			expect(html).toContain('syntax-tag');

			// Should NOT have self-interference
			expect(html).not.toContain('<class=');
			expect(html).not.toContain('<id=');
		});

		FunkyTests.it('handles data attributes correctly', function() {
			var html = Funky.CodePreview.highlight('<div data-value="123" data-active="true"></div>', 'html');

			expect(html).toContain('syntax-attribute');
			expect(html).toContain('syntax-string');

			// Should NOT produce malformed output
			expect(html).not.toContain('<data-value=');
			expect(html).not.toContain('<data-active=');
		});

		FunkyTests.it('handles single quoted attributes', function() {
			var html = Funky.CodePreview.highlight("<div class='container'></div>", 'html');

			expect(html).toContain('syntax-attribute');
			expect(html).toContain('syntax-string');

			// Should NOT have self-interference
			expect(html).not.toContain('<class=');
		});

		FunkyTests.it('handles mixed quote styles', function() {
			var html = Funky.CodePreview.highlight('<div class="outer" id=\'inner\'></div>', 'html');

			expect(html).toContain('syntax-attribute');
			expect(html).toContain('syntax-string');

			// Should NOT have self-interference
			expect(html).not.toContain('<class=');
			expect(html).not.toContain('<id=');
		});

		FunkyTests.it('properly wraps tag names in spans', function() {
			var html = Funky.CodePreview.highlight('<div></div>', 'html');

			// The tag name should be wrapped
			expect(html).toContain('<span class="syntax-tag">div</span>');
		});

		FunkyTests.it('properly wraps attribute names and values', function() {
			var html = Funky.CodePreview.highlight('<div class="test"></div>', 'html');

			// Attribute should be wrapped
			expect(html).toContain('<span class="syntax-attribute">class</span>');
			// Value should be wrapped (note: quotes are HTML entities)
			expect(html).toContain('<span class="syntax-string">&quot;test&quot;</span>');
		});

		FunkyTests.it('handles self-closing tags', function() {
			var html = Funky.CodePreview.highlight('<br/><input type="text"/>', 'html');

			expect(html).toContain('syntax-tag');
			expect(html).not.toContain('<type=');
		});

		FunkyTests.it('handles void elements', function() {
			var html = Funky.CodePreview.highlight('<img src="image.png" alt="description">', 'html');

			expect(html).toContain('syntax-tag');
			expect(html).toContain('syntax-attribute');
			expect(html).toContain('syntax-string');

			// No self-interference
			expect(html).not.toContain('<src=');
			expect(html).not.toContain('<alt=');
		});

		FunkyTests.it('handles complex real-world HTML', function() {
			var code = '<div class="funky-card" data-id="123">\n  <h1 class="title">Hello</h1>\n</div>';
			var html = Funky.CodePreview.highlight(code, 'html');

			// Should have all expected classes
			expect(html).toContain('syntax-tag');
			expect(html).toContain('syntax-attribute');
			expect(html).toContain('syntax-string');

			// Critical: no self-interference
			expect(html).not.toContain('<class=');
			expect(html).not.toContain('<data-id=');

			// The tag names should be properly wrapped
			expect(html).toContain('<span class="syntax-tag">div</span>');
			expect(html).toContain('<span class="syntax-tag">h1</span>');
		});

		FunkyTests.it('highlights CSS selectors', function() {
			var html = Funky.CodePreview.highlight('.class { color: red; }', 'css');

			expect(html).toContain('syntax-selector');
		});

		FunkyTests.it('highlights CSS properties', function() {
			var html = Funky.CodePreview.highlight('.class { color: red; }', 'css');

			expect(html).toContain('syntax-property');
		});

		FunkyTests.it('highlights CSS comments', function() {
			var html = Funky.CodePreview.highlight('/* comment */', 'css');

			expect(html).toContain('syntax-comment');
		});

		FunkyTests.it('escapes HTML in plain text mode', function() {
			var html = Funky.CodePreview.highlight('<script>alert(1)</script>', 'text');

			expect(html).not.toContain('<script>');
			expect(html).toContain('&lt;script&gt;');
		});

		FunkyTests.it('handles unknown language as text', function() {
			var html = Funky.CodePreview.highlight('<div>', 'unknown');

			expect(html).toContain('&lt;div&gt;');
		});
	});

	// =========================================================================
	// LINE NUMBERS
	// =========================================================================

	FunkyTests.describe('Line Numbers', function() {
		var container;
		var lineFixture;

		FunkyTests.beforeEach(function() {
			lineFixture = FunkyTests.fixture('<div id="line-numbers-container"></div>');
			container = lineFixture.el;  // fixture.el IS the container element
		});

		FunkyTests.afterEach(function() {
			lineFixture.cleanup();
		});

		FunkyTests.it('shows line numbers when enabled', function() {
			Funky.CodePreview.render(container, 'line1\nline2\nline3', {
				language: 'text',
				lineNumbers: true
			});

			var numbers = container.querySelectorAll('.code-preview__line-number');
			expect(numbers.length).toBe(3);
			expect(numbers[0].textContent).toBe('1');
			expect(numbers[2].textContent).toBe('3');
		});

		FunkyTests.it('hides line numbers by default', function() {
			Funky.CodePreview.render(container, 'line1\nline2', {
				language: 'text'
			});

			expect(container.querySelector('.code-preview__line-numbers')).toBeFalsy();
		});

		FunkyTests.it('creates corresponding line elements', function() {
			Funky.CodePreview.render(container, 'a\nb\nc', {
				language: 'text',
				lineNumbers: true
			});

			var lines = container.querySelectorAll('.code-preview__line');
			expect(lines.length).toBe(3);
		});

		FunkyTests.it('preserves empty lines', function() {
			Funky.CodePreview.render(container, 'a\n\nb', {
				language: 'text',
				lineNumbers: true
			});

			var numbers = container.querySelectorAll('.code-preview__line-number');
			expect(numbers.length).toBe(3);
		});
	});

	// =========================================================================
	// COLLAPSIBLE
	// =========================================================================

	FunkyTests.describe('Collapsible', function() {
		var container;
		var collapsibleFixture;

		FunkyTests.beforeEach(function() {
			collapsibleFixture = FunkyTests.fixture('<div id="collapsible-container"></div>');
			container = collapsibleFixture.el;  // fixture.el IS the container element
		});

		FunkyTests.afterEach(function() {
			collapsibleFixture.cleanup();
		});

		FunkyTests.it('shows collapse button when collapsible', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				collapsible: true
			});

			expect(container.querySelector('.code-preview__collapse')).toBeTruthy();
		});

		FunkyTests.it('hides collapse button by default', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript'
			});

			expect(container.querySelector('.code-preview__collapse')).toBeFalsy();
		});

		FunkyTests.it('toggles collapsed state on button click', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				collapsible: true
			});

			var btn = container.querySelector('.code-preview__collapse');
			var preview = container.querySelector('.code-preview');

			expect(preview.classList.contains('code-preview--collapsed')).toBe(false);

			btn.click();
			expect(preview.classList.contains('code-preview--collapsed')).toBe(true);

			btn.click();
			expect(preview.classList.contains('code-preview--collapsed')).toBe(false);
		});

		FunkyTests.it('starts collapsed when collapsed option is true', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				collapsible: true,
				collapsed: true
			});

			var preview = container.querySelector('.code-preview');
			expect(preview.classList.contains('code-preview--collapsed')).toBe(true);
		});

		FunkyTests.it('updates aria-expanded on toggle', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				collapsible: true
			});

			var btn = container.querySelector('.code-preview__collapse');

			expect(btn.getAttribute('aria-expanded')).toBe('true');

			btn.click();
			expect(btn.getAttribute('aria-expanded')).toBe('false');
		});
	});

	// =========================================================================
	// FORMAT SOURCE
	// =========================================================================

	FunkyTests.describe('formatSource()', function() {
		FunkyTests.it('removes function wrapper', function() {
			var source = 'function() {\n  var x = 1;\n}';
			var formatted = Funky.CodePreview.formatSource(source);

			expect(formatted).not.toContain('function()');
			expect(formatted).toContain('var x = 1');
		});

		FunkyTests.it('removes named function wrapper', function() {
			var source = 'function test() {\n  return 42;\n}';
			var formatted = Funky.CodePreview.formatSource(source);

			expect(formatted).not.toContain('function test()');
			expect(formatted).toContain('return 42');
		});

		FunkyTests.it('removes arrow function wrapper', function() {
			var source = '() => {\n  return 42;\n}';
			var formatted = Funky.CodePreview.formatSource(source);

			expect(formatted).not.toContain('=>');
			expect(formatted).toContain('return 42');
		});

		FunkyTests.it('dedents code', function() {
			var source = 'function() {\n    var x = 1;\n    var y = 2;\n}';
			var formatted = Funky.CodePreview.formatSource(source);

			expect(formatted).toBe('var x = 1;\nvar y = 2;');
		});

		FunkyTests.it('handles empty source', function() {
			expect(Funky.CodePreview.formatSource('')).toBe('');
			expect(Funky.CodePreview.formatSource(null)).toBe('');
		});

		FunkyTests.it('handles source without wrapper', function() {
			var source = 'var x = 1;';
			var formatted = Funky.CodePreview.formatSource(source);

			expect(formatted).toBe('var x = 1;');
		});
	});

	// =========================================================================
	// TO HTML (STATIC)
	// =========================================================================

	FunkyTests.describe('toHTML()', function() {
		FunkyTests.it('generates static HTML string', function() {
			var html = Funky.CodePreview.toHTML('var x = 1;', { language: 'javascript' });

			expect(html).toContain('code-preview');
			// Note: 'var' and '1' are wrapped in syntax spans, so check for parts
			expect(html).toContain('var');
			expect(html).toContain('x = ');
			expect(html).toContain('1');
			expect(html).toContain('syntax-keyword');
		});

		FunkyTests.it('includes language label when showLanguage is true', function() {
			var html = Funky.CodePreview.toHTML('code', {
				language: 'javascript',
				showLanguage: true
			});

			expect(html).toContain('JavaScript');
		});

		FunkyTests.it('excludes language label when showLanguage is false', function() {
			var html = Funky.CodePreview.toHTML('code', {
				language: 'javascript',
				showLanguage: false
			});

			expect(html).not.toContain('code-preview__header');
		});

		FunkyTests.it('returns valid HTML structure', function() {
			var html = Funky.CodePreview.toHTML('test', { language: 'text' });

			expect(html.startsWith('<div class="code-preview">')).toBe(true);
			expect(html.endsWith('</div>')).toBe(true);
		});
	});

	// =========================================================================
	// INSTANCE METHODS
	// =========================================================================

	FunkyTests.describe('Instance Methods', function() {
		var container, instance;
		var instanceFixture;

		FunkyTests.beforeEach(function() {
			instanceFixture = FunkyTests.fixture('<div id="instance-methods-container"></div>');
			container = instanceFixture.el;  // fixture.el IS the container element
			instance = Funky.CodePreview.create(container, { language: 'javascript' });
		});

		FunkyTests.afterEach(function() {
			if (instance) instance.destroy();
			instanceFixture.cleanup();
		});

		FunkyTests.it('setCode() updates displayed code', function() {
			instance.setCode('var a = 1;');
			expect(container.textContent).toContain('var a = 1');

			instance.setCode('var b = 2;');
			expect(container.textContent).toContain('var b = 2');
			expect(container.textContent).not.toContain('var a = 1');
		});

		FunkyTests.it('getCode() returns current code', function() {
			instance.setCode('test code');
			expect(instance.getCode()).toBe('test code');
		});

		FunkyTests.it('toggleCollapse() toggles state', function() {
			instance.destroy();
			instance = Funky.CodePreview.create(container, {
				language: 'javascript',
				collapsible: true
			});
			instance.setCode('code');

			expect(instance.isCollapsed).toBe(false);
			instance.toggleCollapse();
			expect(instance.isCollapsed).toBe(true);
			instance.toggleCollapse();
			expect(instance.isCollapsed).toBe(false);
		});

		FunkyTests.it('setHighlight() applies search highlighting', function() {
			instance.setCode('function test() { return value; }');

			// This test assumes Funky.Highlight is available
			if (Funky.Highlight) {
				instance.setHighlight(['test', 'value']);
				var highlights = container.querySelectorAll('.funky-highlight');
				expect(highlights.length).toBeGreaterThan(0);
			}
		});

		FunkyTests.it('setHighlight(null) clears highlighting', function() {
			instance.setCode('function test() {}');

			if (Funky.Highlight) {
				instance.setHighlight(['test']);
				instance.setHighlight(null);
				var highlights = container.querySelectorAll('.funky-highlight');
				expect(highlights.length).toBe(0);
			}
		});

		FunkyTests.it('setOptions() updates options and re-renders', function() {
			instance.setCode('code');

			expect(container.querySelector('.code-preview__line-numbers')).toBeFalsy();

			instance.setOptions({ lineNumbers: true });

			expect(container.querySelector('.code-preview__line-numbers')).toBeTruthy();
		});

		FunkyTests.it('destroy() removes DOM elements', function() {
			instance.setCode('code');
			expect(container.querySelector('.code-preview')).toBeTruthy();

			instance.destroy();
			instance = null;
			expect(container.querySelector('.code-preview')).toBeFalsy();
		});

		FunkyTests.it('destroy() cleans up event listeners', function() {
			instance.destroy();
			instance = null;
			// Should not throw
			expect(true).toBe(true);
		});
	});

	// =========================================================================
	// EDITABLE MODE
	// =========================================================================

	FunkyTests.describe('Editable Mode', function() {
		var container;
		var editableFixture;

		FunkyTests.beforeEach(function() {
			editableFixture = FunkyTests.fixture('<div id="editable-container"></div>');
			container = editableFixture.el;  // fixture.el IS the container element
		});

		FunkyTests.afterEach(function() {
			editableFixture.cleanup();
		});

		FunkyTests.it('makes code editable when editable is true', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				editable: true
			});

			var codeEl = container.querySelector('.code-preview__code');
			expect(codeEl.getAttribute('contenteditable')).toBe('true');
		});

		FunkyTests.it('sets spellcheck to false in editable mode', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				editable: true
			});

			var codeEl = container.querySelector('.code-preview__code');
			expect(codeEl.getAttribute('spellcheck')).toBe('false');
		});

		FunkyTests.it('adds editable class', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				editable: true
			});

			expect(container.querySelector('.code-preview__code--editable')).toBeTruthy();
		});

		FunkyTests.it('shows run button when showRun is true', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				editable: true,
				showRun: true
			});

			expect(container.querySelector('.code-preview__run')).toBeTruthy();
		});

		FunkyTests.it('hides run button when showRun is false', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				editable: true,
				showRun: false
			});

			expect(container.querySelector('.code-preview__run')).toBeFalsy();
		});

		FunkyTests.it('calls onRun when run button clicked', function() {
			var runCalled = false;
			var runCode = null;

			Funky.CodePreview.render(container, 'var x = 1;', {
				language: 'javascript',
				editable: true,
				showRun: true,
				onRun: function(code) {
					runCalled = true;
					runCode = code;
				}
			});

			container.querySelector('.code-preview__run').click();

			expect(runCalled).toBe(true);
			expect(runCode).toContain('var x = 1');
		});

		FunkyTests.it('calls onChange when code is edited', function() {
			var changeCalled = false;
			var changedCode = null;

			Funky.CodePreview.render(container, 'initial', {
				language: 'javascript',
				editable: true,
				onChange: function(code) {
					changeCalled = true;
					changedCode = code;
				}
			});

			var codeEl = container.querySelector('.code-preview__code');
			codeEl.textContent = 'modified';
			codeEl.dispatchEvent(new Event('input'));

			expect(changeCalled).toBe(true);
			expect(changedCode).toBe('modified');
		});

		FunkyTests.it('does not apply syntax highlighting in editable mode', function() {
			Funky.CodePreview.render(container, 'function test() {}', {
				language: 'javascript',
				editable: true
			});

			// In editable mode, we use textContent not innerHTML with highlighting
			var codeEl = container.querySelector('.code-preview__code');
			expect(codeEl.querySelector('.syntax-keyword')).toBeFalsy();
		});
	});

	// =========================================================================
	// OUTPUT PANEL
	// =========================================================================

	FunkyTests.describe('Output Panel', function() {
		var container;
		var outputFixture;

		FunkyTests.beforeEach(function() {
			outputFixture = FunkyTests.fixture('<div id="output-container"></div>');
			container = outputFixture.el;  // fixture.el IS the container element
		});

		FunkyTests.afterEach(function() {
			outputFixture.cleanup();
		});

		FunkyTests.it('shows output panel when showOutput is true', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				editable: true,
				showOutput: true
			});

			expect(container.querySelector('.code-preview__output')).toBeTruthy();
		});

		FunkyTests.it('hides output panel by default', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				editable: true
			});

			expect(container.querySelector('.code-preview__output')).toBeFalsy();
		});
	});

	// =========================================================================
	// COPY FUNCTIONALITY
	// =========================================================================

	FunkyTests.describe('Copy Functionality', function() {
		var container, instance;
		var copyFixture;

		FunkyTests.beforeEach(function() {
			copyFixture = FunkyTests.fixture('<div id="copy-container"></div>');
			container = copyFixture.el;  // fixture.el IS the container element
		});

		FunkyTests.afterEach(function() {
			if (instance) instance.destroy();
			copyFixture.cleanup();
		});

		FunkyTests.it('copy button has aria-label', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				showCopy: true
			});

			var copyBtn = container.querySelector('.code-preview__copy');
			expect(copyBtn.getAttribute('aria-label')).toBe('Copy code');
		});

		FunkyTests.it('copy() method exists on instance', function() {
			instance = Funky.CodePreview.create(container, { language: 'javascript' });
			instance.setCode('test');

			expect(typeof instance.copy).toBe('function');
		});
	});

	// =========================================================================
	// LIVEBINDING INTEGRATION
	// =========================================================================

	FunkyTests.describe('LiveBinding Integration', function() {
		var container, instance;
		var bindingFixture;

		FunkyTests.beforeEach(function() {
			bindingFixture = FunkyTests.fixture('<div id="binding-container"></div>');
			container = bindingFixture.el;  // fixture.el IS the container element
		});

		FunkyTests.afterEach(function() {
			if (instance && instance.destroy) instance.destroy();
			bindingFixture.cleanup();
		});

		FunkyTests.it('createWithBinding() creates instance with binding', function() {
			if (!Funky.LiveBinding) {
				// Skip if LiveBinding not available
				expect(true).toBe(true);
				return;
			}

			instance = Funky.CodePreview.createWithBinding(
				container,
				'var name = "{{name}}";',
				{ language: 'javascript' },
				{ source: 'memory', key: 'test-code-preview-binding' }
			);

			expect(instance).toBeTruthy();
			expect(typeof instance.bindTo).toBe('function');
		});

		FunkyTests.it('setTemplate() stores template', function() {
			instance = Funky.CodePreview.create(container, { language: 'javascript' });
			instance.setTemplate('var x = {{value}};');

			expect(instance.codeTemplate).toBe('var x = {{value}};');
		});

		FunkyTests.it('updateData() interpolates template', function() {
			instance = Funky.CodePreview.create(container, { language: 'javascript' });
			instance.setTemplate('var name = "{{name}}";');
			instance.setCode('var name = "{{name}}";');
			instance.updateData({ name: 'John' });

			expect(container.textContent).toContain('John');
		});

		FunkyTests.it('handles nested data paths', function() {
			instance = Funky.CodePreview.create(container, { language: 'javascript' });
			instance.setTemplate('var city = "{{user.address.city}}";');
			instance.setCode('var city = "{{user.address.city}}";');
			instance.updateData({ user: { address: { city: 'Boston' } } });

			expect(container.textContent).toContain('Boston');
		});

		FunkyTests.it('stringifies objects in templates', function() {
			instance = Funky.CodePreview.create(container, { language: 'javascript' });
			instance.setTemplate('var config = {{config}};');
			instance.setCode('var config = {{config}};');
			instance.updateData({ config: { debug: true } });

			expect(container.textContent).toContain('debug');
			expect(container.textContent).toContain('true');
		});

		FunkyTests.it('preserves placeholders without matching data', function() {
			instance = Funky.CodePreview.create(container, { language: 'javascript' });
			instance.setTemplate('var x = {{missing}};');
			instance.setCode('var x = {{missing}};');
			instance.updateData({ other: 'value' });

			expect(container.textContent).toContain('{{missing}}');
		});
	});

	// =========================================================================
	// ACCESSIBILITY
	// =========================================================================

	FunkyTests.describe('Accessibility', function() {
		var container;
		var a11yFixture;

		FunkyTests.beforeEach(function() {
			a11yFixture = FunkyTests.fixture('<div id="a11y-container"></div>');
			container = a11yFixture.el;  // fixture.el IS the container element
		});

		FunkyTests.afterEach(function() {
			a11yFixture.cleanup();
		});

		FunkyTests.it('buttons have aria-label attributes', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				showCopy: true,
				collapsible: true,
				showRun: true,
				editable: true
			});

			var copyBtn = container.querySelector('.code-preview__copy');
			var collapseBtn = container.querySelector('.code-preview__collapse');
			var runBtn = container.querySelector('.code-preview__run');

			expect(copyBtn.getAttribute('aria-label')).toBeTruthy();
			expect(collapseBtn.getAttribute('aria-label')).toBeTruthy();
			expect(runBtn.getAttribute('aria-label')).toBeTruthy();
		});

		FunkyTests.it('collapse button has aria-expanded', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				collapsible: true
			});

			var btn = container.querySelector('.code-preview__collapse');
			expect(btn.hasAttribute('aria-expanded')).toBe(true);
		});

		FunkyTests.it('uses semantic pre and code elements', function() {
			Funky.CodePreview.render(container, 'code', { language: 'javascript' });

			expect(container.querySelector('pre')).toBeTruthy();
			expect(container.querySelector('code')).toBeTruthy();
		});

		FunkyTests.it('buttons have type="button"', function() {
			Funky.CodePreview.render(container, 'code', {
				language: 'javascript',
				showCopy: true,
				collapsible: true
			});

			var buttons = container.querySelectorAll('button');
			buttons.forEach(function(btn) {
				expect(btn.getAttribute('type')).toBe('button');
			});
		});
	});

});
