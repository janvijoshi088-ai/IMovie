import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import Button from '../components/ui/Button'
import DemoBanner from '../components/ui/DemoBanner'
import PosterImage from '../components/ui/PosterImage'
import {
  formatShowDate,
  getMovieById,
  getShowtimesForMovie,
} from '../data/sampleData'

function MovieDetailsPage() {
  const { movieId } = useParams()
  const [movie, setMovie] = useState(() => getMovieById(movieId))
  const [shows, setShows] = useState(() => getShowtimesForMovie(movieId))
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [showTrailerModal, setShowTrailerModal] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadMovieDetails() {
      try {
        setLoading(true)
        const [movieRes, showsRes] = await Promise.all([
          api.get(`/movies/${movieId}`).catch(() => null),
          api.get(`/shows/movie/${movieId}`).catch(() => null),
        ])

        if (isMounted) {
          if (movieRes?.data?.movie) {
            setMovie(movieRes.data.movie)
            setIsLive(true)
          }
          if (Array.isArray(showsRes?.data)) {
            setShows(showsRes.data)
          }
        }
      } catch (err) {
        console.warn('Error loading movie details from server:', err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMovieDetails()
    return () => {
      isMounted = false
    }
  }, [movieId])

  if (!movie && !loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-4xl font-bold text-white">Movie Not Found</h1>
        <p className="mt-3 text-zinc-400">
          The requested movie ID does not exist in the cinema catalogue.
        </p>
        <Button to="/movies" className="mt-6">
          Back to Movies
        </Button>
      </div>
    )
  }

  if (!movie && loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-gold-400 font-semibold animate-pulse">Loading movie details...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Backdrop Header */}
      <div className="relative min-h-[340px] sm:min-h-[420px] overflow-hidden bg-cinema-950">
        <PosterImage
          src={movie.backdrop || movie.poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 filter blur-xs scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-cinema-950 via-cinema-950/70 to-cinema-950/20" />
      </div>

      {/* Main Content Info */}
      <div className="mx-auto -mt-48 max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          {/* Poster Column */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative aspect-2/3 w-64 overflow-hidden rounded-3xl border border-zinc-700/80 bg-cinema-900 shadow-2xl lg:w-full">
              <PosterImage
                src={movie.poster}
                alt={`${movie.title} poster`}
                className="h-full w-full object-cover"
              />
              <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-xs font-bold text-gold-400 backdrop-blur-xs border border-gold-400/30">
                ⭐ {movie.rating}
              </span>
            </div>

            <button
              onClick={() => setShowTrailerModal(true)}
              className="mt-4 flex w-64 lg:w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/90 py-3 text-sm font-semibold text-zinc-200 transition hover:border-gold-400 hover:text-gold-400 cursor-pointer"
            >
              <svg className="h-4 w-4 fill-current text-gold-400" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Trailer Preview
            </button>
          </div>

          {/* Details Column */}
          <div className="space-y-6">
            <DemoBanner>
              {isLive
                ? 'Phase 5 Active: Real-time movie specifications retrieved from server database.'
                : 'Full details retrieved with schedule integration.'}
            </DemoBanner>

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-400">
                <span className="rounded border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-zinc-300">
                  {movie.certificate || 'UA'}
                </span>
                <span>•</span>
                <span>{movie.language}</span>
                <span>•</span>
                <span>{movie.year}</span>
                <span>•</span>
                <span>{movie.duration}</span>
              </div>

              <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
                {movie.title}
              </h1>

              {/* Genres */}
              <div className="mt-3 flex flex-wrap gap-2">
                {(Array.isArray(movie.genres) ? movie.genres : [movie.genres]).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-zinc-700/70 bg-zinc-800/50 px-3 py-1 text-xs font-medium text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Synopsis</h2>
              <p className="mt-2 text-base leading-relaxed text-zinc-300">
                {movie.synopsis}
              </p>
            </div>

            {/* Crew & Cast Info */}
            <div className="grid gap-4 rounded-2xl border border-zinc-800/80 bg-cinema-900/60 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Director</p>
                <p className="mt-1 text-sm font-semibold text-white">{movie.director}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Starring Cast</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(Array.isArray(movie.cast) ? movie.cast : [movie.cast]).map((actor) => (
                    <span
                      key={actor}
                      className="rounded-md bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-200"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button to={`/movies/${movie.id}/theatres`} className="px-8 py-3.5 text-base">
                Select Theatre & Showtimes
              </Button>
              <Button to="/movies" variant="secondary" className="px-6 py-3.5">
                Back to Catalogue
              </Button>
            </div>

            {/* Available Showtimes Quick Preview */}
            <div className="mt-8 border-t border-zinc-800/80 pt-6">
              <h2 className="text-base font-bold text-white">
                Upcoming Screenings ({shows.length})
              </h2>
              {shows.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">
                  No showtimes currently scheduled for this title.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {shows.slice(0, 4).map((show) => {
                    const theatreName = show.theatre?.name || show.theatreName || show.theatreId
                    return (
                      <Link
                        key={show.id}
                        to={`/movies/${movie.id}/seats/${show.id}`}
                        className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-cinema-900/80 p-3.5 transition hover:border-gold-400 hover:bg-zinc-850"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-gold-400 transition">
                            {theatreName}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {formatShowDate(show.date)} · {show.screen}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-bold text-gold-400">
                            {show.time}
                          </span>
                          <p className="mt-1 text-[11px] text-zinc-400">₹{show.price}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal Simulation */}
      {showTrailerModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-700 bg-cinema-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="font-display text-lg font-bold text-white">
                {movie.title} — Trailer Preview
              </h3>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-black py-16 text-center border border-zinc-800">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-400/20 text-gold-400">
                <svg className="h-8 w-8 fill-gold-400" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="mt-4 font-semibold text-white">Official HD Trailer</p>
              <p className="mt-1 max-w-md text-xs text-zinc-400">
                Large format preview player. You can select your seats and book tickets right away!
              </p>
              <Button
                to={`/movies/${movie.id}/theatres`}
                className="mt-6"
                onClick={() => setShowTrailerModal(false)}
              >
                Book Tickets Now
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MovieDetailsPage
