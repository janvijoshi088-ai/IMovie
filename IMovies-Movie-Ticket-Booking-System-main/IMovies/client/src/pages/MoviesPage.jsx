import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import DemoBanner from '../components/ui/DemoBanner'
import MovieCard from '../components/ui/MovieCard'
import PageHeader from '../components/ui/PageHeader'
import {
  genres,
  languages,
  movies as sampleMovies,
} from '../data/sampleData'

function MoviesPage() {
  const [params, setParams] = useSearchParams()
  const [catalogue, setCatalogue] = useState(sampleMovies)
  const [isLive, setIsLive] = useState(false)

  const query = params.get('q') || ''
  const genre = params.get('genre') || 'all'
  const language = params.get('language') || 'all'
  const sortBy = params.get('sort') || 'featured'

  useEffect(() => {
    let isMounted = true

    async function loadCatalogue() {
      try {
        const res = await api.get('/movies')
        if (isMounted && res.data?.movies) {
          setCatalogue(res.data.movies)
          setIsLive(true)
        }
      } catch {
        // Fall back gracefully to sampleMovies
      }
    }

    loadCatalogue()
    return () => {
      isMounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return catalogue.filter((movie) => {
      const matchesQuery =
        term.length === 0 ||
        movie.title.toLowerCase().includes(term) ||
        (movie.director && movie.director.toLowerCase().includes(term)) ||
        (Array.isArray(movie.cast) &&
          movie.cast.some((name) => name.toLowerCase().includes(term)))
      const matchesGenre = genre === 'all' || (Array.isArray(movie.genres) && movie.genres.includes(genre))
      const matchesLanguage = language === 'all' || movie.language?.toLowerCase() === language.toLowerCase()
      return matchesQuery && matchesGenre && matchesLanguage
    })
  }, [catalogue, query, genre, language])

  const results = useMemo(() => {
    const list = [...filtered]
    if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'year') {
      list.sort((a, b) => b.year - a.year)
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title))
    } else {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }
    return list
  }, [filtered, sortBy])

  function updateParam(key, value) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setParams(next)
  }

  function resetFilters() {
    setParams(new URLSearchParams())
  }

  const hasActiveFilters = Boolean(query || genre !== 'all' || language !== 'all' || sortBy !== 'featured')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Explore Movies"
        description="Search, filter, and sort our collection of movies currently scheduled across partner theatres."
      />

      <div className="mt-6">
        <DemoBanner>
          {isLive
            ? 'Phase 5 Active: Real-time movie catalogue retrieved directly from backend API with dynamic search and filtering.'
            : 'Explore our curated movie collection with seamless genre, language, and search filtering.'}
        </DemoBanner>
      </div>

      {/* Filter and Search Controls */}
      <div className="mt-8 space-y-4 rounded-3xl border border-zinc-800 bg-cinema-900/90 p-5 shadow-xl">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Box */}
          <div className="relative">
            <input
              value={query}
              onChange={(event) => updateParam('q', event.target.value)}
              placeholder="Search title, cast, director..."
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-gold-400"
            />
            {query ? (
              <button
                onClick={() => updateParam('q', '')}
                className="absolute top-2.5 right-3 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Genre Filter */}
          <select
            value={genre}
            onChange={(event) => updateParam('genre', event.target.value)}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white outline-none focus:border-gold-400"
          >
            <option value="all">All Genres</option>
            {genres.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={language}
            onChange={(event) => updateParam('language', event.target.value)}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white outline-none focus:border-gold-400"
          >
            <option value="all">All Languages</option>
            {languages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(event) => updateParam('sort', event.target.value)}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white outline-none focus:border-gold-400"
          >
            <option value="featured">Featured First</option>
            <option value="rating">Highest Rated</option>
            <option value="year">Newest First</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* Filter Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {genres.slice(0, 5).map((g) => (
              <button
                key={g}
                onClick={() => updateParam('genre', genre === g ? 'all' : g)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition cursor-pointer ${
                  genre === g
                    ? 'bg-gold-400 text-cinema-950 font-bold'
                    : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
            >
              Reset Filters
            </button>
          ) : null}
        </div>
      </div>

      {/* Result Status Bar */}
      <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
        <p>
          Showing <span className="font-semibold text-white">{results.length}</span> movie
          {results.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Grid or Empty Notice */}
      {results.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-zinc-700 p-12 text-center">
          <p className="text-lg font-semibold text-zinc-300">No movies match your filters</p>
          <p className="mt-2 text-sm text-zinc-500">
            Try adjusting your search query, or clear genre and language filters.
          </p>
          <button
            onClick={resetFilters}
            className="mt-5 rounded-full bg-gold-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-gold-500 cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MoviesPage
