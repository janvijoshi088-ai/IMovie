import express from 'express'
import {
  createMovie,
  deleteMovie,
  getMovieById,
  getMovies,
  updateMovie,
} from '../db/cinemaStore.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// GET /api/movies (Public)
router.get('/', async (req, res) => {
  try {
    const { q, genre, language, featured } = req.query
    const movies = await getMovies({ query: q, genre, language, featured })
    return res.json({
      status: 'success',
      count: movies.length,
      movies,
    })
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    })
  }
})

// GET /api/movies/:id (Public)
router.get('/:id', async (req, res) => {
  try {
    const movie = await getMovieById(req.params.id)
    if (!movie) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Movie with ID "${req.params.id}" not found`,
      })
    }
    return res.json({
      status: 'success',
      movie,
    })
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    })
  }
})

// POST /api/movies (Admin Only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newMovie = await createMovie(req.body)
    return res.status(201).json({
      status: 'success',
      message: `Movie "${newMovie.title}" created successfully`,
      movie: newMovie,
    })
  } catch (err) {
    return res.status(err.status || 400).json({
      error: err.name || 'Bad Request',
      message: err.message,
    })
  }
})

// PUT /api/movies/:id (Admin Only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await updateMovie(req.params.id, req.body)
    return res.json({
      status: 'success',
      message: `Movie "${updated.title}" updated successfully`,
      movie: updated,
    })
  } catch (err) {
    return res.status(err.status || 400).json({
      error: err.name || 'Bad Request',
      message: err.message,
    })
  }
})

// DELETE /api/movies/:id (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await deleteMovie(req.params.id)
    return res.json({
      status: 'success',
      message: `Movie "${deleted.title}" deleted successfully`,
      deletedId: deleted.id,
    })
  } catch (err) {
    return res.status(err.status || 400).json({
      error: err.name || 'Bad Request',
      message: err.message,
    })
  }
})

export default router
