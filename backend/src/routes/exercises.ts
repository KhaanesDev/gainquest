import { Router } from 'express'

export const exerciseRouter = Router()

const RAPIDAPI_KEY = process.env.EXERCISEDB_KEY ?? ''
const BASE = 'https://exercisedb.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
  'x-rapidapi-key': RAPIDAPI_KEY,
}

const cache = new Map<string, { data: unknown; ts: number }>()
const TTL = 1000 * 60 * 60 // 1 hour

async function cachedFetch(url: string) {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.ts < TTL) return hit.data

  console.log(`[ExerciseDB] GET ${url}`)
  const res = await fetch(url, { headers: HEADERS })
  console.log(`[ExerciseDB] → ${res.status}`)

  if (!res.ok) {
    const body = await res.text()
    console.error(`[ExerciseDB] body: ${body}`)
    throw Object.assign(new Error(`ExerciseDB ${res.status}`), { status: res.status })
  }

  const data = await res.json()
  cache.set(url, { data, ts: Date.now() })
  return data
}

exerciseRouter.get('/bodyPart/:bodyPart', async (req, res) => {
  const { bodyPart } = req.params
  const limit = Math.min(Number(req.query.limit) || 15, 50)
  const url = `${BASE}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=0`

  try {
    const data = await cachedFetch(url)
    res.json(data)
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500
    res.status(status).json({ error: String(e) })
  }
})

// Utility: list valid body parts (useful for debugging)
exerciseRouter.get('/bodyParts', async (_req, res) => {
  try {
    const data = await cachedFetch(`${BASE}/exercises/bodyPartList`)
    res.json(data)
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) })
  }
})
