# SecurePix

**Secure Image Steganography and Encryption System** is an academic web application for Information and Network Security. It encrypts a confidential text message with AES-GCM and embeds the encrypted payload in a PNG using least significant bit (LSB) steganography. Encoding and decoding are performed locally in the browser.

**Developer:** Shivakumar M.R.  
**Department:** Information Science and Engineering  
**Semester:** 7th Semester  
**Subject:** Information and Network Security

## Abstract and problem statement

Messages sent digitally can be exposed, and encryption alone does not conceal that a message exists. SecurePix demonstrates two complementary techniques: authenticated encryption protects message contents, while image steganography attempts to conceal the encrypted payload in a carrier image. It is an educational demonstration and does not promise undetectable steganography or production certification.

## Objectives and features

- Encrypt non-empty UTF-8 text, including Unicode and emoji, with AES-256-GCM.
- Derive an encryption key from a user password using PBKDF2-SHA-256 and a random 16-byte salt (310,000 iterations).
- Use a random 12-byte nonce and a 128-bit GCM authentication tag for every encryption.
- Embed a versioned payload in RGB least significant bits and export a PNG.
- Extract, validate, and authenticate the payload before displaying recovered text.
- Validate image type, actual decoding, 5 MB cover-image upload size, and 16 megapixel dimensions. Decode accepts PNG/JPEG/WebP files up to 70 MB so larger generated PNGs can be re-uploaded; the same 16 megapixel limit applies.
- Keep messages, passwords, keys, and images in browser memory only. No server, storage, analytics, or external runtime requests are used.

## Technology stack

React, TypeScript, Vite, React Router, Lucide React, Web Crypto API (PBKDF2 and AES-GCM), Canvas API, Browser File API, Vitest, and jsdom.

## System architecture

`src/App.tsx` contains the page routes, shared navigation, and encode/decode user flows. `src/lib/crypto.ts` owns key derivation and authenticated encryption. `src/lib/payload.ts` defines payload metadata serialization, parsing, and framing. `src/lib/image.ts` owns deterministic RGB-only LSB embedding, extraction, and capacity calculation. `src/lib/core.test.ts` tests security and image primitives.

## Encryption methodology

Text is encoded with `TextEncoder`. A 16-byte random salt and 12-byte random nonce are generated with `crypto.getRandomValues`. PBKDF2-HMAC-SHA-256 derives an AES-256 key at 310,000 iterations. AES-GCM encrypts the text and appends the 128-bit authentication tag. The payload metadata contains format version, KDF identifier, iteration count (big-endian unsigned 32-bit), salt, nonce, and ciphertext-plus-tag. The outer frame contains the four ASCII bytes `SPX1` and a big-endian payload byte length.

On decode, the format and bounded KDF parameters are validated before deriving the key. Web Crypto authenticates before returning plaintext. Invalid tags, wrong passwords, and invalid UTF-8 are errors; plaintext is displayed only after successful authentication and strict UTF-8 decoding.

## Steganography methodology and capacity

The framed payload is traversed from the first pixel, in row-major order, taking red, green, and blue channels in that order and skipping alpha. Payload bits are written most-significant-bit first to each channel's least significant bit. The decoder follows the same traversal. Capacity is `floor(width × height × 3 / 8) - 8` payload bytes; the 8-byte frame header is reserved. Encoding rejects payloads that do not fit. The carrier is exported as PNG.

Resizing, cropping, lossy compression, or other pixel modifications may destroy embedded data. LSB steganography can be detected and does not guarantee concealment. AES-GCM protects the secret contents even if the payload is found, assuming a strong password and uncompromised browser/device.

## Installation and usage

Requires Node.js 20 or later and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Select **Encode**, choose a PNG/JPEG/WebP image, enter a message and matching password, then download `securepix_encoded.png`. To recover the message, select **Decode**, upload the original downloaded PNG, and enter the same password. Share the password separately. The app uses browser cryptography, which requires a secure context (localhost or HTTPS).

## Tests and production build

```bash
npm test
npm run build
```

The tests cover UTF-8 and emoji round trips, wrong-password and modified-ciphertext authentication failures, random salts/nonces, payload framing, ordinary image rejection, capacity enforcement, and capacity calculations. Browser-only upload checks and network isolation are additionally enforced in the application architecture; there is no upload endpoint or analytics code.

## Limitations and future enhancements

The current version encodes sequentially into RGB LSBs and does not resist statistical steganalysis. Payload size is limited by the selected image; cover images are limited to 5 MB and decoded images to 70 MB, with a 16 megapixel dimension limit for browser memory use. Password strength depends on user choice. Browser/device compromise and malicious extensions are outside the application's protection. Future academic work could compare embedding strategies, add reproducible browser integration tests, and study image-analysis detection.

## Security and privacy considerations

No password, key, image, or plaintext is persisted in localStorage, sessionStorage, cookies, or a server. The app makes no runtime network requests. Object URLs are revoked when inputs/results are cleared or the page is left. A strong password should be shared through a separate secure channel. Use the downloaded PNG unchanged and do not treat SecurePix as a substitute for a reviewed security product.
