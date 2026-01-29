# SecureChat E2EE Crypto Format

## Key Hierarchy
- Identity Key (X25519)
- Signed PreKey (X25519)
- One-Time PreKeys (X25519)

## X3DH
Shared secret is derived from DH1..DH4 with HKDF-SHA256 (`SecureChat-X3DH`).

## Double Ratchet
- Root key + chain key from HKDF with `SecureChat-Ratchet`
- Per-message keys via HKDF with `SecureChat-MessageKey`

## Message Format
```
{
  header: {
    dh_pub: <bytes>,
    previous_chain_length: <int>,
    message_index: <int>
  },
  ciphertext: <bytes>,
  nonce: <12 bytes>,
  auth_tag: <gcm tag>
}
```

## Notes
Server stores only ciphertext/nonce/ephemeral keys.
