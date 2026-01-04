# Funky.Api - Centralized API Layer

Single entry point for all API calls with automatic CSRF token injection, error handling, request deduplication, retry logic, and SPA integration.

## Overview

`Funky.Api` provides a unified interface for making HTTP requests to the backend. It handles cross-cutting concerns like authentication, CSRF protection, and error handling automatically.

## Features

- **Automatic CSRF token injection** for state-changing requests
- **Global error handling** (401 → session expired, 403 → toast, etc.)
- **Request deduplication** for identical GET requests
- **Request cancellation** on SPA navigation
- **Retry logic** for 503 errors with exponential backoff
- **Timeout handling** with AbortController
- **Event emission** (api:request, api:success, api:error)

## API Reference

### Methods

#### `Api.get(url, params, options)`

Make a GET request.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | API endpoint path |
| params | object | No | Query parameters (appended to URL) |
| options | object | No | Request options |

**Returns:** `Promise<Object>` - Parsed JSON response

**Example:**
```javascript
// Simple GET
Funky.Api.get('/api/clients').then(function(response) {
  if (response.success) {
    console.log('Clients:', response.data);
  }
});

// With query parameters
Funky.Api.get('/api/clients', {
  status: 'active',
  page: 1
}).then(function(response) {
  // Results in: /api/clients?status=active&page=1
  console.log(response.data);
});
```

---

#### `Api.post(url, data, options)`

Make a POST request.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | API endpoint path |
| data | object | No | Request body |
| options | object | No | Request options |

**Returns:** `Promise<Object>` - Parsed JSON response

**Example:**
```javascript
Funky.Api.post('/api/clients', {
  name: 'Acme Corp',
  type: 'institutional'
}).then(function(response) {
  console.log(response);
});
```

---

#### `Api.put(url, data, options)`

Make a PUT request.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | API endpoint path |
| data | object | No | Request body |
| options | object | No | Request options |

**Returns:** `Promise<Object>` - Parsed JSON response

---

#### `Api.patch(url, data, options)`

Make a PATCH request.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | API endpoint path |
| data | object | No | Request body |
| options | object | No | Request options |

**Returns:** `Promise<Object>` - Parsed JSON response

---

#### `Api.delete(url, options)`

Make a DELETE request.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | API endpoint path |
| options | object | No | Request options |

**Returns:** `Promise<Object>` - Parsed JSON response

---

#### `Api.request(url, options)`

Base request method - all other methods use this internally.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| method | string | 'GET' | HTTP method |
| body | object | - | Request body (will be JSON stringified) |
| headers | object | - | Additional headers |
| timeout | number | 30000 | Request timeout in ms |
| retry | boolean | true (GET) | Enable retry for 503 errors |
| dedupe | boolean | true (GET) | Enable request deduplication |
| signal | AbortSignal | - | External abort signal |

---

#### `Api.cancelAll()`

Cancel all pending requests (called on SPA navigation).

**Example:**
```javascript
// Usually called automatically by SPA module
Funky.Api.cancelAll();
```

### Convenience Wrappers

These methods provide quick access to common API endpoints:

```javascript
// Fetch all clients
Funky.Api.fetchAllClients().then(function(clients) {
  console.log(clients);
});

// Fetch all securities
Funky.Api.fetchAllSecurities().then(function(securities) {
  console.log(securities);
});

// Other available methods:
// Funky.Api.fetchAllAllocations()
// Funky.Api.fetchAllUsers()
// Funky.Api.fetchAllTrades()
// Funky.Api.fetchAllClientRelationships()
// Funky.Api.fetchAllFxRates()
// Funky.Api.fetchAllTradeActions()
// Funky.Api.fetchAllReportFormats()
```

### Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `Api.config.timeout` | number | 30000 | Default timeout (ms) |
| `Api.config.maxRetries` | number | 3 | Max retries for 503 |
| `Api.config.retryDelay` | number | 1000 | Initial retry delay (doubles each retry) |
| `Api.config.deduplicateGET` | boolean | true | Deduplicate identical GET requests |

## Error Handling

The API layer automatically handles common error scenarios:

| Status | Action |
|--------|--------|
| 401 | Emits `session:expired` event |
| 403 | Shows toast notification |
| 429 | Shows rate limit warning |
| 503 | Retries with exponential backoff |
| Network error | Shows connection error toast |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `api:request` | `{ url, method }` | Before each request |
| `api:success` | `{ url, method, data }` | On successful response |
| `api:error` | `{ url, method, error }` | On error response |

## Dependencies

- `Funky.CSRF` - For token retrieval
- `Funky.PubSub` - For event emission (optional)
- `Funky.Toast` - For error notifications (optional)

## Examples

### Basic CRUD Operations

```javascript
// Create
Funky.Api.post('/api/trades', { security_id: 1, quantity: 100 })
  .then(function(response) {
    console.log('Created:', response);
  });

// Read
Funky.Api.get('/api/trades/123').then(function(trade) {
  console.log('Trade:', trade);
});

// Update
Funky.Api.put('/api/trades/123', { quantity: 200 })
  .then(function(response) {
    console.log('Updated:', response);
  });

// Delete
Funky.Api.delete('/api/trades/123').then(function(response) {
  console.log('Deleted:', response);
});
```

### With Custom Options

```javascript
Funky.Api.get('/api/large-report', {
  timeout: 60000,  // 60 second timeout
  dedupe: false    // Don't deduplicate
}).then(function(response) {
  console.log(response);
});
```

### Error Handling

```javascript
Funky.Api.post('/api/trades', data)
  .then(function(response) {
    if (response.success) {
      Funky.Toast.success('Trade created');
    } else {
      Funky.Toast.error(response.error);
    }
  })
  .catch(function(error) {
    console.error('Network error:', error);
  });
```
