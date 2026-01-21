# HMIS REST Client

Direct REST API access to HMIS from React Native frontend.

## Features

✅ **Automatic cookie management** - React Native `fetch` handles HMIS cookies
✅ **Bearer token auth** - Reads `auth_token` from cookies automatically
✅ **Base URL from cookies** - Uses stored `api_url` cookie
✅ **Browser User-Agent** - HMIS requires browser UA, automatically included
✅ **Error handling** - Maps HMIS error codes (401/403/404/422) to friendly messages
✅ **TypeScript types** - Full type safety for requests and responses

## Usage

### Direct client usage

```typescript
import { hmisClient } from '@monorepo/expo/shared/clients';

// GET request
const client = await hmisClient.get('/clients/123', {
  fields: 'firstName,lastName,age',
});

// POST request
const note = await hmisClient.post('/clients/123/client-notes', {
  title: 'Follow-up',
  note: 'Client is doing well',
  date: '2026-01-21',
});

// PUT request
const updated = await hmisClient.put('/clients/123/client-notes/456', {
  note: 'Updated note content',
});

// DELETE request
await hmisClient.delete('/clients/123/client-notes/456');
```

### React hook usage

```typescript
import { useHmisClient } from '@monorepo/expo/betterangels/hooks';

const MyComponent = () => {
  const { getClient, createNote, hmisClient } = useHmisClient();

  const handleFetch = async () => {
    // Use convenience method
    const client = await getClient('123');

    // Or use raw client for custom requests
    const programs = await hmisClient.get('/clients/123/programs');
  };

  return <Button onPress={handleFetch}>Fetch Client</Button>;
};
```

## Architecture

### Cookie Flow

```
1. User logs in via GraphQL mutation
2. Backend calls HMIS, receives auth_token cookie
3. Backend forwards cookie to frontend
4. Frontend stores in NitroCookies

5. Frontend makes direct REST call:
   - Reads auth_token via getHmisAuthToken()
   - Reads api_url via getHmisApiUrl()
   - Sends: Authorization: Bearer {token}
   - Sends: credentials: 'include' (auto cookie management)

6. HMIS responds with data + updated cookies
7. React Native fetch automatically stores cookies
```

### Why This Works

Unlike browsers:

- ✅ React Native has no CORS restrictions
- ✅ `credentials: 'include'` works across domains
- ✅ Cookies stored/sent automatically by fetch

We only need manual cookie access to:

- Read `auth_token` value for Authorization header
- Read `api_url` value for base URL

Everything else is automatic!

## Error Handling

```typescript
import { HmisError } from '@monorepo/expo/shared/clients';

try {
  await hmisClient.get('/clients/999');
} catch (error) {
  if (error instanceof HmisError) {
    console.log(error.status); // 404
    console.log(error.message); // "Resource not found"
    console.log(error.data); // Raw error data from HMIS
  }
}
```

### Error Codes

- `401` - Not authenticated (need to log in)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `422` - Validation error (includes field-level errors)

## GraphQL vs REST

**When to use GraphQL** (via backend proxy):

- Complex queries with nested data
- Need to combine HMIS data with backend data
- Mutations that require backend validation
- Operations requiring Django permissions

**When to use REST** (direct HMIS):

- Simple CRUD operations
- High-frequency polling/updates
- File uploads/downloads
- Reduced latency requirements

Both can coexist - cookies stay synchronized via automatic management.

## Testing

```typescript
// Example test
import { hmisClient } from '@monorepo/expo/shared/clients';

jest.mock('@monorepo/expo/shared/utils', () => ({
  getHmisAuthToken: jest.fn().mockResolvedValue('test-token'),
  getHmisApiUrl: jest.fn().mockResolvedValue('https://hmis-test.com'),
}));

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ id: '123', firstName: 'John' }),
  headers: new Headers(),
});

test('fetches client data', async () => {
  const client = await hmisClient.get('/clients/123');
  expect(client.firstName).toBe('John');
});
```

## Files

```
libs/expo/shared/clients/src/lib/http/
├── hmisClient.ts           # Core client class
├── hmisTypes.ts            # TypeScript types
└── index.ts                # Exports

libs/expo/betterangels/src/lib/hooks/
└── useHmisClient.ts        # React hook with convenience methods
```
