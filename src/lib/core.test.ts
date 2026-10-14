import { describe, expect, it, vi } from 'vitest'
import { decryptMessage, encryptMessage } from './crypto'
import { capacityBytes, decodePixels, encodePixels } from './image'
import { framePayload, unframePayload } from './payload'
import { validateEncodeForm, validateImageDetails } from './validation'
import { canvasPngBlob } from './png'

function carrier(width=400,height=400) { return { width,height,data:new Uint8ClampedArray(width*height*4).fill(128) } }
describe('SecurePix crypto and payload',()=>{
 it('round trips normal and Unicode messages',async()=>{for(const text of ['hello secure world','नमस्ते 👋🌍 — café']){const p=await encryptMessage(text,'correct horse battery staple');expect(await decryptMessage(p,'correct horse battery staple')).toBe(text)}})
 it('rejects a wrong password and modified authenticated ciphertext',async()=>{const p=await encryptMessage('secret text','good password');await expect(decryptMessage(p,'wrong password')).rejects.toThrow(/Decryption failed/);const altered=p.slice();altered[altered.length-1]^=1;await expect(decryptMessage(altered,'good password')).rejects.toThrow(/Decryption failed/)})
 it('rejects empty messages and passwords',async()=>{await expect(encryptMessage('','pw')).rejects.toThrow();await expect(encryptMessage('message','')).rejects.toThrow()})
 it('creates fresh salt and nonce on repeated encryptions',async()=>{const a=await encryptMessage('same','same password'),b=await encryptMessage('same','same password');expect(Array.from(a.slice(6,34))).not.toEqual(Array.from(b.slice(6,34)))})
 it('frames and validates payload lengths',()=>{const payload=new Uint8Array(50).fill(9);expect(unframePayload(framePayload(payload))).toEqual(payload);const bad=framePayload(payload).slice(0,20);expect(()=>unframePayload(bad)).toThrow(/truncated/)})
 it('rejects a corrupted payload magic identifier',()=>{const framed=framePayload(new Uint8Array(50));framed[0]^=1;expect(()=>unframePayload(framed)).toThrow(/No SecurePix/);expect(()=>decodePixels(carrier(20,20))).toThrow(/No SecurePix/)})
 it('rejects empty and mismatched password confirmation',()=>{expect(validateEncodeForm(true,'message','','')).toMatch(/password/);expect(validateEncodeForm(true,'message','one','two')).toMatch(/do not match/)})
 it('rejects empty message and missing cover image at form validation',()=>{expect(validateEncodeForm(false,'message','password','password')).toMatch(/cover image/);expect(validateEncodeForm(true,'  ','password','password')).toMatch(/message/)})
 it('rejects unsupported, oversized, and invalid image files without throwing',()=>{expect(validateImageDetails('application/pdf',12,10,10)).toMatch(/PNG/);expect(validateImageDetails('image/png',6*1024*1024,10,10)).toMatch(/5 MB/);expect(validateImageDetails('image/png',12,0,10)).toMatch(/decoded/);expect(validateImageDetails('image/png',12,5000,4000)).toMatch(/16 megapixels/)})
 it('accepts PNG output blobs and rejects non-PNG output',async()=>{const canvas=document.createElement('canvas');canvas.toBlob=((callback)=>callback(new Blob(['png bytes'],{type:'image/png'}))) as typeof canvas.toBlob;expect((await canvasPngBlob(canvas)).type).toBe('image/png');canvas.toBlob=((callback)=>callback(new Blob(['not png'],{type:'image/jpeg'}))) as typeof canvas.toBlob;await expect(canvasPngBlob(canvas)).rejects.toThrow(/valid PNG/)})
 it('does not make network requests during local crypto operations',async()=>{const prior=globalThis.fetch;const fetchSpy=vi.fn();globalThis.fetch=fetchSpy;try{const cipher=await encryptMessage('local only','strong password');expect(await decryptMessage(cipher,'strong password')).toBe('local only');expect(fetchSpy).not.toHaveBeenCalled()}finally{if(prior)globalThis.fetch=prior;else delete (globalThis as {fetch?:typeof fetch}).fetch}})
})
describe('LSB image steganography',()=>{
 it('round trips an encrypted payload while preserving dimensions',()=>{const image=carrier();const payload=framePayload(new Uint8Array(50).fill(42)).slice(8);const encoded=encodePixels(image,payload);expect(decodePixels(encoded)).toEqual(payload);expect(encoded.width).toBe(image.width)})
 it('rejects ordinary images and payloads above capacity',()=>{expect(()=>decodePixels(carrier(20,20))).toThrow(/No SecurePix/);expect(()=>encodePixels(carrier(8,8),new Uint8Array(30))).toThrow(/capacity exceeded/)})
 it('calculates exact usable capacity',()=>{expect(capacityBytes(8,8)).toBe(16);expect(capacityBytes(100,100)).toBe(3742)})
 it('rejects empty passwords in decryption and malformed headers',async()=>{await expect(decryptMessage(new Uint8Array(50),'')).rejects.toThrow(/password/);expect(()=>unframePayload(new Uint8Array(8))).toThrow(/No SecurePix/)})
})
