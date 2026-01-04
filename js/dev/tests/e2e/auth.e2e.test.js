/**
 * E2E Tests: User Authentication Flow
 *
 * Tests complete authentication workflows including login, logout, and error handling.
 */

describe('Funky.E2E.Auth', function() {

    var E2E = FunkyTests.E2E;
    var Toast = Funky.Toast;
    var fixture;
    var restoreAPI;

    // Skip all tests if E2E utilities not available
    if (!E2E) {
        it('E2E utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="auth-test-container"></div>');

        // Mock successful auth API
        restoreAPI = E2E.mockAPI({
            '/api/login': function(opts) {
                var body = opts.body ? JSON.parse(opts.body) : {};
                if (body.email === 'user@example.com' && body.password === 'password123') {
                    return {
                        ok: true,
                        data: {
                            success: true,
                            user: { id: 1, name: 'Test User', email: body.email },
                            token: 'mock-jwt-token-123'
                        }
                    };
                }
                return {
                    ok: false,
                    status: 401,
                    data: { error: 'Invalid credentials' }
                };
            },
            '/api/logout': {
                data: { success: true }
            },
            '/api/forgot-password': {
                data: { success: true, message: 'Password reset email sent' }
            }
        });
    });

    afterEach(function() {
        if (restoreAPI) restoreAPI();
        E2E.cleanup();
        fixture.destroy();
        window.currentUser = null;
    });

    describe('Login Flow', function() {

        function createLoginForm() {
            var container = document.getElementById('auth-test-container');
            container.innerHTML =
                '<div class="login-container">' +
                    '<form id="login-form">' +
                        '<h2>Login</h2>' +
                        '<div class="form-group">' +
                            '<label for="email">Email</label>' +
                            '<input type="email" id="email" name="email" class="form-control" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="password">Password</label>' +
                            '<input type="password" id="password" name="password" class="form-control" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label><input type="checkbox" id="remember" name="remember"> Remember me</label>' +
                        '</div>' +
                        '<button type="submit" class="btn btn-primary">Login</button>' +
                        '<a href="#" id="forgot-password-link">Forgot password?</a>' +
                    '</form>' +
                    '<div id="login-error" class="alert alert-danger" style="display: none;"></div>' +
                '</div>';

            // Add form submit handler
            var form = document.getElementById('login-form');
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                var email = document.getElementById('email').value;
                var password = document.getElementById('password').value;

                fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                })
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    if (data.success) {
                        window.currentUser = data.user;
                        Toast.success('Login successful!');
                        form.style.display = 'none';
                    } else {
                        var errorEl = document.getElementById('login-error');
                        errorEl.textContent = data.error || 'Login failed';
                        errorEl.style.display = 'block';
                        Toast.error(data.error || 'Login failed');
                    }
                });
            });
        }

        it('User can log in with valid credentials', function() {
            return E2E.scenario('Valid Login')
                .given('I am on the login page', function() {
                    createLoginForm();
                    return E2E.waitFor('#login-form');
                })
                .when('I enter my email', function() {
                    return E2E.type('#email', 'user@example.com');
                })
                .and('I enter my password', function() {
                    return E2E.type('#password', 'password123');
                })
                .and('I click the login button', function() {
                    return E2E.click(E2E.getButton('Login'));
                })
                .then('I should see a success message', function() {
                    return E2E.waitForText('Login successful');
                })
                .and('I should be logged in', function() {
                    return E2E.wait(100).then(function() {
                        expect(window.currentUser).not.toBeNull();
                        expect(window.currentUser.email).toBe('user@example.com');
                    });
                })
                .and('The login form should be hidden', function() {
                    var form = document.getElementById('login-form');
                    expect(form.style.display).toBe('none');
                })
                .run();
        });

        it('User sees error with invalid credentials', function() {
            return E2E.scenario('Invalid Login')
                .given('I am on the login page', function() {
                    createLoginForm();
                    return E2E.waitFor('#login-form');
                })
                .when('I enter wrong email', function() {
                    return E2E.type('#email', 'wrong@example.com');
                })
                .and('I enter wrong password', function() {
                    return E2E.type('#password', 'wrongpassword');
                })
                .and('I submit the form', function() {
                    return E2E.click(E2E.getButton('Login'));
                })
                .then('I should see an error message', function() {
                    return E2E.waitFor('#login-error[style*="block"]');
                })
                .and('The error should mention invalid credentials', function() {
                    E2E.assertText('#login-error', 'Invalid credentials');
                })
                .and('I should still be on the login form', function() {
                    E2E.assertVisible('#login-form');
                })
                .and('I should not be logged in', function() {
                    expect(window.currentUser).toBeNull();
                })
                .run();
        });

        it('User can check remember me option', function() {
            return E2E.scenario('Remember Me')
                .given('I am on the login page', function() {
                    createLoginForm();
                    return E2E.waitFor('#login-form');
                })
                .when('I check Remember me', function() {
                    return E2E.check('#remember');
                })
                .then('The checkbox should be checked', function() {
                    E2E.assertChecked('#remember');
                })
                .when('I uncheck Remember me', function() {
                    return E2E.uncheck('#remember');
                })
                .then('The checkbox should be unchecked', function() {
                    var checkbox = document.getElementById('remember');
                    expect(checkbox.checked).toBe(false);
                })
                .run();
        });

        it('Form validates required fields', function() {
            return E2E.scenario('Form Validation')
                .given('I am on the login page', function() {
                    createLoginForm();
                    return E2E.waitFor('#login-form');
                })
                .when('I leave email empty and submit', function() {
                    return E2E.type('#password', 'somepassword')
                        .then(function() {
                            var form = document.getElementById('login-form');
                            // Try to submit - browser validation should prevent
                            var emailInput = document.getElementById('email');
                            expect(emailInput.validity.valid).toBe(false);
                        });
                })
                .then('The email field should be invalid', function() {
                    var emailInput = document.getElementById('email');
                    expect(emailInput.validity.valueMissing).toBe(true);
                })
                .run();
        });

    });

    describe('Logout Flow', function() {

        function createLoggedInState() {
            window.currentUser = { id: 1, name: 'Test User', email: 'user@example.com' };

            var container = document.getElementById('auth-test-container');
            container.innerHTML =
                '<div class="user-menu">' +
                    '<span id="user-name">Welcome, Test User</span>' +
                    '<button id="logout-btn" class="btn btn-secondary">Logout</button>' +
                '</div>';

            document.getElementById('logout-btn').addEventListener('click', function() {
                fetch('/api/logout', { method: 'POST' })
                    .then(function(response) { return response.json(); })
                    .then(function(data) {
                        if (data.success) {
                            window.currentUser = null;
                            Toast.success('Logged out successfully');
                            container.innerHTML = '<p id="logged-out-message">You have been logged out</p>';
                        }
                    });
            });
        }

        it('User can log out', function() {
            return E2E.scenario('Logout')
                .given('I am logged in', function() {
                    createLoggedInState();
                    expect(window.currentUser).not.toBeNull();
                    return E2E.waitFor('#logout-btn');
                })
                .when('I click the logout button', function() {
                    return E2E.click('#logout-btn');
                })
                .then('I should see a success message', function() {
                    return E2E.waitForText('Logged out successfully');
                })
                .and('I should be logged out', function() {
                    return E2E.wait(100).then(function() {
                        expect(window.currentUser).toBeNull();
                    });
                })
                .and('I should see the logged out message', function() {
                    return E2E.waitFor('#logged-out-message');
                })
                .run();
        });

    });

    describe('Forgot Password Flow', function() {

        function createForgotPasswordForm() {
            var container = document.getElementById('auth-test-container');
            container.innerHTML =
                '<div class="forgot-password-container">' +
                    '<form id="forgot-password-form">' +
                        '<h2>Reset Password</h2>' +
                        '<p>Enter your email to receive a password reset link.</p>' +
                        '<div class="form-group">' +
                            '<label for="reset-email">Email</label>' +
                            '<input type="email" id="reset-email" name="email" class="form-control" required>' +
                        '</div>' +
                        '<button type="submit" class="btn btn-primary">Send Reset Link</button>' +
                        '<a href="#" id="back-to-login">Back to Login</a>' +
                    '</form>' +
                    '<div id="reset-success" style="display: none;">' +
                        '<p>Check your email for the reset link!</p>' +
                    '</div>' +
                '</div>';

            var form = document.getElementById('forgot-password-form');
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                var email = document.getElementById('reset-email').value;

                fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                })
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    if (data.success) {
                        form.style.display = 'none';
                        document.getElementById('reset-success').style.display = 'block';
                        Toast.success('Password reset email sent!');
                    }
                });
            });
        }

        it('User can request password reset', function() {
            return E2E.scenario('Password Reset Request')
                .given('I am on the forgot password page', function() {
                    createForgotPasswordForm();
                    return E2E.waitFor('#forgot-password-form');
                })
                .when('I enter my email', function() {
                    return E2E.type('#reset-email', 'user@example.com');
                })
                .and('I submit the form', function() {
                    return E2E.click(E2E.getButton('Send Reset Link'));
                })
                .then('I should see a success message', function() {
                    return E2E.waitForText('Password reset email sent');
                })
                .and('I should see confirmation', function() {
                    return E2E.waitFor('#reset-success[style*="block"]');
                })
                .and('The form should be hidden', function() {
                    var form = document.getElementById('forgot-password-form');
                    expect(form.style.display).toBe('none');
                })
                .run();
        });

    });

    describe('Session Management', function() {

        it('User session persists across interactions', function() {
            return E2E.scenario('Session Persistence')
                .given('I am logged in', function() {
                    window.currentUser = { id: 1, name: 'Test User' };
                    window.sessionToken = 'mock-token-123';

                    var container = document.getElementById('auth-test-container');
                    container.innerHTML =
                        '<div id="dashboard">' +
                            '<h1>Dashboard</h1>' +
                            '<p>User: <span id="current-user">' + window.currentUser.name + '</span></p>' +
                        '</div>';

                    return E2E.waitFor('#dashboard');
                })
                .when('I navigate within the app', function() {
                    // Simulate navigation
                    return E2E.wait(100);
                })
                .then('My session should still be active', function() {
                    expect(window.currentUser).not.toBeNull();
                    expect(window.sessionToken).toBe('mock-token-123');
                })
                .and('My user info should be displayed', function() {
                    E2E.assertText('#current-user', 'Test User');
                })
                .run();
        });

    });

});
