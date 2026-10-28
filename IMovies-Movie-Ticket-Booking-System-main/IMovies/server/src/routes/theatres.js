import express from 'express'
import {
  createTheatre,
  deleteTheatre,
  getTheatreById,
  getTheatres,
  updateTheatre,
} from '../db/cinemaStore.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// GET /api/theatres
router.get('/', async (req, res) => {
  try {
    const theatres = await getTheatres()
    res.json(theatres)
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// GET /api/theatres/:id
router.get('/:id', async (req, res) => {
  try {
    const theatre = await getTheatreById(req.params.id)
    if (!theatre) {
      return res.status(404).json({ error: 'Not Found', message: 'Theatre not found' })
    }
    res.json(theatre)
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// POST /api/theatres (Admin Only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newTheatre = await createTheatre(req.body)
    return res.status(201).json({
      status: 'success',
      message: `Theatre "${newTheatre.name}" added successfully`,
      theatre: newTheatre,
    })
  } catch (err) {
    return res.status(err.status || 400).json({
      error: err.name || 'Bad Request',
      message: err.message,
    })
  }
})

// PUT /api/theatres/:id (Admin Only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await updateTheatre(req.params.id, req.body)
    return res.json({
      status: 'success',
      message: `Theatre "${updated.name}" updated successfully`,
      theatre: updated,
    })
  } catch (err) {
    return res.status(err.status || 400).json({
      error: err.name || 'Bad Request',
      message: err.message,
    })
  }
})

// DELETE /api/theatres/:id (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await deleteTheatre(req.params.id)
    return res.json({
      status: 'success',
      message: `Theatre "${deleted.name}" removed successfully`,
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
