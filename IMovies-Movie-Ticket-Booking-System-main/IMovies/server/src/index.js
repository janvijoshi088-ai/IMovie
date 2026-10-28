import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { initCinemaStore } from './db/cinemaStore.js'
import { initDatabase } from './db/userStore.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import bookingsRoutes from './routes/bookings.js'
import moviesRoutes from './routes/movies.js'
import showsRoutes from './routes/shows.js'
import theatresRoutes from './routes/theatres.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
)
app.use(express.json())

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'IMovies API is running',
  })
})

// Authentication & Core Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/movies', moviesRoutes)
app.use('/api/theatres', theatresRoutes)
app.use('/api/shows', showsRoutes)
app.use('/api/bookings', bookingsRoutes)

// Global 404 handler for unmatched routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Not Found',
      message: `API route ${req.originalUrl} not found`,
    })
  }
  res.status(404).send('Not Found')
})

// Initialize DB and start server
let serverInstance = null

export async function startServer() {
  await initDatabase()
  await initCinemaStore()
  return new Promise((resolve) => {
    serverInstance = app.listen(port, () => {
      console.log(`IMovies server listening on http://localhost:${port}`)
      resolve(serverInstance)
    })
  })
}

// Auto-start if run directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  startServer()
}

export default app
