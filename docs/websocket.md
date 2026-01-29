# SecureChat WebSocket Events

Transport: Socket.io

## Connection
- `connection:authenticate`
- `connection:authenticated`
- `connection:ping`
- `connection:pong`

## Messaging
- `message:send`
- `message:sent`
- `message:received`
- `message:delivery`
- `message:read`
- `message:read_receipt`
- `message:edit`
- `message:delete`
- `message:reaction`

## Presence
- `presence:subscribe`
- `presence:update`
- `typing:start`
- `typing:stop`
- `typing:update`

## Calls
- `call:initiate`
- `call:incoming`
- `call:accept`
- `call:reject`
- `call:end`
- `call:ice_candidate`
- `call:sdp_offer`
- `call:sdp_answer`
