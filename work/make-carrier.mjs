import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const width = 600, height = 400
const raw = Buffer.alloc((width * 4 + 1) * height)
for (let y = 0; y < height; y++) {
  const row = y * (width * 4 + 1); raw[row] = 0
  for (let x = 0; x < width; x++) {
    const i = row + 1 + x * 4
    raw[i] = 70 + Math.round(40 * y / height); raw[i + 1] = 115 + Math.round(40 * x / width); raw[i + 2] = 170; raw[i + 3] = 255
  }
}
const crcTable = Array.from({ length: 256 }, (_, n) => { let c=n; for(let k=0;k<8;k++) c=(c&1)?0xedb88320^(c>>>1):c>>>1; return c>>>0 })
function crc(buffer) { let c=0xffffffff; for(const b of buffer)c=crcTable[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0 }
function chunk(name, data) { const type=Buffer.from(name); const length=Buffer.alloc(4);length.writeUInt32BE(data.length);const checksum=Buffer.alloc(4);checksum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([length,type,data,checksum]) }
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))])
writeFileSync(new URL('./carrier.png', import.meta.url), png)
