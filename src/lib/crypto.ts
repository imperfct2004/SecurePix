import { ITERATIONS, NONCE_BYTES, SALT_BYTES, parsePayload, serializePayload } from './payload'

function webCrypto(): Crypto {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) throw new Error('Secure browser cryptography is unavailable. Use HTTPS or localhost.')
  return globalThis.crypto
}
async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const c = webCrypto(); const material = await c.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
  return c.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
export async function encryptMessage(message: string, password: string): Promise<Uint8Array> {
  if (!message.length) throw new Error('Enter a message before encrypting.')
  if (!password.length) throw new Error('Enter a password before encrypting.')
  const c = webCrypto(); const salt = c.getRandomValues(new Uint8Array(SALT_BYTES)); const nonce = c.getRandomValues(new Uint8Array(NONCE_BYTES))
  const key = await deriveKey(password, salt, ITERATIONS)
  const encrypted = await c.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, key, new TextEncoder().encode(message))
  return serializePayload(ITERATIONS, salt, nonce, new Uint8Array(encrypted))
}
export async function decryptMessage(payloadBytes: Uint8Array, password: string): Promise<string> {
  if (!password.length) throw new Error('Enter the password used to encrypt this message.')
  const payload = parsePayload(payloadBytes); const key = await deriveKey(password, payload.salt, payload.iterations)
  let plaintext: ArrayBuffer
  try { plaintext = await webCrypto().subtle.decrypt({ name: 'AES-GCM', iv: payload.nonce, tagLength: 128 }, key, payload.ciphertext) }
  catch { throw new Error('Decryption failed. Check the password or use an unmodified encoded image.') }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(plaintext) }
  catch { throw new Error('The decrypted message is not valid UTF-8 text.') }
}
