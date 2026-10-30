const cache = new Map<string, Promise<HTMLImageElement>>()

export function loadSheet(src: string): Promise<HTMLImageElement> {
  const existing = cache.get(src)
  if (existing) return existing
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${src}`))
    image.src = src
  })
  cache.set(src, pending)
  return pending
}
