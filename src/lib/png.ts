export function canvasPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Could not generate PNG.'))
      if (blob.type !== 'image/png') return reject(new Error('The output image was not a valid PNG.'))
      resolve(blob)
    }, 'image/png')
  })
}
