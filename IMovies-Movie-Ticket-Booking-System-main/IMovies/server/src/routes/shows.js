import express from 'express'
import {
  atomicBookSeats,
  createShow,
  deleteShow,
  getShowById,
  getShows,
  getShowsForMovie,
  getTheatreById,
  isShowExpired,
  updateShow,
  validateSeatFormat,
} from '../db/cinemaStore.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// GET /api/shows
router.get('/', async (req, res) => {
  try {
    const shows = await getShows()
    res.json(shows)
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// GET /api/shows/movie/:movieId
router.get('/movie/:movieId', async (req, res) => {
  try {
    const shows = await getShowsForMovie(req.params.movieId)
    // Enrich with theatre details
    const enriched = await Promise.all(
      shows.map(async (show) => {
        const theatre = await getTheatreById(show.theatreId)
        return {
          ...show,
          theatre,
        }
      }),
    )
    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// GET /api/shows/:showId
router.get('/:showId', async (req, res) => {
  try {
    const show = await getShowById(req.params.showId)
    if (!show) {
      return res.status(404).json({ error: 'Not Found', message: 'Showtime not found' })
    }

    const expired = isShowExpired(show)
    if (expired) {
      return res.status(400).json({
        error: 'Expired',
        message: 'This showtime has expired and is no longer available for booking',
        expired: true,
      })
    }

    const theatre = await getTheatreById(show.theatreId)
    res.json({
      ...show,
      theatre,
      expired: false,
    })
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// POST /api/shows/:showId/validate-seats
router.post('/:showId/validate-seats', async (req, res) => {
  try {
    const { seats } = req.body
    const show = await getShowById(req.params.showId)

    if (!show) {
      return res.status(404).json({ error: 'Not Found', message: 'Show not found' })
    }

    if (isShowExpired(show)) {
      return res.status(400).json({
        error: 'Expired',
        message: 'This showtime has expired and cannot be booked',
      })
    }

    const validation = validateSeatFormat(show, seats)
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validation.error,
      })
    }

    // Check availability against live database
    const alreadyBooked = show.bookedSeats || []
    const conflicts = seats.filter((s) => alreadyBooked.includes(s))

    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Seat(s) ${conflicts.join(', ')} are currently unavailable.`,
        conflicts,
      })
    }

    const baseAmount = seats.length * show.price
    const convenienceFee = seats.length > 0 ? 30 : 0
    const totalAmount = baseAmount + convenienceFee

    res.json({
      valid: true,
      seats,
      pricePerSeat: show.price,
      baseAmount,
      convenienceFee,
      totalAmount,
    })
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// POST /api/shows/:showId/book (Atomic Booking - Protected)
router.post('/:showId/book', authenticateToken, async (req, res) => {
  try {
    const { seats, movieTitle, movieId, theatreId, paymentMethod } = req.body

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide at least one seat to book',
      })
    }

    const result = await atomicBookSeats({
      showId: req.params.showId,
      requestedSeats: seats,
      userId: req.user.id,
      movieId,
      theatreId,
      movieTitle,
      paymentMethod: paymentMethod || 'demo_simulator',
    })

    res.status(201).json({
      message: 'Seats booked successfully',
      booking: result.booking,
      show: result.show,
    })
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({
        error: 'Conflict',
        message: err.message,
        conflicts: err.conflicts || [],
      })
    }
    if (err.status === 400 || err.status === 404) {
      return res.status(err.status).json({
        error: err.status === 404 ? 'Not Found' : 'Validation Error',
        message: err.message,
      })
    }
    console.error('[Shows API] Booking error:', err)
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// POST /api/shows (Admin Only - Schedule Showtime)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newShow = await createShow(req.body)
    return res.status(201).json({
      status: 'success',
      message: 'Showtime scheduled successfully',
      show: newShow,
    })
  } catch (err) {
    return res.status(err.status || 400).json({
      error: err.name || 'Bad Request',
      message: err.message,
    })
  }
})

// PUT /api/shows/:id (Admin Only - Update Showtime)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await updateShow(req.params.id, req.body)
    return res.json({
      status: 'success',
      message: 'Showtime updated successfully',
      show: updated,
    })
  } catch (err) {
    return res.status(err.status || 400).json({
      error: err.name || 'Bad Request',
      message: err.message,
    })
  }
})

// DELETE /api/shows/:id (Admin Only - Remove Showtime)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await deleteShow(req.params.id)
    return res.json({
      status: 'success',
      message: 'Showtime removed successfully',
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
