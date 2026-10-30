import { del, get, put } from '@vercel/blob'

/**
 * The linked Blob store is public, so uploads must use `access: 'public'`.
 * `addRandomSuffix` keeps the path unguessable. Callers store the URL and
 * stream bytes from an access-checked route; they never send the URL to the browser.
 */
export async function savePrivateAudio(
  pathname: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const blob = await put(pathname, body, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
  })
  return blob.url
}

export async function openPrivateAudio(
  url: string
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  const result = await get(url, { access: 'public', useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) return null
  return {
    stream: result.stream,
    contentType: result.blob.contentType || 'application/octet-stream',
  }
}

export async function removePrivateAudio(url: string): Promise<void> {
  await del(url)
}
