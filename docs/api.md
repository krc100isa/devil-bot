# SecureChat REST API (v1)

All API requests are routed through the API Gateway (`/api/v1/*`). Authentication is via JWT (RS256).

## Auth
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/verify-otp`
- POST `/api/v1/auth/refresh`
- POST `/api/v1/auth/logout`

## Users
- GET `/api/v1/users/me`
- PUT `/api/v1/users/me`
- GET `/api/v1/users/{user_id}`
- GET `/api/v1/users/search?q=`
- PUT `/api/v1/users/me/privacy`

## Contacts
- GET `/api/v1/contacts`
- POST `/api/v1/contacts`
- PUT `/api/v1/contacts/{contact_id}`
- DELETE `/api/v1/contacts/{contact_id}?action=block|delete`
- POST `/api/v1/contacts/sync`

## Conversations
- GET `/api/v1/conversations`
- POST `/api/v1/conversations`
- GET `/api/v1/conversations/{conversation_id}`
- PUT `/api/v1/conversations/{conversation_id}`
- DELETE `/api/v1/conversations/{conversation_id}`
- POST `/api/v1/conversations/{conversation_id}/participants`
- DELETE `/api/v1/conversations/{conversation_id}/participants/{user_id}`
- PUT `/api/v1/conversations/{conversation_id}/participants/{user_id}/role`
- POST `/api/v1/conversations/{conversation_id}/leave`

## Messages
- GET `/api/v1/conversations/{conversation_id}/messages`
- GET `/api/v1/messages/{message_id}`
- PUT `/api/v1/messages/{message_id}`
- DELETE `/api/v1/messages/{message_id}?mode=self|everyone`
- POST `/api/v1/messages/{message_id}/reactions`
- DELETE `/api/v1/messages/{message_id}/reactions/{emoji}`
- POST `/api/v1/conversations/{conversation_id}/messages/search`
- POST `/api/v1/messages/read`
- POST `/api/v1/messages`

## Media
- POST `/api/v1/media/upload-url`
- POST `/api/v1/media/complete`
- GET `/api/v1/media/{file_id}/download`

## Calls
- GET `/api/v1/calls`
- GET `/api/v1/calls/{call_id}`
- DELETE `/api/v1/calls/{call_id}`
