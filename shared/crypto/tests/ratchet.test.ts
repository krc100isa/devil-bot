import { describe, expect, it, beforeAll } from 'vitest';
import {
  initSodium,
  generateIdentityKey,
  generatePreKey,
  signPreKey,
  deriveX3DHSecret,
  initRatchet,
  nextMessageKey,
  encryptMessage,
  decryptMessage
} from '../src/index';

beforeAll(async () => {
  await initSodium();
});

describe('SecureChat crypto', () => {
  it('derives shared secret and encrypts/decrypts', async () => {
    const aliceIdentity = generateIdentityKey();
    const bobIdentity = generateIdentityKey();
    const aliceSignedPreKey = generatePreKey(1);
    const bobSignedPreKey = generatePreKey(1);

    const signature = signPreKey(bobIdentity.privateKey, bobSignedPreKey.publicKey);
    bobSignedPreKey.signature = signature;

    const aliceSecret = deriveX3DHSecret({
      identityKey: aliceIdentity,
      remoteIdentityKey: bobIdentity.publicKey,
      signedPreKey: aliceSignedPreKey,
      remoteSignedPreKey: bobSignedPreKey.publicKey
    });

    const bobSecret = deriveX3DHSecret({
      identityKey: bobIdentity,
      remoteIdentityKey: aliceIdentity.publicKey,
      signedPreKey: bobSignedPreKey,
      remoteSignedPreKey: aliceSignedPreKey.publicKey
    });

    expect(Buffer.from(aliceSecret).toString('hex')).toEqual(Buffer.from(bobSecret).toString('hex'));

    const aliceRatchet = initRatchet(aliceSecret.slice(0, 32), aliceIdentity, bobIdentity.publicKey);
    const bobRatchet = initRatchet(bobSecret.slice(0, 32), bobIdentity, aliceIdentity.publicKey);

    const aliceMessage = nextMessageKey(aliceRatchet);
    const bobMessage = nextMessageKey(bobRatchet);

    const plaintext = new TextEncoder().encode('hello secure world');
    const { ciphertext, nonce } = await encryptMessage(aliceMessage.messageKey, plaintext);
    const decrypted = await decryptMessage(bobMessage.messageKey, ciphertext, nonce);

    expect(new TextDecoder().decode(decrypted)).toEqual('hello secure world');
  });
});
