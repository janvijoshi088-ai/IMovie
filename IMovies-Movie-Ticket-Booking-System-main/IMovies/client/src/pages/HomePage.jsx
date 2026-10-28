import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import MovieCard from '../components/ui/MovieCard'
import PosterImage from '../components/ui/PosterImage'
import { genres, movies as sampleMovies } from '../data/sampleData'

function HomePage() {
  const [movieList, setMovieList] = useState(sampleMovies)
  const [query, setQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)
  const [health, setHealth] = useState('Checking backend API...')
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    // Check health
    api
      .get('/health')
      .then((response) => {
        if (isMounted) setHealth(response.data.message)
      })
      .catch(() => {
        if (isMounted) setHealth('API is offline or waiting (Run server on port 5000)')
      })

    // Load real movies from backend
    api
      .get('/movies')
      .then((res) => {
        if (isMounted && res.data?.movies) {
          setMovieList(res.data.movies)
        }
      })
      .catch(() => {
        // Fall back gracefully
      })

    return () => {
      isMounted = false
    }
  }, [])

  const featured = movieList.filter((movie) => movie.featured)
  const hero = featured[activeHeroIndex] || movieList[0]

  const filteredMovies =
    selectedGenre === 'All'
      ? movieList
      : movieList.filter((m) =>
          Array.isArray(m.genres) ? m.genres.includes(selectedGenre) : m.genres === selectedGenre,
        )

  function handleSearch(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    navigate(`/movies?${params.toString()}`)
  }

  return (
    <div>
      {/* Hero Spotlight Section */}
      <section className="relative min-h-[580px] overflow-hidden bg-cinema-950">
        <PosterImage
          src={hero.backdrop || hero.poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 filter blur-xs scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-linear-to-t from-cinema-950 via-cinema-950/80 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-cinema-950 via-cinema-950/90 to-transparent" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_0.9fr] lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3.5 py-1 text-xs font-semibold text-gold-400">
              <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
              SPOTLIGHT PREMIERE
            </div>

            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-6xl">
              {hero.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <span className="flex items-center gap-1 rounded bg-gold-400/20 px-2 py-0.5 font-bold text-gold-400">
                ⭐ {hero.rating}
              </span>
              <span>•</span>
              <span>{hero.year}</span>
              <span>•</span>
              <span>{hero.duration}</span>
              <span>•</span>
              <span className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                {hero.certificate || 'UA'}
              </span>
              <span>•</span>
              <span className="font-medium text-zinc-400">
                {Array.isArray(hero.genres) ? hero.genres.join(', ') : hero.genres}
              </span>
            </div>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300">
              {hero.synopsis}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={`/movies/${hero.id}/theatres`}
                className="rounded-full bg-gold-400 px-8 py-3 text-sm font-bold text-cinema-950 shadow-lg shadow-gold-400/20 transition hover:bg-gold-500 hover:scale-105"
              >
                Book Tickets Now
              </Link>
              <Link
                to={`/movies/${hero.id}`}
                className="rounded-full border border-zinc-700 bg-cinema-900/80 px-6 py-3 text-sm font-semibold text-white transition hover:border-gold-400 hover:bg-zinc-800"
              >
                More Details
              </Link>
            </div>

            {/* Spotlight Carousel Thumbnails */}
            {featured.length > 1 ? (
              <div className="mt-10 flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-zinc-500">Spotlight:</span>
                <div className="flex gap-2">
                  {featured.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveHeroIndex(idx)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        activeHeroIndex === idx
                          ? 'w-8 bg-gold-400'
                          : 'w-2.5 bg-zinc-700 hover:bg-zinc-500'
                      }`}
                      aria-label={`Slide to ${m.title}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Hero Movie Poster Card */}
          <div className="hidden justify-center lg:flex">
            <Link
              to={`/movies/${hero.id}`}
              className="group relative aspect-2/3 w-80 overflow-hidden rounded-3xl border border-zinc-700/80 bg-cinema-900 shadow-2xl transition hover:border-gold-400/50 hover:scale-[1.02]"
            >
              <PosterImage
                src={hero.poster}
                alt={`${hero.title} poster`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-cinema-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-cinema-950">
                  Now Showing
                </span>
                <h3 className="mt-2 text-xl font-bold text-white group-hover:text-gold-400 transition">
                  {hero.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">Directed by {hero.director}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Instant Search Bar */}
      <section className="relative z-10 mx-auto -mt-8 max-w-4xl px-4 sm:px-6">
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 rounded-2xl border border-zinc-700/80 bg-cinema-900/95 p-2 shadow-2xl backdrop-blur-md"
        >
          <div className="flex flex-1 items-center gap-3 px-3">
            <span className="text-zinc-400">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies by title, director, or cast..."
              className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gold-400 px-6 py-2.5 text-xs font-bold text-cinema-950 hover:bg-gold-500 transition cursor-pointer"
          >
            Find Tickets
          </button>
        </form>
      </section>

      {/* Now Showing Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
              In Theatres Now
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
              Explore Now Showing
            </h2>
          </div>
          <Link
            to="/movies"
            className="text-sm font-semibold text-gold-400 hover:text-gold-300 transition"
          >
            View all movies ({movieList.length}) →
          </Link>
        </div>

        {/* Genre Pill Filter */}
        <div className="mt-6 flex flex-wrap gap-2 overflow-x-auto pb-2">
          {['All', ...genres].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                selectedGenre === g
                  ? 'bg-gold-400 text-cinema-950 shadow-md'
                  : 'border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Movies Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>

      {/* Cinematic Experience Highlights */}
      <section className="border-t border-zinc-800/80 bg-cinema-900/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
              Why IMovies
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">
              The Next-Gen Cinema Experience
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm text-zinc-400">
              Explore how modern ticket reservation operates with responsive interfaces, atomic seat locking, and live admin synchronization.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '🎬',
                title: 'Curated Blockbusters',
                text: 'Rich database catalogue featuring Indian and global blockbusters, complete with ratings, cast, and high-res posters.',
              },
              {
                icon: '🎟️',
                title: 'Visual Seat Selection',
                text: 'Choose standard, executive, and recliner seats on an interactive cinema screen layout with atomic double-booking protection.',
              },
              {
                icon: '⚡',
                title: 'Admin Management Hub',
                text: 'Dedicated admin views to manage theatre screens, schedule showtimes, and create movie listings with persistent database storage.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-zinc-800/80 bg-cinema-800/70 p-6 transition hover:border-gold-400/40 hover:-translate-y-1"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4 text-lg font-bold text-white group-hover:text-gold-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>

          {/* Backend Connection Status Footer */}
          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-center">
            <span className="text-xs text-zinc-400">
              <strong className="text-zinc-200">Express Backend Health:</strong> {health}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
