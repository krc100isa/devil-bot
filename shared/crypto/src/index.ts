import sodium from 'libsodium-wrappers';
import { HKDF } from '@stablelib/hkdf';
import { SHA256 } from '@stablelib/sha256';
import { webcrypto } from 'node:crypto';

export type KeyPair = { publicKey: Uint8Array; privateKey: Uint8Array };

export type PreKey = {
  keyId: number;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  signature?: Uint8Array;
};

export type X3DHBundle = {
  identityKey: Uint8Array;
  signedPreKey: PreKey;
  oneTimePreKey?: PreKey;
};

export type RatchetState = {
  rootKey: Uint8Array;
  chainKey: Uint8Array;
  dhPair: KeyPair;
  remoteDh: Uint8Array;
};

export const initSodium = async () => {
  await sodium.ready;
};

export const generateIdentityKey = (): KeyPair => {
  const keyPair = sodium.crypto_kx_keypair();
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
};

export const generatePreKey = (keyId: number): PreKey => {
  const keyPair = sodium.crypto_kx_keypair();
  return { keyId, publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
};

export const signPreKey = (identityPrivateKey: Uint8Array, preKeyPublic: Uint8Array) => {
  return sodium.crypto_sign_detached(preKeyPublic, identityPrivateKey);
};

export const verifyPreKey = (identityPublicKey: Uint8Array, preKeyPublic: Uint8Array, signature: Uint8Array) => {
  return sodium.crypto_sign_verify_detached(signature, preKeyPublic, identityPublicKey);
};

export const deriveX3DHSecret = (params: {
  identityKey: KeyPair;
  remoteIdentityKey: Uint8Array;
  signedPreKey: PreKey;
  remoteSignedPreKey: Uint8Array;
  oneTimePreKey?: PreKey;
  remoteOneTimePreKey?: Uint8Array;
}) => {
  const dh1 = sodium.crypto_scalarmult(params.identityKey.privateKey, params.remoteSignedPreKey);
  const dh2 = sodium.crypto_scalarmult(params.signedPreKey.privateKey, params.remoteIdentityKey);
  const dh3 = sodium.crypto_scalarmult(params.signedPreKey.privateKey, params.remoteSignedPreKey);
  const dhs = [dh1, dh2, dh3];
  if (params.oneTimePreKey && params.remoteOneTimePreKey) {
    const dh4 = sodium.crypto_scalarmult(params.oneTimePreKey.privateKey, params.remoteOneTimePreKey);
    dhs.push(dh4);
  }
  const inputKeyMaterial = concatBytes(dhs);
  return hkdf(inputKeyMaterial, new Uint8Array(32), 'SecureChat-X3DH');
};

export const initRatchet = (rootKey: Uint8Array, dhPair: KeyPair, remoteDh: Uint8Array): RatchetState => {
  const dh = sodium.crypto_scalarmult(dhPair.privateKey, remoteDh);
  const derived = hkdf(dh, rootKey, 'SecureChat-Ratchet');
  return {
    rootKey: derived.slice(0, 32),
    chainKey: derived.slice(32, 64),
    dhPair,
    remoteDh
  };
};

export const ratchetStep = (state: RatchetState, newRemoteDh: Uint8Array) => {
  const newDhPair = sodium.crypto_kx_keypair();
  const dh = sodium.crypto_scalarmult(newDhPair.privateKey, newRemoteDh);
  const derived = hkdf(dh, state.rootKey, 'SecureChat-Ratchet');
  return {
    rootKey: derived.slice(0, 32),
    chainKey: derived.slice(32, 64),
    dhPair: { publicKey: newDhPair.publicKey, privateKey: newDhPair.privateKey },
    remoteDh: newRemoteDh
  } satisfies RatchetState;
};

export const nextMessageKey = (state: RatchetState) => {
  const messageKey = hkdf(state.chainKey, new Uint8Array(32), 'SecureChat-MessageKey');
  return {
    messageKey: messageKey.slice(0, 32),
    nextChainKey: messageKey.slice(32, 64)
  };
};

export const encryptMessage = async (messageKey: Uint8Array, plaintext: Uint8Array) => {
  const nonce = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await webcrypto.subtle.importKey('raw', messageKey, 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, plaintext)
  );
  return { ciphertext, nonce };
};

export const decryptMessage = async (messageKey: Uint8Array, ciphertext: Uint8Array, nonce: Uint8Array) => {
  const key = await webcrypto.subtle.importKey('raw', messageKey, 'AES-GCM', false, ['decrypt']);
  const plaintext = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, ciphertext);
  return new Uint8Array(plaintext);
};

const hkdf = (ikm: Uint8Array, salt: Uint8Array, info: string) => {
  const hkdf = new HKDF(SHA256, ikm, salt, new TextEncoder().encode(info));
  return hkdf.expand(64);
};

const concatBytes = (chunks: Uint8Array[]) => {
  const total = chunks.reduce((sum, item) => sum + item.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
};
