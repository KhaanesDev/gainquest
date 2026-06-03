import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'
import { workoutRouter } from './routes/workouts.js'
import { profileRouter } from './routes/profiles.js'
import { exerciseRouter } from './routes/exercises.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/workouts', workoutRouter)
app.use('/api/profiles', profileRouter)
app.use('/api/exercises', exerciseRouter)

app.listen(PORT, () => {
  console.log(`GainQuest backend running on port ${PORT}`)
  console.log('Routes: /health  /api/auth  /api/workouts  /api/profiles  /api/exercises')
  console.log('ExerciseDB key loaded:', !!process.env.EXERCISEDB_KEY)
})
