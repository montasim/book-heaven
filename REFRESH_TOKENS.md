# Refresh Token Mechanism

## Overview

This application now implements a secure refresh token mechanism for authentication:

- **Access Tokens**: Short-lived tokens (15 minutes) used for API requests
- **Refresh Tokens**: Long-lived tokens (7 days) used to obtain new access tokens
- **Automatic Refresh**: Client-side hook automatically refreshes tokens before expiry

## Architecture

### Database Schema

The `user_sessions` table has been updated with:

- `tokenType`: ACCESS or REFRESH
- `revokedAt`: Timestamp for when token was revoked
- `userAgent`: Client user agent for security tracking
- `ipAddress`: Client IP address for security tracking

### Token Lifecycle

1. **Login**: User receives both access and refresh tokens
2. **Access Token Usage**: Access token used for authenticated requests
3. **Automatic Refresh**: Before access token expires, use refresh token to get new pair
4. **Refresh Token Rotation**: Old refresh token is revoked, new one issued
5. **Logout**: All tokens revoked

## API Endpoints

### POST /api/auth/login

Returns both access and refresh tokens:

```json
{
  "success": true,
  "user": { ... },
  "tokens": {
    "accessToken": "xxx",
    "accessTokenExpiresAt": "2026-01-05T12:15:00.000Z",
    "refreshToken": "yyy",
    "refreshTokenExpiresAt": "2026-01-12T12:00:00.000Z"
  }
}
```

### POST /api/auth/refresh

Exchanges refresh token for new token pair:

```json
{
  "refreshToken": "yyy"
}
```

Returns new token pair (old refresh token is revoked).

### POST /api/auth/logout

Revokes all refresh tokens for the user.

## Client-Side Usage

### Using the `useTokenRefresh` Hook

```tsx
import { useTokenRefresh } from '@/hooks/use-token-refresh'

function App() {
  const { initializeTokens, clearTokens, getTokens } = useTokenRefresh()

  // After login, save tokens
  useEffect(() => {
    const tokens = await login(email, password)
    initializeTokens(tokens.data.tokens)
  }, [])

  // Tokens will automatically refresh 5 minutes before expiry
}
```

### Manual Token Refresh

```tsx
const { manualRefresh } = useTokenRefresh()

const handleRefresh = async () => {
  const success = await manualRefresh()
  if (!success) {
    // Redirect to login
    router.push('/auth/sign-in?session=expired')
  }
}
```

## Security Features

1. **Token Hashing**: Tokens are hashed using SHA-256 before storage
2. **Token Rotation**: Refresh tokens are rotated on each use
3. **Expiry Tracking**: Both access and refresh tokens have expiry dates
4. **Revocation**: Tokens can be revoked (on logout, suspicious activity)
5. **Audit Trail**: User agent and IP tracking for security monitoring

## Token Storage

- **Server**: Hashed tokens stored in `user_sessions` table
- **Client**: Tokens stored in `localStorage` as `auth_tokens`
- **HttpOnly Cookie**: Session cookie still used for server-side auth

## Automatic Refresh Behavior

The `useTokenRefresh` hook:

1. Checks token expiry on mount
2. Schedules refresh 5 minutes before access token expires
3. Automatically calls `/api/auth/refresh` when needed
4. Redirects to login if refresh token is invalid/expired
5. Cleans up timeouts on unmount

## Cleanup Tasks

Consider setting up a cron job to periodically clean up expired tokens:

```typescript
import { cleanupExpiredTokens, cleanupRevokedTokens } from '@/lib/auth/token.repository'

// Run daily
await cleanupExpiredTokens() // Remove expired tokens
await cleanupRevokedTokens() // Remove revoked tokens
```

## Migration Notes

- Existing sessions continue to work with HttpOnly cookies
- New logins will receive access/refresh tokens
- Token mechanism is backward compatible
- No breaking changes to existing auth flow
