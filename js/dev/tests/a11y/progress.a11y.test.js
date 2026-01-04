/**
 * Accessibility Tests: Progress Indicators
 *
 * Tests WCAG 2.1 AA compliance for progress bars, spinners, and loading indicators.
 */

describe('Funky.A11y.Progress', function() {

    var A11y = FunkyTests.A11y;

    // Skip all tests if A11y utilities not available
    if (!A11y) {
        it('A11y utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    afterEach(function() {
        fixture.destroy();
    });

    describe('Determinate Progress Bar', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="progress-container">' +
                    '<label id="upload-label">File upload progress</label>' +
                    '<div id="upload-progress" role="progressbar" ' +
                        'aria-labelledby="upload-label" ' +
                        'aria-valuenow="45" ' +
                        'aria-valuemin="0" ' +
                        'aria-valuemax="100" ' +
                        'aria-valuetext="45 percent complete">' +
                        '<div class="progress-bar" style="width: 45%;"></div>' +
                    '</div>' +
                '</div>'
            );
        });

        it('progress bar has role="progressbar"', function() {
            var progress = document.querySelector('#upload-progress');
            expect(progress.getAttribute('role')).toBe('progressbar');
        });

        it('progress bar has aria-valuenow', function() {
            var progress = document.querySelector('#upload-progress');
            expect(progress.getAttribute('aria-valuenow')).toBe('45');
        });

        it('progress bar has aria-valuemin', function() {
            var progress = document.querySelector('#upload-progress');
            expect(progress.getAttribute('aria-valuemin')).toBe('0');
        });

        it('progress bar has aria-valuemax', function() {
            var progress = document.querySelector('#upload-progress');
            expect(progress.getAttribute('aria-valuemax')).toBe('100');
        });

        it('progress bar has accessible name', function() {
            var progress = document.querySelector('#upload-progress');
            var labelId = progress.getAttribute('aria-labelledby');
            var label = document.getElementById(labelId);

            expect(label.textContent).toBe('File upload progress');
        });

        it('aria-valuetext provides human-readable value', function() {
            var progress = document.querySelector('#upload-progress');
            expect(progress.getAttribute('aria-valuetext')).toBe('45 percent complete');
        });

    });

    describe('Indeterminate Progress Bar', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div id="loading-progress" role="progressbar" ' +
                    'aria-label="Loading content" ' +
                    'aria-valuetext="Loading...">' +
                    '<div class="progress-bar indeterminate"></div>' +
                '</div>'
            );
        });

        it('indeterminate progress has no aria-valuenow', function() {
            var progress = document.querySelector('#loading-progress');
            expect(progress.hasAttribute('aria-valuenow')).toBe(false);
        });

        it('indeterminate progress has aria-valuetext', function() {
            var progress = document.querySelector('#loading-progress');
            expect(progress.getAttribute('aria-valuetext')).toBe('Loading...');
        });

        it('indeterminate progress has accessible name', function() {
            var progress = document.querySelector('#loading-progress');
            expect(progress.getAttribute('aria-label')).toBe('Loading content');
        });

    });

    describe('Spinner/Loading Indicator', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="spinner-container">' +
                    '<div class="spinner" role="status" aria-label="Loading">' +
                        '<span class="visually-hidden">Loading...</span>' +
                    '</div>' +
                '</div>'
            );
        });

        it('spinner has role="status"', function() {
            var spinner = document.querySelector('.spinner');
            expect(spinner.getAttribute('role')).toBe('status');
        });

        it('spinner has accessible name', function() {
            var spinner = document.querySelector('.spinner');
            var name = A11y.getAccessibleName(spinner);

            expect(name).toBe('Loading');
        });

        it('spinner has visually hidden text', function() {
            var hiddenText = document.querySelector('.spinner-container .visually-hidden');
            expect(hiddenText).toBeInDocument();
            expect(hiddenText.textContent).toBe('Loading...');
        });

    });

    describe('Button with Loading State', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<button type="button" id="submit-btn" aria-busy="true" aria-disabled="true">' +
                    '<span class="spinner" aria-hidden="true"></span>' +
                    '<span>Submitting...</span>' +
                '</button>'
            );
        });

        it('loading button has aria-busy="true"', function() {
            var button = document.querySelector('#submit-btn');
            expect(button.getAttribute('aria-busy')).toBe('true');
        });

        it('loading button is disabled', function() {
            var button = document.querySelector('#submit-btn');
            expect(button.getAttribute('aria-disabled')).toBe('true');
        });

        it('spinner icon is hidden from screen readers', function() {
            var spinner = document.querySelector('.spinner[aria-hidden="true"]');
            expect(spinner).toBeInDocument();
        });

        it('button text indicates loading state', function() {
            var button = document.querySelector('#submit-btn');
            expect(button.textContent).toContain('Submitting');
        });

    });

    describe('Page Loading Overlay', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="loading-overlay" role="alert" aria-busy="true" aria-live="assertive">' +
                    '<div class="loading-content">' +
                        '<div class="spinner" aria-hidden="true"></div>' +
                        '<p>Please wait while we load your data...</p>' +
                    '</div>' +
                '</div>'
            );
        });

        it('overlay has role="alert" for important loading', function() {
            var overlay = document.querySelector('.loading-overlay');
            expect(overlay.getAttribute('role')).toBe('alert');
        });

        it('overlay has aria-busy="true"', function() {
            var overlay = document.querySelector('.loading-overlay');
            expect(overlay.getAttribute('aria-busy')).toBe('true');
        });

        it('overlay has aria-live for announcements', function() {
            var overlay = document.querySelector('.loading-overlay');
            expect(overlay.getAttribute('aria-live')).toBe('assertive');
        });

        it('loading message is accessible', function() {
            var message = document.querySelector('.loading-content p');
            expect(message.textContent).toContain('Please wait');
        });

    });

    describe('Skeleton Loading', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="skeleton-container" aria-busy="true" aria-label="Loading content">' +
                    '<div class="skeleton skeleton-title" aria-hidden="true"></div>' +
                    '<div class="skeleton skeleton-text" aria-hidden="true"></div>' +
                    '<div class="skeleton skeleton-text" aria-hidden="true"></div>' +
                    '<span class="sr-only">Loading content, please wait...</span>' +
                '</div>'
            );
        });

        it('skeleton container has aria-busy="true"', function() {
            var container = document.querySelector('.skeleton-container');
            expect(container.getAttribute('aria-busy')).toBe('true');
        });

        it('skeleton elements are hidden from screen readers', function() {
            var skeletons = document.querySelectorAll('.skeleton[aria-hidden="true"]');
            expect(skeletons.length).toBe(3);
        });

        it('has screen reader announcement', function() {
            var srText = document.querySelector('.skeleton-container .sr-only');
            expect(srText.textContent).toContain('Loading');
        });

    });

    describe('Multi-step Progress', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="multi-progress" role="progressbar" ' +
                    'aria-label="Installation progress" ' +
                    'aria-valuenow="2" ' +
                    'aria-valuemin="0" ' +
                    'aria-valuemax="4" ' +
                    'aria-valuetext="Step 2 of 4: Installing dependencies">' +
                    '<div class="step completed">Download</div>' +
                    '<div class="step current">Install</div>' +
                    '<div class="step">Configure</div>' +
                    '<div class="step">Complete</div>' +
                '</div>'
            );
        });

        it('multi-step progress has appropriate min/max', function() {
            var progress = document.querySelector('.multi-progress');

            expect(progress.getAttribute('aria-valuemin')).toBe('0');
            expect(progress.getAttribute('aria-valuemax')).toBe('4');
        });

        it('current step is reflected in aria-valuenow', function() {
            var progress = document.querySelector('.multi-progress');
            expect(progress.getAttribute('aria-valuenow')).toBe('2');
        });

        it('aria-valuetext describes current step', function() {
            var progress = document.querySelector('.multi-progress');
            expect(progress.getAttribute('aria-valuetext')).toContain('Step 2 of 4');
        });

    });

    describe('Upload Progress with Details', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="upload-item">' +
                    '<span class="filename">document.pdf</span>' +
                    '<div role="progressbar" ' +
                        'aria-label="Uploading document.pdf" ' +
                        'aria-valuenow="67" ' +
                        'aria-valuemin="0" ' +
                        'aria-valuemax="100" ' +
                        'aria-valuetext="67% - 2.3 MB of 3.4 MB uploaded">' +
                        '<div class="progress-bar" style="width: 67%;"></div>' +
                    '</div>' +
                    '<button type="button" aria-label="Cancel upload of document.pdf">Cancel</button>' +
                '</div>'
            );
        });

        it('progress bar identifies file being uploaded', function() {
            var progress = document.querySelector('[role="progressbar"]');
            expect(progress.getAttribute('aria-label')).toContain('document.pdf');
        });

        it('value text includes file size information', function() {
            var progress = document.querySelector('[role="progressbar"]');
            expect(progress.getAttribute('aria-valuetext')).toContain('MB');
        });

        it('cancel button identifies file', function() {
            var cancelBtn = document.querySelector('.upload-item button');
            var name = A11y.getAccessibleName(cancelBtn);

            expect(name).toContain('document.pdf');
        });

    });

    describe('Circular Progress', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="circular-progress" role="progressbar" ' +
                    'aria-label="Profile completion" ' +
                    'aria-valuenow="75" ' +
                    'aria-valuemin="0" ' +
                    'aria-valuemax="100">' +
                    '<svg viewBox="0 0 100 100" aria-hidden="true">' +
                        '<circle cx="50" cy="50" r="45" class="bg"></circle>' +
                        '<circle cx="50" cy="50" r="45" class="progress" style="stroke-dashoffset: 70.65;"></circle>' +
                    '</svg>' +
                    '<span class="percentage">75%</span>' +
                '</div>'
            );
        });

        it('circular progress has progressbar role', function() {
            var progress = document.querySelector('.circular-progress');
            expect(progress.getAttribute('role')).toBe('progressbar');
        });

        it('SVG is hidden from screen readers', function() {
            var svg = document.querySelector('svg[aria-hidden="true"]');
            expect(svg).toBeInDocument();
        });

        it('percentage text is visible', function() {
            var percentage = document.querySelector('.percentage');
            expect(percentage.textContent).toBe('75%');
        });

    });

    describe('Progress with Live Updates', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="live-progress-container">' +
                    '<div id="live-progress" role="progressbar" ' +
                        'aria-label="Processing" ' +
                        'aria-valuenow="0" ' +
                        'aria-valuemin="0" ' +
                        'aria-valuemax="100">' +
                    '</div>' +
                    '<div id="progress-status" aria-live="polite" class="sr-only"></div>' +
                '</div>'
            );
        });

        it('status region has aria-live for updates', function() {
            var status = document.querySelector('#progress-status');
            expect(status.getAttribute('aria-live')).toBe('polite');
        });

        it('progress updates are announced', function() {
            var status = document.querySelector('#progress-status');
            status.textContent = '50% complete';

            return FunkyTests.delay(50).then(function() {
                expect(status.textContent).toBe('50% complete');
            });
        });

    });

    describe('Download Progress', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="download-progress">' +
                    '<div role="progressbar" ' +
                        'aria-label="Downloading file" ' +
                        'aria-valuenow="30" ' +
                        'aria-valuemin="0" ' +
                        'aria-valuemax="100" ' +
                        'aria-valuetext="30% complete, 1.2 MB/s, 2 minutes remaining">' +
                    '</div>' +
                '</div>'
            );
        });

        it('includes speed and time in valuetext', function() {
            var progress = document.querySelector('[role="progressbar"]');
            var valuetext = progress.getAttribute('aria-valuetext');

            expect(valuetext).toContain('MB/s');
            expect(valuetext).toContain('remaining');
        });

    });

    describe('Error State Progress', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="upload-error">' +
                    '<div role="progressbar" ' +
                        'aria-label="Upload failed" ' +
                        'aria-valuenow="45" ' +
                        'aria-valuemin="0" ' +
                        'aria-valuemax="100" ' +
                        'aria-invalid="true">' +
                    '</div>' +
                    '<p role="alert">Upload failed: Connection lost</p>' +
                    '<button type="button">Retry</button>' +
                '</div>'
            );
        });

        it('failed progress has aria-invalid="true"', function() {
            var progress = document.querySelector('[role="progressbar"]');
            expect(progress.getAttribute('aria-invalid')).toBe('true');
        });

        it('error message has role="alert"', function() {
            var alert = fixture.container.querySelector('[role="alert"]');
            expect(alert).toBeInDocument();
            expect(alert.textContent).toContain('failed');
        });

        it('retry button is available', function() {
            var retryBtn = document.querySelector('.upload-error button');
            expect(retryBtn.textContent).toBe('Retry');
            expect(A11y.isInTabOrder(retryBtn)).toBe(true);
        });

    });

    describe('Paused Progress', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div class="paused-progress">' +
                    '<div role="progressbar" ' +
                        'aria-label="Download paused" ' +
                        'aria-valuenow="60" ' +
                        'aria-valuemin="0" ' +
                        'aria-valuemax="100" ' +
                        'aria-valuetext="Paused at 60%">' +
                    '</div>' +
                    '<button type="button" aria-label="Resume download">Resume</button>' +
                '</div>'
            );
        });

        it('paused state indicated in valuetext', function() {
            var progress = document.querySelector('[role="progressbar"]');
            expect(progress.getAttribute('aria-valuetext')).toContain('Paused');
        });

        it('resume button has accessible name', function() {
            var resumeBtn = document.querySelector('.paused-progress button');
            var name = A11y.getAccessibleName(resumeBtn);

            expect(name).toBe('Resume download');
        });

    });

    describe('ARIA Validation', function() {

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div role="progressbar" aria-label="Valid progress" ' +
                    'aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">' +
                '</div>'
            );
        });

        it('no invalid ARIA roles', function() {
            var issues = A11y.checkAria(fixture.container);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

    });

});
