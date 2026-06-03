import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

export const profileRouter = Router()

profileRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.userId!)
    .single()

  if (error) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }

  res.json(data)
})
