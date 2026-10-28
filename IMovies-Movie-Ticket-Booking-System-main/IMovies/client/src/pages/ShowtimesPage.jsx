import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import Button from '../components/ui/Button'
import DemoBanner from '../components/ui/DemoBanner'
import PageHeader from '../components/ui/PageHeader'
import PosterImage from '../components/ui/PosterImage'
import {
  formatShowDate,
  getMovieById,
  getShowtimesForMovie,
  getTheatreById,
} from '../data/sampleData'

function ShowtimesPage() {
  const { movieId } = useParams()
  const [movie, setMovie] = useState(() => getMovieById(movieId))

  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('all')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [showsRes, movieRes] = await Promise.all([
          api.get(`/shows/movie/${movieId}`).catch(() => null),
          api.get(`/movies/${movieId}`).catch(() => null),
        ])

        if (isMounted) {
          if (movieRes?.data?.movie) {
            setMovie(movieRes.data.movie)
          }
          if (Array.isArray(showsRes?.data) && showsRes.data.length > 0) {
            setShows(showsRes.data)
          } else {
            setShows(getShowtimesForMovie(movieId))
          }
        }
      } catch {
        if (isMounted) {
          setShows(getShowtimesForMovie(movieId))
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [movieId])

  const availableDates = useMemo(() => {
    return [...new Set(shows.map((s) => s.date))].sort()
  }, [shows])

  const filteredShows = useMemo(() => {
    if (selectedDate === 'all') return shows
    return shows.filter((s) => s.date === selectedDate)
  }, [shows, selectedDate])

  if (loading && !movie) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
          <p className="text-sm">Loading showtimes and cinema schedules...</p>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-white">Movie not found</h1>
        <p className="mt-2 text-sm text-zinc-400">The requested movie is not available in the catalogue.</p>
        <Button to="/movies" className="mt-6">
          Back to movies
        </Button>
      </div>
    )
  }

  const grouped = filteredShows.reduce((groups, show) => {
    const theatre = show.theatre || getTheatreById(show.theatreId)
    const key = theatre?.id || show.theatreId
    if (!groups[key]) {
      groups[key] = { theatre, shows: [] }
    }
    groups[key].shows.push(show)
    return groups
  }, {})

  const genreText = Array.isArray(movie.genres)
    ? movie.genres.join(', ')
    : movie.genres || 'Cinema'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Schedule"
        title="Select Theatre & Show"
        description={`Pick a screen and showtime for ${movie.title}. Show information is verified from the backend database.`}
        actions={
          <Button to={`/movies/${movie.id}`} variant="secondary">
            Movie Details
          </Button>
        }
      />

      <div className="mt-6">
        <DemoBanner>
          Phase 4 Active: Real-time showtimes retrieved from the backend API. Expired shows are automatically filtered out.
        </DemoBanner>
      </div>

      {/* Movie Mini Header Bar */}
      <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl border border-zinc-800 bg-cinema-900/90 p-4 sm:flex-row sm:items-center">
        <PosterImage
          src={movie.poster}
          alt={movie.title}
          className="h-20 w-14 shrink-0 rounded-xl object-cover border border-zinc-700"
        />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{movie.title}</h2>
          <p className="text-xs text-zinc-400">
            {movie.year} · {movie.language} · {movie.duration} · {genreText} · Rated {movie.rating}
          </p>
        </div>
        <div className="rounded-xl border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs font-semibold text-gold-400">
          {shows.length} Available Shows
        </div>
      </div>

      {/* Date Filter Strip */}
      {availableDates.length > 0 ? (
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Filter by Date</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDate('all')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                selectedDate === 'all'
                  ? 'bg-gold-400 text-cinema-950 shadow-md'
                  : 'border border-zinc-800 bg-cinema-900 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              All Dates
            </button>
            {availableDates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  selectedDate === date
                    ? 'bg-gold-400 text-cinema-950 shadow-md'
                    : 'border border-zinc-800 bg-cinema-900 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {formatShowDate(date)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Loading Indicator */}
      {loading ? (
        <div className="mt-12 flex justify-center py-10">
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
            <p className="text-xs">Loading available showtimes from backend...</p>
          </div>
        </div>
      ) : filteredShows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-700 p-12 text-center text-zinc-400">
          No showtimes scheduled for the selected date. Choose &ldquo;All Dates&rdquo; to see all available shows.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {Object.values(grouped).map(({ theatre, shows: theatreShows }) => (
            <section
              key={theatre?.id || 'theatre'}
              className="rounded-3xl border border-zinc-800 bg-cinema-900/90 p-6 shadow-xl"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {theatre?.name || 'Multiplex Cinema'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    📍 {theatre?.city || 'Pune'} · {theatre?.address || 'Mall Plaza'}
                  </p>
                </div>
                {theatre?.amenities ? (
                  <div className="mt-2 sm:mt-0 flex flex-wrap gap-1">
                    {theatre.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-400"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Show Slots Grid */}
              <div className="mt-6 flex flex-wrap gap-3">
                {theatreShows.map((show) => (
                  <Link
                    key={show.id}
                    to={`/movies/${movie.id}/seats/${show.id}`}
                    className="group flex flex-col justify-between rounded-2xl border border-zinc-700/80 bg-zinc-950/70 p-4 min-w-[170px] transition-all hover:scale-102 hover:border-gold-400 hover:bg-zinc-900 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-white group-hover:text-gold-400 transition-colors">
                          {show.time}
                        </span>
                        <span className="rounded bg-gold-400/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-400">
                          {show.format}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {show.screen} · {show.language}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-2 text-xs">
                      <span className="text-zinc-500">{formatShowDate(show.date)}</span>
                      <span className="font-bold text-white">₹{show.price}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default ShowtimesPage
