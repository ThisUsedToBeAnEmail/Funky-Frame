# Funky.CSRF - CSRF Token Management

Handles Cross-Site Request Forgery (CSRF) token management for secure API requests.

## Overview

`Funky.CSRF` provides utilities for retrieving and injecting CSRF tokens into API requests. It's primarily used internally by `Funky.Api`, but can be used directly for custom fetch requests.

## API Reference

### Methods

#### `CSRF.getToken()`

Get CSRF token from the browser cookie.

**Returns:** `string|null` - The CSRF token or null if not found

**Example:**
```javascript
const token = Funky.CSRF.getToken();
if (token) {
  console.log('Token available');
} else {
  console.log('User may need to log in');
}
```

---

#### `CSRF.secureFetch(url, options)`

Enhanced fetch wrapper with automatic CSRF token injection.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | The URL to fetch |
| options | object | No | Standard fetch options |

**Returns:** `Promise<Response>` - Fetch promise

**Example:**
```javascript
const response = await Funky.CSRF.secureFetch('/api/trades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 100 })
});
```

---

#### `CSRF.storeToken(token)`

Store CSRF token (called after login). Note: Token is automatically stored as a cookie by the server.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| token | string | Yes | The CSRF token |

## How It Works

1. **Token Storage**: The server sets the CSRF token as an HttpOnly cookie named `csrf_token`
2. **Token Injection**: For POST, PUT, DELETE, PATCH requests, the token is added to the `X-CSRF-Token` header
3. **Token Validation**: Server validates the header matches the cookie
4. **Expiry Handling**: If token validation fails (403), user may need to re-login

## Token Flow

```
1. User logs in
   ↓
2. Server sets csrf_token cookie
   ↓
3. JS reads token from cookie
   ↓
4. JS adds X-CSRF-Token header to requests
   ↓
5. Server validates token matches cookie
```

## Dependencies

None - this is a core module.

## Examples

### Manual Secure Request

```javascript
// Usually you'd use Funky.Api, but for custom needs:
const response = await Funky.CSRF.secureFetch('/api/custom-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'value' })
});

const json = await response.json();
```

### Check Token Availability

```javascript
function checkAuth() {
  const token = Funky.CSRF.getToken();
  if (!token) {
    window.location.href = '/auth/login';
    return false;
  }
  return true;
}
```

## Security Notes

- CSRF token is required for all state-changing operations (POST, PUT, DELETE, PATCH)
- GET requests don't require CSRF tokens
- Token mismatch results in 403 Forbidden response
- Always use `Funky.Api` or `Funky.CSRF.secureFetch` for API calls
