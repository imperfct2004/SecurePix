export function validateEncodeForm(imageSelected: boolean, message: string, password: string, confirmation: string): string | null {
  if (!imageSelected) return 'Choose a cover image first.'
  if (!message.trim()) return 'Enter a message before encrypting.'
  if (!password) return 'Enter a password before encrypting.'
  if (password !== confirmation) return 'The password fields do not match.'
  return null
}

export function validateImageDetails(type: string, size: number, width: number, height: number, maxBytes = 5 * 1024 * 1024, sizeLabel = '5 MB'): string | null {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(type)) return 'Choose a PNG, JPEG, or WebP image.'
  if (!Number.isFinite(size) || size <= 0 || size > maxBytes) return `Images must be larger than zero and ${sizeLabel} or smaller.`
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return 'This file could not be decoded as an image.'
  if (width * height > 16_000_000) return 'This image is too large to process. Maximum dimensions are 16 megapixels.'
  return null
}
