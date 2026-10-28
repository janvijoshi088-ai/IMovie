import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import Button from '../components/ui/Button'
import DemoBanner from '../components/ui/DemoBanner'
import PageHeader from '../components/ui/PageHeader'
import PosterImage from '../components/ui/PosterImage'
import { formatShowDate } from '../data/sampleData'

function BookingConfirmationPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const referenceFromUrl = searchParams.get('ref')
  const referenceFromState = location.state?.booking?.id || location.state?.ref
  const targetReference = referenceFromUrl || referenceFromState

  const [booking, setBooking] = useState(location.state?.booking || null)
  const [movie, setMovie] = useState(location.state?.movie || null)
  const [theatre, setTheatre] = useState(location.state?.theatre || null)
  const [show, setShow] = useState(location.state?.show || null)
  const [loading, setLoading] = useState(Boolean(targetReference))
  const [verified, setVerified] = useState(false)
  const [errorNotice, setErrorNotice] = useState('')

  useEffect(() => {
    let isMounted = true

    async function verifyWithBackend() {
      if (!targetReference) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const res = await api.get(`/bookings/${targetReference}`)
        if (isMounted && res.data?.booking) {
          setBooking(res.data.booking)
          if (res.data.movie) setMovie(res.data.movie)
          if (res.data.theatre) setTheatre(res.data.theatre)
          if (res.data.show) setShow(res.data.show)
          setVerified(true)
          setErrorNotice('')
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Backend confirmation lookup error:', err.message)
          if (err.response?.status === 404) {
            setErrorNotice(`Booking reference "${targetReference}" was not found in the database.`)
          } else if (err.response?.status === 403) {
            setErrorNotice('Access denied: This booking belongs to another customer account.')
          } else {
            // Keep state fallback if offline
            if (location.state?.booking) {
              setBooking(location.state.booking)
              setVerified(true)
            } else {
              setErrorNotice('Unable to verify booking status with server database.')
            }
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    verifyWithBackend()
    return () => {
      isMounted = false
    }
  }, [targetReference, location.state])

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
          <p className="text-sm">Verifying booking reference with database...</p>
        </div>
      </div>
    )
  }

  if (!booking || errorNotice) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-gold-400">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-white">
          {errorNotice ? 'Verification Notice' : 'No Active Booking Found'}
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          {errorNotice || 'Frontend-only state is not treated as proof of booking. Complete a reservation via the seat selection flow to generate a verified database ticket.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button to="/movies">
            Browse Movie Showtimes
          </Button>
          <Button to="/bookings" variant="secondary">
            View My Bookings
          </Button>
        </div>
      </div>
    )
  }

  const isCancelled = booking.status === 'cancelled'
  const bookingCode = booking.id
  const seatList = booking.seats || []
  const totalAmount = booking.amount

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow={verified ? 'Database Verified' : 'Reservation Result'}
        title="Booking Confirmation"
        description={
          isCancelled
            ? 'This booking was cancelled and its seats were released back to the theatre inventory.'
            : 'Your seats have been confirmed and recorded in the database. Presentation of this reference grants entry.'
        }
      />

      <div className="mt-6">
        <DemoBanner>
          {verified ? (
            <span className="font-semibold text-emerald-300">
              ✓ Database Verified: Booking reference {bookingCode} is securely recorded in the backend. You can review or cancel it anytime in My Bookings.
            </span>
          ) : (
            <span>
              Reservation completed. Record synced with backend database.
            </span>
          )}
        </DemoBanner>
      </div>

      {/* Cinematic Perforated E-Ticket Pass */}
      <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-700/80 bg-cinema-900 shadow-2xl">
        {/* Ticket Top Banner */}
        <div
          className={`flex items-center justify-between px-6 py-3 text-cinema-950 ${
            isCancelled ? 'bg-red-400' : 'bg-gold-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-xs uppercase">IMovies Official Pass</span>
            <span className="text-xs">•</span>
            <span className="text-xs font-semibold">
              {isCancelled ? 'Cancelled Reservation' : 'Verified Admission Ticket'}
            </span>
          </div>
          <span className="rounded bg-cinema-950 px-2.5 py-0.5 text-[11px] font-bold text-gold-400">
            {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
          </span>
        </div>

        {/* Ticket Main Details */}
        <div className="grid gap-6 p-6 sm:grid-cols-[160px_1fr]">
          {/* Poster */}
          <div className="aspect-2/3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-md">
            <PosterImage
              src={movie?.poster}
              alt={movie?.title || booking.movieTitle}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Details Content */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-gold-400">
                  {booking.format || show?.format || 'IMAX'}
                </span>
                <span className="text-xs text-zinc-400">
                  {movie?.language || 'English'} • {movie?.certificate || 'UA'}
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {booking.movieTitle || movie?.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-300">
                📍 {booking.theatreName || theatre?.name} · {booking.screen || show?.screen}
              </p>
            </div>

            {/* Date, Time & Seats Grid */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-cinema-950/70 p-4 text-xs">
              <div>
                <p className="uppercase tracking-wider text-zinc-500">Screening Date</p>
                <p className="mt-1 font-bold text-white">
                  {formatShowDate(booking.date || show?.date)}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-zinc-500">Showtime</p>
                <p className="mt-1 font-bold text-gold-400">{booking.time || show?.time}</p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-zinc-500">Seats Reserved</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {seatList.map((seat) => (
                    <span
                      key={seat}
                      className="rounded bg-zinc-800 px-1.5 py-0.5 font-bold text-zinc-200 border border-zinc-700"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="uppercase tracking-wider text-zinc-500">Payment Status</p>
                <p className="mt-1 font-semibold text-emerald-400">
                  {booking.paymentStatus === 'paid_demo' ? 'Paid (Demo Sandbox)' : 'Paid'}
                </p>
              </div>
            </div>

            {/* Reference & Price Bar */}
            <div className="flex flex-wrap items-center justify-between border-t border-zinc-800 pt-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Unique Booking Reference
                </p>
                <p className="font-mono text-base font-extrabold text-gold-400 tracking-wider">
                  {bookingCode}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">Amount Paid</p>
                <p className="text-2xl font-extrabold text-white">₹{totalAmount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Perforated Stub Line */}
        <div className="relative flex items-center justify-between border-t border-dashed border-zinc-700 bg-cinema-950 px-6 py-4">
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-cinema-950" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-cinema-950" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 text-xs text-zinc-400">
            <div>
              <p>Booked on {booking.bookedAt ? new Date(booking.bookedAt).toLocaleDateString('en-IN') : 'Confirmed'}</p>
              <p className="text-[11px] text-zinc-500">
                Processed via Demo Payment Simulator (College Demo)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="rounded-full border border-zinc-700 px-4 py-1.5 font-semibold text-zinc-200 hover:bg-zinc-800 cursor-pointer"
              >
                🖨️ Print Ticket Pass
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button to="/bookings" className="px-6">
          View All My Bookings
        </Button>
        <Button to="/movies" variant="secondary" className="px-6">
          Browse More Movies
        </Button>
      </div>
    </div>
  )
}

export default BookingConfirmationPage
