export const MAGIC = new Uint8Array([0x53, 0x50, 0x58, 0x31]) // SPX1
export const VERSION = 1
export const ITERATIONS = 310_000
export const SALT_BYTES = 16
export const NONCE_BYTES = 12
export const TAG_BYTES = 16
// Payload: version(1), KDF id(1), iterations(u32 BE), salt(16), nonce(12), ciphertext+GCM tag.
export const META_BYTES = 34
export const HEADER_BYTES = 8 // magic(4), payload length(u32 BE)
export const MAX_PIXELS = 16_000_000
export type ParsedPayload = { iterations: number; salt: Uint8Array; nonce: Uint8Array; ciphertext: Uint8Array }

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let offset = 0
  for (const part of parts) { out.set(part, offset); offset += part.length }
  return out
}

export function serializePayload(iterations: number, salt: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 2_000_000) throw new Error('Invalid key derivation parameters.')
  if (salt.length !== SALT_BYTES || nonce.length !== NONCE_BYTES || ciphertext.length < TAG_BYTES) throw new Error('Invalid encrypted payload fields.')
  const out = new Uint8Array(META_BYTES + ciphertext.length); const view = new DataView(out.buffer)
  out[0] = VERSION; out[1] = 1; view.setUint32(2, iterations, false); out.set(salt, 6); out.set(nonce, 22); out.set(ciphertext, META_BYTES)
  return out
}

export function parsePayload(data: Uint8Array): ParsedPayload {
  if (data.length < META_BYTES + TAG_BYTES) throw new Error('The SecurePix payload is truncated.')
  if (data[0] !== VERSION) throw new Error('This SecurePix image uses an unsupported payload version.')
  if (data[1] !== 1) throw new Error('This image uses an unsupported key derivation method.')
  const iterations = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(2, false)
  if (iterations < 100_000 || iterations > 2_000_000) throw new Error('The encrypted payload has invalid security parameters.')
  return { iterations, salt: data.slice(6, 22), nonce: data.slice(22, 34), ciphertext: data.slice(META_BYTES) }
}

export function framePayload(payload: Uint8Array): Uint8Array {
  if (payload.length > 0xffffffff) throw new Error('Encrypted payload is too large.')
  const header = new Uint8Array(HEADER_BYTES); header.set(MAGIC); new DataView(header.buffer).setUint32(4, payload.length, false)
  return concatBytes(header, payload)
}

export function unframePayload(bytes: Uint8Array): Uint8Array {
  if (bytes.length < HEADER_BYTES) throw new Error('No SecurePix payload was found in this image.')
  if (!MAGIC.every((v, i) => bytes[i] === v)) throw new Error('No SecurePix payload was found in this image.')
  const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, false)
  if (length < META_BYTES + TAG_BYTES || length > bytes.length - HEADER_BYTES) throw new Error('The SecurePix payload is truncated or has an invalid length.')
  return bytes.slice(HEADER_BYTES, HEADER_BYTES + length)
}
