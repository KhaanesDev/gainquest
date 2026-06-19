import { Router } from 'express'

export const exerciseRouter = Router()

const RAPIDAPI_KEY = process.env.EXERCISEDB_KEY ?? ''
const BASE = 'https://exercisedb.p.rapidapi.com'
const RAPIDAPI_HEADERS = {
  'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
  'x-rapidapi-key': RAPIDAPI_KEY,
}

const cache = new Map<string, { data: unknown; ts: number }>()
const TTL = 1000 * 60 * 60 // 1 hour

async function cachedFetch(url: string) {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.ts < TTL) return hit.data

  console.log(`[ExerciseDB] GET ${url}`)
  const res = await fetch(url, { headers: RAPIDAPI_HEADERS })
  console.log(`[ExerciseDB] → ${res.status}`)

  if (!res.ok) {
    const body = await res.text()
    console.error(`[ExerciseDB] body: ${body}`)
    throw Object.assign(new Error(`ExerciseDB ${res.status}`), { status: res.status })
  }

  const data = await res.json()

  // ExerciseDB returns { error: true, message: '...' } on some errors with HTTP 200
  if (!Array.isArray(data)) {
    console.error('[ExerciseDB] Non-array response:', JSON.stringify(data).slice(0, 300))
    const msg = (data as Record<string, unknown>)?.message ?? JSON.stringify(data)
    throw Object.assign(new Error(`API error: ${msg}`), { status: 502 })
  }

  cache.set(url, { data, ts: Date.now() })
  return data
}

// Proxy gifUrl through backend if present
function rewriteGifs(exercises: Record<string, unknown>[]) {
  return exercises.map(ex => ({
    ...ex,
    gifUrl: ex.gifUrl
      ? `/api/exercises/gif?url=${encodeURIComponent(ex.gifUrl as string)}`
      : undefined,
  }))
}

// Primary: bodyPart endpoint (includes gifUrl)
exerciseRouter.get('/bodyPart/:bodyPart', async (req, res) => {
  const { bodyPart } = req.params
  const limit = Math.min(Number(req.query.limit) || 15, 50)
  const url = `${BASE}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=0`

  try {
    const data = await cachedFetch(url) as Record<string, unknown>[]
    res.json(rewriteGifs(data))
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500
    res.status(status).json({ error: String(e) })
  }
})

// Target endpoint — exercises that specifically target a muscle (e.g. "spine"
// for lower back), which the broad bodyPart lists often miss.
exerciseRouter.get('/target/:target', async (req, res) => {
  const { target } = req.params
  const limit = Math.min(Number(req.query.limit) || 20, 50)
  const url = `${BASE}/exercises/target/${encodeURIComponent(target.toLowerCase())}?limit=${limit}&offset=0`

  try {
    const data = await cachedFetch(url) as Record<string, unknown>[]
    res.json(rewriteGifs(data))
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500
    res.status(status).json({ error: String(e) })
  }
})

// Proxy GIF images — browser <img> tags can't add RapidAPI headers
exerciseRouter.get('/gif', async (req, res) => {
  const url = decodeURIComponent((req.query.url as string) ?? '')
  if (!url.startsWith('http')) {
    res.status(400).json({ error: 'Invalid url' })
    return
  }

  try {
    const upstream = await fetch(url, { headers: RAPIDAPI_HEADERS })
    if (!upstream.ok) {
      res.status(upstream.status).end()
      return
    }
    const contentType = upstream.headers.get('Content-Type') ?? 'image/gif'
    res.set('Content-Type', contentType)
    res.set('Cache-Control', 'public, max-age=86400')
    const buffer = await upstream.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) })
  }
})

// Fetch single exercise by id (includes gifUrl)
exerciseRouter.get('/id/:id', async (req, res) => {
  const { id } = req.params
  try {
    const data = await cachedFetch(`${BASE}/exercises/exercise/${id}`)
    res.json(data)
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500
    res.status(status).json({ error: String(e) })
  }
})

exerciseRouter.get('/name/:name', async (req, res) => {
  const { name } = req.params
  const limit = Math.min(Number(req.query.limit) || 8, 15)
  const url = `${BASE}/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=${limit}&offset=0`
  try {
    const data = await cachedFetch(url) as Record<string, unknown>[]
    res.json(rewriteGifs(data))
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500
    res.status(status).json({ error: String(e) })
  }
})

exerciseRouter.get('/bodyParts', async (_req, res) => {
  try {
    const data = await cachedFetch(`${BASE}/exercises/bodyPartList`)
    res.json(data)
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) })
  }
})
