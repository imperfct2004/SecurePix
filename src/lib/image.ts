import { framePayload, HEADER_BYTES, unframePayload } from './payload'

export type PixelImage = { data: Uint8ClampedArray; width: number; height: number }
export function capacityBytes(width: number, height: number): number { return Math.max(0, Math.floor((width * height * 3) / 8) - HEADER_BYTES) }
export function encodePixels(image: PixelImage, payload: Uint8Array): PixelImage {
  const framed = framePayload(payload); const bits = framed.length * 8
  const out = new Uint8ClampedArray(image.data)
  if (out.length !== image.width * image.height * 4 || image.width * image.height > 16_000_000) throw new Error('Image dimensions are invalid or too large.')
  if (bits > image.width * image.height * 3) throw new Error(`Image capacity exceeded. This image can hold ${capacityBytes(image.width, image.height).toLocaleString()} payload bytes.`)
  for (let bit = 0; bit < bits; bit++) {
    const pixelIndex = Math.floor(bit / 3); const channel = bit % 3; const rgba = pixelIndex * 4 + channel
    out[rgba] = (out[rgba] & 0xfe) | ((framed[bit >> 3] >> (7 - (bit & 7))) & 1)
  }
  return { data: out, width: image.width, height: image.height }
}
export function decodePixels(image: PixelImage): Uint8Array {
  if (image.data.length !== image.width * image.height * 4 || image.width * image.height > 16_000_000) throw new Error('Image dimensions are invalid or too large.')
  const header = new Uint8Array(HEADER_BYTES)
  for (let bit = 0; bit < HEADER_BYTES * 8; bit++) { const rgba = Math.floor(bit / 3) * 4 + bit % 3; header[bit >> 3] |= (image.data[rgba] & 1) << (7 - (bit & 7)) }
  if (header[0] !== 0x53 || header[1] !== 0x50 || header[2] !== 0x58 || header[3] !== 0x31) throw new Error('No SecurePix payload was found in this image.')
  const len = new DataView(header.buffer).getUint32(4, false); const totalBits = (HEADER_BYTES + len) * 8
  if (len < 50 || totalBits > image.width * image.height * 3) throw new Error('The SecurePix payload is truncated or has an invalid length.')
  const framed = new Uint8Array(HEADER_BYTES + len); framed.set(header)
  for (let bit = HEADER_BYTES * 8; bit < totalBits; bit++) { const rgba = Math.floor(bit / 3) * 4 + bit % 3; framed[bit >> 3] |= (image.data[rgba] & 1) << (7 - (bit & 7)) }
  return unframePayload(framed)
}
