import { Router } from 'express'

export const authRouter = Router()

authRouter.get('/me', (_req, res) => {
  res.json({ message: 'Auth is handled by Supabase client-side' })
})
