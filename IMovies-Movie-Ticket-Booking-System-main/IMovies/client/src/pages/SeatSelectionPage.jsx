import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import useAuth from '../context/useAuth'
import SeatMap from '../components/seats/SeatMap'
import Button from '../components/ui/Button'
import DemoBanner from '../components/ui/DemoBanner'
import PageHeader from '../components/ui/PageHeader'
import {
  formatShowDate,
  getMovieById,
  getShowById,
  getTheatreById,
  seatRows as defaultRows,
  seatsPerRow as defaultSeatsPerRow,
} from '../data/sampleData'

function SeatSelectionPage() {
  const { movieId, showId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const fallbackMovie = getMovieById(movieId)
  const fallbackShow = getShowById(showId)
  const fallbackTheatre = fallbackShow ? getTheatreById(fallbackShow.theatreId) : null

  const [movie, setMovie] = useState(fallbackMovie)
  const [show, setShow] = useState(fallbackShow)
  const [theatre, setTheatre] = useState(fallbackTheatre)
  const [bookedSeats, setBookedSeats] = useState(fallbackShow?.bookedSeats || [])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  // Demo Payment Simulator State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [demoPaymentMethod, setDemoPaymentMethod] = useState('demo_upi')
  const [processingPayment, setProcessingPayment] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [showRes, movieRes] = await Promise.all([
          api.get(`/shows/${showId}`).catch((err) => err.response || null),
          api.get(`/movies/${movieId}`).catch(() => null),
        ])

        if (isMounted) {
          if (showRes?.status === 200 && showRes.data) {
            setShow(showRes.data)
            setTheatre(showRes.data.theatre || fallbackTheatre)
            setBookedSeats(showRes.data.bookedSeats || [])
            setIsExpired(Boolean(showRes.data.expired))
            setErrorMessage('')
          } else if (showRes?.status === 400 && showRes?.data?.expired) {
            setIsExpired(true)
            setErrorMessage(showRes.data.message || 'This showtime has expired.')
          } else if (fallbackShow) {
            setShow(fallbackShow)
            setTheatre(fallbackTheatre)
            setBookedSeats(fallbackShow.bookedSeats || [])
          }

          if (movieRes?.data?.movie) {
            setMovie(movieRes.data.movie)
          }
        }
      } catch {
        if (isMounted && fallbackShow) {
          setShow(fallbackShow)
          setTheatre(fallbackTheatre)
          setBookedSeats(fallbackShow.bookedSeats || [])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [showId, movieId, refreshKey, fallbackShow, fallbackTheatre])

  function toggleSeat(id) {
    setErrorMessage('')
    setSelectedSeats((current) => {
      if (current.includes(id)) {
        return current.filter((seat) => seat !== id)
      }
      if (current.length >= (show?.maxSeatsPerBooking || 6)) {
        setErrorMessage(`Maximum of ${show?.maxSeatsPerBooking || 6} seats allowed per booking.`)
        return current
      }
      return [...current, id]
    })
  }

  const basePrice = selectedSeats.length * (show?.price || 200)
  const convenienceFee = selectedSeats.length > 0 ? 30 : 0
  const totalPrice = basePrice + convenienceFee

  function handleProceed() {
    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat before proceeding.')
      return
    }

    if (!isAuthenticated) {
      setErrorMessage('Please sign in or create an account to book your seats.')
      return
    }

    // Open Demo Payment Simulator Modal
    setErrorMessage('')
    setShowPaymentModal(true)
  }

  async function handleConfirmDemoPayment() {
    setProcessingPayment(true)
    setBookingLoading(true)

    try {
      // Simulate quick processing delay for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 400))

      const res = await api.post(`/shows/${showId}/book`, {
        seats: selectedSeats,
        movieId: movie?.id,
        theatreId: theatre?.id,
        movieTitle: movie?.title || 'Movie',
        paymentMethod: demoPaymentMethod,
      })

      setShowPaymentModal(false)

      // Navigate to booking confirmation with backend booking reference
      navigate(`/booking/confirmation?ref=${res.data.booking.id}`, {
        state: {
          confirmed: true,
          booking: res.data.booking,
          show: res.data.show || show,
          movie,
          theatre,
        },
      })
    } catch (err) {
      setShowPaymentModal(false)
      if (err.response?.status === 409) {
        const conflictSeats = err.response.data.conflicts || []
        setErrorMessage(
          err.response.data.message ||
            `Seat(s) ${conflictSeats.join(', ')} were just booked by another user. Please choose different seats.`,
        )
        // Refresh live show data and remove contested seats
        setRefreshKey((k) => k + 1)
        setSelectedSeats((prev) => prev.filter((s) => !conflictSeats.includes(s)))
      } else {
        setErrorMessage(
          err.response?.data?.message ||
            err.message ||
            'Failed to confirm booking. Please try again.',
        )
      }
    } finally {
      setProcessingPayment(false)
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
          <p className="text-sm">Retrieving cinema layout and live seat availability...</p>
        </div>
      </div>
    )
  }

  if (!show) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-white">Showtime Not Found</h1>
        <p className="mt-3 text-zinc-400">
          The requested screening is unavailable or does not exist.
        </p>
        <Button to={`/movies/${movieId}/theatres`} className="mt-6">
          Browse Available Shows
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Step 3 of 3"
        title="Select Your Seats"
        description={`Booking for ${movie?.title || 'Movie'} at ${theatre?.name || 'Cinema'}, ${show?.screen || 'Screen'}`}
      />

      <div className="mt-6">
        <DemoBanner>
          Phase 5 Active: Real-time database seat availability with atomic double-booking protection. Includes a clearly labeled Demo Payment Simulator for project evaluation.
        </DemoBanner>
      </div>

      {isExpired ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center text-red-200">
          <p className="font-bold text-base">Showtime Unavailable</p>
          <p className="mt-1 text-sm text-red-300">
            This screening has expired or already started. Please select an active upcoming showtime.
          </p>
          <Button to={`/movies/${movieId}/theatres`} className="mt-4">
            Browse Active Showtimes
          </Button>
        </div>
      ) : null}

      {/* Show Context Banner */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-cinema-900/90 px-6 py-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-white">{movie?.title}</h2>
          <p className="text-xs text-zinc-400">
            📍 {theatre?.name} · {show?.screen} ({show?.format})
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gold-400 font-bold uppercase tracking-wider">
            {formatShowDate(show?.date)} · {show?.time}
          </p>
          <p className="text-sm font-semibold text-white">₹{show?.price || 200} per ticket</p>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-xs text-red-200 flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            className="font-bold text-red-400 hover:text-white ml-3"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Interactive Seat Map Section */}
      <div className="mt-8 rounded-3xl border border-zinc-800 bg-cinema-900/70 p-6 shadow-2xl">
        <SeatMap
          rows={show?.seatRows || defaultRows}
          seatsPerRow={show?.seatsPerRow || defaultSeatsPerRow}
          selectedSeats={selectedSeats}
          bookedSeats={bookedSeats}
          unavailableSeats={bookedSeats}
          onToggle={toggleSeat}
          onSeatClick={toggleSeat}
        />
      </div>

      {/* Sticky Bottom Order Bar */}
      <div className="sticky bottom-4 z-30 mt-8 rounded-3xl border border-zinc-700/80 bg-cinema-950/95 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Selected Seat Badges */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Selected Seats ({selectedSeats.length} / {show?.maxSeatsPerBooking || 6})
            </p>
            {selectedSeats.length === 0 ? (
              <p className="mt-1 text-xs text-zinc-500">
                Click on any available seat above to select.
              </p>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {selectedSeats.map((seatId) => (
                  <span
                    key={seatId}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gold-400 px-3 py-1 text-xs font-bold text-zinc-950 shadow-sm"
                  >
                    {seatId}
                    <button
                      type="button"
                      onClick={() => toggleSeat(seatId)}
                      className="text-zinc-900 hover:text-black font-extrabold cursor-pointer"
                      aria-label={`Remove seat ${seatId}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Proceed Action */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center border-t border-zinc-800 pt-4 lg:border-t-0 lg:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-xs text-zinc-400">
                Ticket: ₹{basePrice} + Convenience Fee: ₹{convenienceFee}
              </p>
              <p className="text-2xl font-bold text-white">
                Total: <span className="text-gold-400">₹{totalPrice}</span>
              </p>
              {!isAuthenticated ? (
                <p className="text-[11px] text-amber-300">
                  <Link to="/login" className="text-gold-400 underline font-semibold">
                    Sign in
                  </Link>{' '}
                  required to book and save your tickets
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button to={`/movies/${movieId}/theatres`} variant="secondary">
                Change Show
              </Button>
              <Button
                onClick={handleProceed}
                disabled={selectedSeats.length === 0 || bookingLoading || isExpired}
              >
                {bookingLoading
                  ? 'Verifying...'
                  : isAuthenticated
                    ? 'Proceed to Demo Payment'
                    : 'Sign In to Book'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Payment Simulator Modal */}
      {showPaymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-700 bg-cinema-900 p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-2.5 py-0.5 text-[11px] font-bold text-gold-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
                  DEMO PAYMENT SIMULATOR
                </div>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  Simulated Ticket Checkout
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mandatory Academic / Demo Disclaimer */}
            <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-xs text-amber-200 leading-relaxed">
              <strong>College Project Simulation Notice:</strong> This is a simulated test checkout. No actual payment gateway is connected, and no real currency, credit cards, or banking passwords are ever collected or processed.
            </div>

            {/* Order Review */}
            <div className="mt-4 space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Movie Title:</span>
                <span className="font-semibold text-white">{movie?.title}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Cinema Venue:</span>
                <span className="font-semibold text-white">
                  {theatre?.name} ({show?.screen})
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Showtime:</span>
                <span className="font-semibold text-white">
                  {formatShowDate(show?.date)} at {show?.time}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Seats Selected:</span>
                <span className="font-bold text-gold-400">{selectedSeats.join(', ')}</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm">
                <span className="font-bold text-zinc-300">Total Calculated:</span>
                <span className="font-extrabold text-gold-400 text-base">₹{totalPrice}</span>
              </div>
            </div>

            {/* Simulated Payment Method Options */}
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Select Simulated Payment Channel
              </label>

              {[
                {
                  id: 'demo_upi',
                  label: 'Demo UPI Simulator',
                  desc: 'Simulated instant VPA approval (No app required)',
                  icon: '⚡',
                },
                {
                  id: 'demo_netbanking',
                  label: 'Demo NetBanking Sandbox',
                  desc: 'Virtual instant clearing (HDFC/ICICI/SBI Sandbox)',
                  icon: '🏛️',
                },
                {
                  id: 'demo_card',
                  label: 'Demo Cinema Card Token',
                  desc: 'Pre-approved simulated transaction (No card details needed)',
                  icon: '💳',
                },
              ].map((channel) => (
                <label
                  key={channel.id}
                  onClick={() => setDemoPaymentMethod(channel.id)}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                    demoPaymentMethod === channel.id
                      ? 'border-gold-400 bg-gold-400/10 text-white'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{channel.icon}</span>
                    <div>
                      <p className="font-bold text-xs text-white">{channel.label}</p>
                      <p className="text-[11px] text-zinc-400">{channel.desc}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="demoPaymentMethod"
                    checked={demoPaymentMethod === channel.id}
                    onChange={() => setDemoPaymentMethod(channel.id)}
                    className="accent-gold-400"
                  />
                </label>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-full border border-zinc-700 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              >
                Back to Seats
              </button>
              <button
                type="button"
                onClick={handleConfirmDemoPayment}
                disabled={processingPayment}
                className="rounded-full bg-gold-400 px-7 py-2.5 text-xs font-bold text-cinema-950 hover:bg-gold-500 shadow-lg shadow-gold-400/20 disabled:opacity-50 cursor-pointer"
              >
                {processingPayment ? 'Processing Demo Payment...' : `Authorize ₹${totalPrice} (Demo)`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SeatSelectionPage
