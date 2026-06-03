import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

export const workoutRouter = Router()

workoutRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', req.userId!)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

workoutRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { name, template_id, notes } = req.body as {
    name: string
    template_id?: string
    notes?: string
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: req.userId!,
      name,
      template_id: template_id ?? null,
      notes: notes ?? null,
      started_at: new Date().toISOString(),
      xp_earned: 0,
      gaming_minutes_earned: 0,
    })
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})
