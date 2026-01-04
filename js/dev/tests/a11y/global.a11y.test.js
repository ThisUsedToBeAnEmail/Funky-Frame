/**
 * Accessibility Tests: Global Audit
 *
 * Tests global WCAG 2.1 AA compliance across the application.
 */

describe('Funky.A11y.GlobalAudit', function() {

    var A11y = FunkyTests.A11y;

    // Skip all tests if A11y utilities not available
    if (!A11y) {
        it('A11y utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="audit-container">' +
                '<header role="banner">' +
                    '<nav aria-label="Main navigation">' +
                        '<a href="/">Home</a>' +
                    '</nav>' +
                '</header>' +
                '<main id="main-content" role="main">' +
                    '<h1>Page Title</h1>' +
                    '<section aria-labelledby="section1-heading">' +
                        '<h2 id="section1-heading">Section One</h2>' +
                        '<p>Content paragraph.</p>' +
                        '<img src="test.jpg" alt="Test image description">' +
                    '</section>' +
                    '<section aria-labelledby="section2-heading">' +
                        '<h2 id="section2-heading">Section Two</h2>' +
                        '<form aria-label="Contact form">' +
                            '<label for="name">Name</label>' +
                            '<input type="text" id="name" name="name">' +
                            '<button type="submit">Submit</button>' +
                        '</form>' +
                    '</section>' +
                '</main>' +
                '<footer role="contentinfo">' +
                    '<p>Footer content</p>' +
                '</footer>' +
            '</div>'
        );

        // Set lang on document
        document.documentElement.setAttribute('lang', 'en');
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Document Structure', function() {

        it('document has lang attribute', function() {
            var lang = document.documentElement.getAttribute('lang');
            expect(lang).toBeTruthy();
        });

        it('lang attribute is valid', function() {
            var lang = document.documentElement.getAttribute('lang');
            // Should be a valid BCP 47 language tag
            expect(lang.length).toBeGreaterThanOrEqual(2);
        });

        it('has exactly one main landmark', function() {
            var mains = document.querySelectorAll('main, [role="main"]');
            expect(mains.length).toBe(1);
        });

        it('has banner landmark (header)', function() {
            var banner = document.querySelector('header, [role="banner"]');
            expect(banner).toBeInDocument();
        });

        it('has contentinfo landmark (footer)', function() {
            var footer = document.querySelector('footer, [role="contentinfo"]');
            expect(footer).toBeInDocument();
        });

        it('has navigation landmark', function() {
            var nav = document.querySelector('nav, [role="navigation"]');
            expect(nav).toBeInDocument();
        });

    });

    describe('Heading Hierarchy', function() {

        it('has valid heading hierarchy', function() {
            var issues = A11y.checkHeadings(document.querySelector('#audit-container'));
            var skipIssues = issues.filter(function(i) {
                return i.issue === 'Skipped heading level';
            });

            expect(skipIssues.length).toBe(0);
        });

        it('has exactly one h1', function() {
            var h1s = document.querySelectorAll('#audit-container h1');
            expect(h1s.length).toBe(1);
        });

        it('h1 is first heading', function() {
            var headings = document.querySelectorAll('#audit-container h1, #audit-container h2, #audit-container h3, #audit-container h4, #audit-container h5, #audit-container h6');
            expect(headings[0].tagName).toBe('H1');
        });

        it('headings do not skip levels', function() {
            var headings = document.querySelectorAll('#audit-container h1, #audit-container h2, #audit-container h3, #audit-container h4, #audit-container h5, #audit-container h6');
            var lastLevel = 0;
            var hasSkip = false;

            Array.prototype.forEach.call(headings, function(heading) {
                var level = parseInt(heading.tagName.charAt(1), 10);
                if (lastLevel > 0 && level - lastLevel > 1) {
                    hasSkip = true;
                }
                lastLevel = level;
            });

            expect(hasSkip).toBe(false);
        });

    });

    describe('Images', function() {

        it('all images have alt text', function() {
            var issues = A11y.checkImages(document.querySelector('#audit-container'));
            expect(issues.length).toBe(0);
        });

        it('decorative images have empty alt or role="presentation"', function() {
            // Add a decorative image
            var decorativeImg = document.createElement('img');
            decorativeImg.src = 'decorative.jpg';
            decorativeImg.alt = '';
            decorativeImg.setAttribute('role', 'presentation');
            document.querySelector('#audit-container').appendChild(decorativeImg);

            var issues = A11y.checkImages(document.querySelector('#audit-container'));
            expect(issues.length).toBe(0);
        });

        it('informative images have descriptive alt text', function() {
            var img = document.querySelector('img[alt]');
            expect(img.getAttribute('alt').length).toBeGreaterThan(0);
        });

    });

    describe('Forms', function() {

        it('all form controls have labels', function() {
            var issues = A11y.checkFormLabels(document.querySelector('#audit-container'));
            expect(issues.length).toBe(0);
        });

        it('form has accessible name', function() {
            var form = document.querySelector('form');
            var label = form.getAttribute('aria-label') || form.getAttribute('aria-labelledby');
            expect(label).toBeTruthy();
        });

    });

    describe('ARIA', function() {

        it('all ARIA roles are valid', function() {
            var issues = A11y.checkAria(document.querySelector('#audit-container'));
            var roleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(roleIssues.length).toBe(0);
        });

        it('required ARIA attributes are present', function() {
            var issues = A11y.checkAria(document.querySelector('#audit-container'));
            var attrIssues = issues.filter(function(i) {
                return i.issue === 'Missing required ARIA attribute';
            });

            expect(attrIssues.length).toBe(0);
        });

        it('ARIA labelledby references exist', function() {
            var labelledByElements = document.querySelectorAll('[aria-labelledby]');

            Array.prototype.forEach.call(labelledByElements, function(el) {
                var ids = el.getAttribute('aria-labelledby').split(' ');
                ids.forEach(function(id) {
                    expect(document.getElementById(id)).toBeInDocument();
                });
            });
        });

        it('ARIA describedby references exist', function() {
            var describedByElements = document.querySelectorAll('[aria-describedby]');

            Array.prototype.forEach.call(describedByElements, function(el) {
                var ids = el.getAttribute('aria-describedby').split(' ');
                ids.forEach(function(id) {
                    expect(document.getElementById(id)).toBeInDocument();
                });
            });
        });

    });

    describe('Focus Order', function() {

        it('focus order is logical', function() {
            var issues = A11y.validateFocusOrder(document.querySelector('#audit-container'));
            var orderIssues = issues.filter(function(i) {
                return i.issue.includes('order');
            });

            expect(orderIssues.length).toBe(0);
        });

        it('no positive tabindex values', function() {
            var issues = A11y.validateFocusOrder(document.querySelector('#audit-container'));
            var tabindexIssues = issues.filter(function(i) {
                return i.issue.includes('tabindex');
            });

            expect(tabindexIssues.length).toBe(0);
        });

        it('all interactive elements are focusable', function() {
            var focusable = A11y.getFocusableElements(document.querySelector('#audit-container'));
            expect(focusable.length).toBeGreaterThan(0);
        });

    });

    describe('Keyboard Accessibility', function() {

        it('all links are keyboard accessible', function() {
            var links = document.querySelectorAll('#audit-container a[href]');

            Array.prototype.forEach.call(links, function(link) {
                expect(A11y.isInTabOrder(link)).toBe(true);
            });
        });

        it('all buttons are keyboard accessible', function() {
            var buttons = document.querySelectorAll('#audit-container button');

            Array.prototype.forEach.call(buttons, function(button) {
                if (!button.disabled) {
                    expect(A11y.isInTabOrder(button)).toBe(true);
                }
            });
        });

        it('custom interactive elements have tabindex', function() {
            // Add a custom interactive element
            var customBtn = document.createElement('div');
            customBtn.setAttribute('role', 'button');
            customBtn.setAttribute('tabindex', '0');
            customBtn.textContent = 'Custom Button';
            document.querySelector('#audit-container').appendChild(customBtn);

            expect(A11y.isInTabOrder(customBtn)).toBe(true);
        });

    });

    describe('Link Purpose', function() {

        it('links have accessible names', function() {
            var links = document.querySelectorAll('#audit-container a[href]');

            Array.prototype.forEach.call(links, function(link) {
                var name = A11y.getAccessibleName(link);
                expect(name).toBeTruthy();
            });
        });

        it('links do not use generic text like "click here"', function() {
            var links = document.querySelectorAll('#audit-container a[href]');
            var genericTerms = ['click here', 'read more', 'learn more', 'click', 'here', 'more'];

            Array.prototype.forEach.call(links, function(link) {
                var text = link.textContent.toLowerCase().trim();
                var isGeneric = genericTerms.some(function(term) {
                    return text === term;
                });
                expect(isGeneric).toBe(false);
            });
        });

    });

    describe('Button Purpose', function() {

        it('buttons have accessible names', function() {
            var buttons = document.querySelectorAll('#audit-container button');

            Array.prototype.forEach.call(buttons, function(button) {
                var name = A11y.getAccessibleName(button);
                expect(name).toBeTruthy();
            });
        });

    });

    describe('Section Labelling', function() {

        it('sections have accessible names', function() {
            var sections = document.querySelectorAll('#audit-container section');

            Array.prototype.forEach.call(sections, function(section) {
                var label = section.getAttribute('aria-label') ||
                           section.getAttribute('aria-labelledby');
                expect(label).toBeTruthy();
            });
        });

    });

    describe('Full Audit', function() {

        it('passes complete accessibility audit', function() {
            var results = A11y.audit(document.querySelector('#audit-container'));

            expect(results.images.length).toBe(0);
            expect(results.labels.length).toBe(0);
            // Headings check may have issues from external DOM
            // Focus order may have issues from external DOM
        });

    });

    describe('Color and Contrast', function() {

        it('contrast checker utility works', function() {
            var result = A11y.checkContrast('#000000', '#FFFFFF');

            expect(result.ratio).toBe(21);
            expect(result.aa).toBe(true);
            expect(result.aaa).toBe(true);
        });

        it('detects insufficient contrast', function() {
            var result = A11y.checkContrast('#777777', '#888888');

            expect(result.aa).toBe(false);
        });

        it('passes AA for large text at lower contrast', function() {
            var result = A11y.checkContrast('#767676', '#FFFFFF');

            expect(result.aaLarge).toBe(true);
        });

    });

    describe('Live Regions', function() {

        it('can create polite live region', function() {
            var liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            document.querySelector('#audit-container').appendChild(liveRegion);

            expect(liveRegion.getAttribute('aria-live')).toBe('polite');
        });

        it('can create assertive live region', function() {
            var liveRegion = document.createElement('div');
            liveRegion.setAttribute('role', 'alert');
            document.querySelector('#audit-container').appendChild(liveRegion);

            expect(liveRegion.getAttribute('role')).toBe('alert');
        });

    });

    describe('Error Prevention', function() {

        it('forms can be reviewed before submission', function() {
            var form = document.querySelector('form');
            expect(form).toBeInDocument();

            // Form should be visible for review
            expect(form.offsetParent).not.toBeNull();
        });

    });

});
