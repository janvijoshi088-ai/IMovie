import express from 'express'
import {
  atomicBookSeats,
  atomicCancelBooking,
  getBookingById,
  getMovieById,
  getShowById,
  getTheatreById,
  getUserBookings,
} from '../db/cinemaStore.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// POST /api/bookings (Create a booking - Authenticated Customer)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { showId, seats, movieId, theatreId, movieTitle, paymentMethod } = req.body

    if (!showId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Show ID is required to create a booking',
      })
    }

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide at least one seat to book',
      })
    }

    const result = await atomicBookSeats({
      showId,
      requestedSeats: seats,
      userId: req.user.id,
      movieId,
      theatreId,
      movieTitle,
      paymentMethod: paymentMethod || 'demo_simulator',
    })

    return res.status(201).json({
      status: 'success',
      message: 'Booking created successfully',
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
    return res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// GET /api/bookings (Authenticated Customer's Booking History)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bookings = await getUserBookings(req.user.id)
    const today = new Date().toISOString().split('T')[0]

    const enriched = bookings.map((b) => {
      const isPast = b.date < today
      return {
        ...b,
        isPast,
        isUpcoming: !isPast && b.status === 'confirmed',
      }
    })

    res.json({ status: 'success', bookings: enriched })
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// GET /api/bookings/my-bookings (Authenticated Customer's Booking History)
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await getUserBookings(req.user.id)
    const today = new Date().toISOString().split('T')[0]

    // Categorize upcoming vs past
    const enriched = bookings.map((b) => {
      const isPast = b.date < today
      return {
        ...b,
        isPast,
        isUpcoming: !isPast && b.status === 'confirmed',
      }
    })

    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// GET /api/bookings/:id (Retrieve Single Booking Details - Protected)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Booking reference "${req.params.id}" not found`,
      })
    }

    // Verify ownership (Customer can only view own bookings, admin can view all)
    const isAdmin = req.user.role === 'admin'
    if (!isAdmin && booking.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You do not have permission to view this booking',
      })
    }

    // Enrich with current movie and theatre details
    const movie = await getMovieById(booking.movieId)
    const theatre = await getTheatreById(booking.theatreId)
    const show = await getShowById(booking.showId)

    res.json({
      status: 'success',
      booking,
      movie,
      theatre,
      show,
    })
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
})

// POST /api/bookings/:id/cancel (Cancel an Upcoming Booking - Protected)
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin'
    const result = await atomicCancelBooking({
      bookingId: req.params.id,
      userId: req.user.id,
      isAdmin,
    })

    res.json({
      status: 'success',
      message: result.message,
      booking: result.booking,
    })
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.name || 'Error',
      message: err.message,
    })
  }
})

export default router
