import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import useAuth from '../context/useAuth'
import Button from '../components/ui/Button'
import DemoBanner from '../components/ui/DemoBanner'
import PageHeader from '../components/ui/PageHeader'
import PosterImage from '../components/ui/PosterImage'
import {
  formatShowDate,
  getMovieById,
  getShowById,
  getTheatreById,
} from '../data/sampleData'

const TODAY_ISO = new Date().toISOString().split('T')[0]

function MyBookingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)

  // Cancellation State
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('info') // 'info' | 'success' | 'error'

  useEffect(() => {
    let isMounted = true

    async function loadBookings() {
      try {
        const res = await api.get('/bookings/my-bookings')
        if (isMounted) {
          if (Array.isArray(res.data)) {
            setBookings(res.data)
          }
        }
      } catch (err) {
        console.warn('Could not fetch user bookings from server:', err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadBookings()
    return () => {
      isMounted = false
    }
  }, [])

  const upcomingBookings = useMemo(() => {
    return bookings.filter((b) =>
      b.isUpcoming !== undefined
        ? Boolean(b.isUpcoming)
        : b.status === 'confirmed' && (!b.date || b.date >= TODAY_ISO),
    )
  }, [bookings])

  const pastAndCancelledBookings = useMemo(() => {
    return bookings.filter((b) =>
      b.isPast !== undefined
        ? Boolean(b.isPast) || b.status === 'cancelled'
        : b.status === 'cancelled' || (b.date && b.date < TODAY_ISO),
    )
  }, [bookings])

  const activeList = activeTab === 'upcoming' ? upcomingBookings : pastAndCancelledBookings

  async function handleConfirmCancellation() {
    if (!bookingToCancel) return

    setCancelling(true)
    try {
      const res = await api.post(`/bookings/${bookingToCancel.id}/cancel`)
      const updatedBooking = res.data.booking

      // Update bookings list
      setBookings((current) =>
        current.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)),
      )

      setNotice(
        `Booking ${updatedBooking.id} has been cancelled. Seat(s) ${updatedBooking.seats?.join(', ')} were released back to the cinema pool.`,
      )
      setNoticeType('success')
      setBookingToCancel(null)
    } catch (err) {
      console.error('Cancellation error:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to cancel booking.'
      setNotice(`Cancellation Failed: ${msg}`)
      setNoticeType('error')
      setBookingToCancel(null)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Account History"
        title="My Bookings"
        description={`Reservation history for ${user?.name || 'your account'}. Confirmed bookings are stored persistently in the database.`}
        actions={<Button to="/movies">Browse Movies</Button>}
      />

      <div className="mt-6">
        <DemoBanner>
          Phase 5 Active: Real database bookings connected to your user session. You can review ticket passes or cancel upcoming reservations to safely release your seats.
        </DemoBanner>
      </div>

      {notice ? (
        <div
          className={`mt-6 flex items-center justify-between rounded-2xl border px-4 py-3 text-xs ${
            noticeType === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : noticeType === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : 'border-gold-400/30 bg-gold-400/10 text-amber-200'
          }`}
        >
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            className="font-bold text-zinc-400 hover:text-white ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="mt-8 flex gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-gold-400 text-cinema-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Upcoming Screenings ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'past'
              ? 'bg-gold-400 text-cinema-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Past & Cancelled ({pastAndCancelledBookings.length})
        </button>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center py-10">
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
            <p className="text-xs">Loading personal booking records from database...</p>
          </div>
        </div>
      ) : activeList.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-zinc-700 p-12 text-center text-zinc-400">
          {activeTab === 'upcoming'
            ? 'No active upcoming bookings. Explore the catalogue to reserve seats!'
            : 'No past or cancelled bookings in your archive.'}
          <div className="mt-4">
            <Button to="/movies">Explore Movies</Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {activeList.map((booking) => {
            const movie = getMovieById(booking.movieId)
            const show = getShowById(booking.showId)
            const theatre = getTheatreById(booking.theatreId)
            const isCancelled = booking.status === 'cancelled'
            const isUpcoming =
              booking.isUpcoming !== undefined
                ? Boolean(booking.isUpcoming)
                : booking.status === 'confirmed' && (!booking.date || booking.date >= TODAY_ISO)

            return (
              <article
                key={booking.id}
                className="group grid gap-5 rounded-3xl border border-zinc-800/80 bg-cinema-900/90 p-5 shadow-lg transition hover:border-gold-400/40 sm:grid-cols-[100px_1fr_auto]"
              >
                <div className="aspect-2/3 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950">
                  <PosterImage
                    src={movie?.poster}
                    alt={movie?.title || booking.movieTitle || 'Movie'}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-gold-400 font-bold">
                      {booking.id}
                    </span>
                    {isCancelled ? (
                      <span className="rounded-md bg-red-400/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-400/20">
                        Cancelled
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-400/20">
                        Confirmed
                      </span>
                    )}
                    {booking.paymentStatus === 'paid_demo' ? (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">
                        Demo Paid
                      </span>
                    ) : null}
                  </div>

                  <h2 className="text-xl font-bold text-white group-hover:text-gold-400 transition-colors">
                    {booking.movieTitle || movie?.title}
                  </h2>

                  <p className="text-xs text-zinc-400">
                    📍 {booking.theatreName || theatre?.name} · {booking.screen || show?.screen}
                  </p>

                  <p className="text-xs text-zinc-300">
                    🗓️ {formatShowDate(booking.date || show?.date)} · {booking.time || show?.time}
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">Seats:</span>
                    <div className="flex flex-wrap gap-1">
                      {booking.seats?.map((seat) => (
                        <span
                          key={seat}
                          className="rounded bg-gold-400/20 px-2 py-0.5 font-bold text-gold-400 border border-gold-400/30"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-between gap-3 sm:items-end sm:border-l sm:border-zinc-800/80 sm:pl-6">
                  <div>
                    <p className="text-xs text-zinc-500 sm:text-right">Total Amount</p>
                    <p className="text-2xl font-bold text-white sm:text-right">
                      ₹{booking.amount}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTicket({ booking, movie, show, theatre })
                      }
                      className="rounded-full bg-gold-400 px-4 py-2 text-xs font-bold text-cinema-950 shadow hover:bg-gold-500 cursor-pointer"
                    >
                      View Ticket Pass
                    </button>

                    {isUpcoming ? (
                      <button
                        type="button"
                        onClick={() => setBookingToCancel(booking)}
                        className="rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Ticket Pass Modal */}
      {selectedTicket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-700 bg-cinema-900 shadow-2xl">
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between px-5 py-3 text-cinema-950 font-bold ${
                selectedTicket.booking.status === 'cancelled' ? 'bg-red-400' : 'bg-gold-400'
              }`}
            >
              <span className="text-xs uppercase tracking-wider">
                {selectedTicket.booking.status === 'cancelled'
                  ? 'Cancelled Ticket Pass'
                  : 'Confirmed Admission Pass'}
              </span>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1 text-cinema-950 hover:bg-black/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Ticket Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <PosterImage
                  src={selectedTicket.movie?.poster}
                  alt={selectedTicket.booking.movieTitle}
                  className="h-16 w-12 rounded-lg object-cover border border-zinc-700"
                />
                <div>
                  <h3 className="font-bold text-white text-base">
                    {selectedTicket.booking.movieTitle}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {selectedTicket.booking.theatreName} · {selectedTicket.booking.screen}
                  </p>
                  <p className="text-xs text-gold-400 font-semibold mt-0.5">
                    {formatShowDate(selectedTicket.booking.date)} at {selectedTicket.booking.time}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-gold-400">
                    {selectedTicket.booking.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Seats Reserved:</span>
                  <span className="font-bold text-white">
                    {selectedTicket.booking.seats?.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Paid:</span>
                  <span className="font-bold text-white">₹{selectedTicket.booking.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span
                    className={`font-bold ${
                      selectedTicket.booking.status === 'cancelled'
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedTicket.booking.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Print Pass
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-full bg-gold-400 px-5 py-2 text-xs font-bold text-cinema-950 hover:bg-gold-500 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancellation Confirmation Modal */}
      {bookingToCancel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-700 bg-cinema-900 p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-white">
              Cancel Ticket Reservation
            </h3>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to cancel booking{' '}
              <strong className="text-gold-400 font-mono">{bookingToCancel.id}</strong> for{' '}
              <strong className="text-white">{bookingToCancel.movieTitle}</strong>?
            </p>

            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200">
              <p className="font-bold">Important Notice:</p>
              <p className="mt-1">
                Your seats ({bookingToCancel.seats?.join(', ')}) will be released immediately back to the cinema pool for other customers.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={cancelling}
                className="rounded-full bg-red-500 px-5 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? 'Releasing Seats...' : 'Confirm & Release Seats'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MyBookingsPage
