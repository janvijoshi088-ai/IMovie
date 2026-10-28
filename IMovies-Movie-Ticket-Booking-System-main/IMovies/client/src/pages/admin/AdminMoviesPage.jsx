import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import DemoBanner from '../../components/ui/DemoBanner'
import PageHeader from '../../components/ui/PageHeader'
import PosterImage from '../../components/ui/PosterImage'
import {
  genres as availableGenres,
  languages as availableLanguages,
} from '../../data/sampleData'

const PRESET_POSTERS = [
  { label: 'Oppenheimer', url: '/posters/oppenheimer.jpg' },
  { label: 'Interstellar', url: '/posters/interstellar.jpg' },
  { label: 'Dark Knight', url: '/posters/dark-knight.jpg' },
  { label: 'Inception', url: '/posters/inception.jpg' },
  { label: 'Dune: Part Two', url: '/posters/dune-part-two.jpg' },
  { label: 'Spider-Verse', url: '/posters/spider-verse.jpg' },
  { label: 'Jawan', url: '/posters/jawan.jpg' },
  { label: 'Pathaan', url: '/posters/pathaan.jpg' },
  { label: 'Kalki 2898 AD', url: '/posters/kalki.jpg' },
  { label: 'RRR', url: '/posters/rrr.jpg' },
  { label: 'Inside Out 2', url: '/posters/inside-out-2.jpg' },
  { label: '12th Fail', url: '/posters/12th-fail.svg' },
]

function AdminMoviesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('info') // 'info' | 'error' | 'success'

  // Add Form State
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('2026')
  const [language, setLanguage] = useState('English')
  const [genre, setGenre] = useState('Action')
  const [duration, setDuration] = useState('2h 15m')
  const [director, setDirector] = useState('')
  const [rating, setRating] = useState('8.0')
  const [synopsis, setSynopsis] = useState('')
  const [poster, setPoster] = useState('/posters/oppenheimer.jpg')
  const [certificate, setCertificate] = useState('UA')

  // Edit Modal State
  const [editingMovie, setEditingMovie] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editLanguage, setEditLanguage] = useState('')
  const [editGenre, setEditGenre] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editDirector, setEditDirector] = useState('')
  const [editRating, setEditRating] = useState('')
  const [editSynopsis, setEditSynopsis] = useState('')
  const [editPoster, setEditPoster] = useState('')
  const [editCertificate, setEditCertificate] = useState('UA')

  useEffect(() => {
    let isMounted = true

    async function loadInitialMovies() {
      try {
        const res = await api.get('/movies')
        if (isMounted) {
          if (res.data && Array.isArray(res.data.movies)) {
            setItems(res.data.movies)
          } else if (Array.isArray(res.data)) {
            setItems(res.data)
          } else {
            setItems([])
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load movies from backend database:', err)
          const msg = err.response?.data?.message || err.message || 'Server error'
          setNotice(`Error connecting to database: ${msg}`)
          setNoticeType('error')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInitialMovies()
    return () => {
      isMounted = false
    }
  }, [])

  function handleFileUpload(e, targetSetter) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setNotice('Please select a valid image file (PNG, JPG, SVG, WebP).')
      setNoticeType('error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice('Image file exceeds the 5MB size limit.')
      setNoticeType('error')
      return
    }

    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const dataUri = uploadEvent.target?.result
      if (dataUri) {
        targetSetter(dataUri)
        setNotice(`Poster asset "${file.name}" loaded for upload.`)
        setNoticeType('success')
      }
    }
    reader.readAsDataURL(file)
  }

  function startEdit(movie) {
    setEditingMovie(movie)
    setEditTitle(movie.title || '')
    setEditYear(String(movie.year || '2026'))
    setEditLanguage(movie.language || 'English')
    setEditGenre(Array.isArray(movie.genres) ? movie.genres[0] || 'Action' : movie.genres || 'Action')
    setEditDuration(movie.duration || '2h 00m')
    setEditDirector(movie.director || '')
    setEditRating(String(movie.rating || '8.0'))
    setEditSynopsis(movie.synopsis || '')
    setEditPoster(movie.poster || '')
    setEditCertificate(movie.certificate || 'UA')
  }

  async function handleAdd(event) {
    event.preventDefault()
    if (!title.trim()) {
      setNotice('Please provide a movie title.')
      setNoticeType('error')
      return
    }

    const yr = Number(year)
    if (isNaN(yr) || yr < 1888 || yr > 2100) {
      setNotice('Please enter a valid release year between 1888 and 2100.')
      setNoticeType('error')
      return
    }

    const rat = parseFloat(rating)
    if (isNaN(rat) || rat < 0 || rat > 10) {
      setNotice('Movie rating must be a decimal between 0.0 and 10.0.')
      setNoticeType('error')
      return
    }

    setSubmitting(true)
    setNotice('')

    const payload = {
      title: title.trim(),
      year: yr,
      rating: rat,
      duration: duration.trim() || '2h 00m',
      genres: [genre],
      language,
      certificate,
      director: director.trim() || 'Demo Director',
      cast: ['Lead Actor', 'Supporting Actor'],
      synopsis: synopsis.trim() || `${title.trim()} was added via the administrative management portal.`,
      poster: poster.trim() || '/posters/oppenheimer.jpg',
      backdrop: poster.trim() || '/posters/oppenheimer.jpg',
      featured: false,
    }

    try {
      const res = await api.post('/movies', payload)
      const created = res.data.movie || payload

      setItems((current) => [created, ...current])
      setTitle('')
      setDirector('')
      setSynopsis('')
      setPoster('/posters/oppenheimer.jpg')
      setShowAddForm(false)
      setNotice(`"${created.title}" successfully created and saved to database!`)
      setNoticeType('success')
    } catch (err) {
      console.error('Failed to create movie in database:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to save movie.'
      setNotice(`Creation Error: ${msg}`)
      setNoticeType('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(event) {
    event.preventDefault()
    if (!editingMovie) return

    if (!editTitle.trim()) {
      setNotice('Movie title cannot be empty.')
      setNoticeType('error')
      return
    }

    const yr = Number(editYear)
    if (isNaN(yr) || yr < 1888 || yr > 2100) {
      setNotice('Please enter a valid release year between 1888 and 2100.')
      setNoticeType('error')
      return
    }

    const rat = parseFloat(editRating)
    if (isNaN(rat) || rat < 0 || rat > 10) {
      setNotice('Movie rating must be between 0.0 and 10.0.')
      setNoticeType('error')
      return
    }

    setSubmitting(true)
    setNotice('')

    const updatePayload = {
      title: editTitle.trim(),
      year: yr,
      rating: rat,
      duration: editDuration.trim() || '2h 00m',
      genres: [editGenre],
      language: editLanguage,
      certificate: editCertificate,
      director: editDirector.trim() || 'Director',
      synopsis: editSynopsis.trim(),
      poster: editPoster.trim(),
      backdrop: editPoster.trim(),
    }

    try {
      const res = await api.put(`/movies/${editingMovie.id}`, updatePayload)
      const updated = res.data.movie

      setItems((current) => current.map((m) => (m.id === editingMovie.id ? updated : m)))
      setEditingMovie(null)
      setNotice(`"${updated.title}" successfully updated in server database!`)
      setNoticeType('success')
    } catch (err) {
      console.error('Failed to update movie:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to update movie.'
      setNotice(`Update Error: ${msg}`)
      setNoticeType('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id, movieTitle) {
    if (!window.confirm(`Are you sure you want to permanently delete "${movieTitle}"?`)) {
      return
    }

    try {
      await api.delete(`/movies/${id}`)
      setItems((current) => current.filter((m) => m.id !== id))
      setNotice(`"${movieTitle}" permanently deleted from server database.`)
      setNoticeType('info')
    } catch (err) {
      console.error('Failed to delete movie:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to delete movie.'
      setNotice(`Unsafe Deletion Blocked: ${msg}`)
      setNoticeType('error')
    }
  }

  const filteredItems = useMemo(() => {
    const q = filterQuery.toLowerCase().trim()
    if (!q) return items
    return items.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.language && m.language.toLowerCase().includes(q)) ||
        (m.director && m.director.toLowerCase().includes(q)),
    )
  }, [items, filterQuery])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Suite"
        title="Movie Management"
        description="Add, edit, search, or remove movie titles in real time. All changes persist directly in the database."
        actions={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-full bg-gold-400 px-5 py-2.5 text-xs font-bold text-cinema-950 shadow hover:bg-gold-500 cursor-pointer transition"
          >
            {showAddForm ? '✕ Close Form' : '+ Add Movie Entry'}
          </button>
        }
      />

      <DemoBanner>
        Administrator Role Verified: Connected to the live backend Movies API. Movie creations, modifications, and deletions persist directly in the backend store with safe deletion checks.
      </DemoBanner>

      {notice ? (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs ${
            noticeType === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : noticeType === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-gold-400/30 bg-gold-400/10 text-amber-200'
          }`}
        >
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            className="font-bold text-zinc-400 hover:text-white cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Add Movie Collapsible Form */}
      {showAddForm ? (
        <form
          onSubmit={handleAdd}
          className="rounded-3xl border border-zinc-700 bg-cinema-900/95 p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white text-sm">Add New Movie to Database</h3>
            <span className="text-xs text-emerald-400 font-semibold">● Database Synced</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Movie Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Avatar: Fire and Ash"
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Release Year *
              </label>
              <input
                type="number"
                min="1888"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
              >
                {availableLanguages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Primary Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
              >
                {availableGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Director
              </label>
              <input
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="e.g. James Cameron"
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Rating, Duration & Cert
              </label>
              <div className="flex gap-2 mt-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="8.5"
                  className="w-1/3 rounded-xl border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                />
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="2h 15m"
                  className="w-1/3 rounded-xl border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                />
                <select
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                  className="w-1/3 rounded-xl border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-white outline-none focus:border-gold-400"
                >
                  <option value="U">U</option>
                  <option value="UA">UA</option>
                  <option value="A">A</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Poster Asset URL or Path
              </label>
              <div className="flex gap-2 mt-1.5">
                <input
                  value={poster}
                  onChange={(e) => setPoster(e.target.value)}
                  placeholder="/posters/oppenheimer.jpg or https://..."
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                />
                <label className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 cursor-pointer transition shrink-0">
                  <span>📁 Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setPoster)}
                  />
                </label>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-zinc-500 py-0.5">Asset library:</span>
                {PRESET_POSTERS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPoster(preset.url)}
                    className={`rounded px-2 py-0.5 transition ${
                      poster === preset.url
                        ? 'bg-gold-400 text-black font-bold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-20 w-14 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shrink-0">
                <PosterImage src={poster} alt="Preview" className="h-full w-full object-cover" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-300">Live Poster Preview</span>
                <p className="text-[11px] text-zinc-500">Previewed above before saving to database</p>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Synopsis
              </label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={2}
                placeholder="Brief plot synopsis..."
                className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-full border border-zinc-700 px-5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gold-400 px-6 py-2 text-xs font-bold text-cinema-950 hover:bg-gold-500 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving to Database...' : '+ Save Movie to Database'}
            </button>
          </div>
        </form>
      ) : null}

      {/* Search and Table Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter movies by title, director, language..."
          className="w-full max-w-sm rounded-xl border border-zinc-700 bg-cinema-900 px-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-gold-400"
        />
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>
            {filteredItems.length} of {items.length} titles in database
          </span>
          {loading ? <span className="text-gold-400 animate-pulse">Loading live records...</span> : null}
        </div>
      </div>

      {/* Movies Data Table */}
      <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-cinema-900 shadow-xl">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-cinema-950 text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5 font-bold">Poster</th>
              <th className="px-5 py-3.5 font-bold">Title</th>
              <th className="px-5 py-3.5 font-bold">Year</th>
              <th className="px-5 py-3.5 font-bold">Rating</th>
              <th className="px-5 py-3.5 font-bold">Language & Genre</th>
              <th className="px-5 py-3.5 font-bold">Director</th>
              <th className="px-5 py-3.5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-zinc-500">
                  Loading movies from backend database...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-zinc-500">
                  No movies found matching your search.
                </td>
              </tr>
            ) : (
              filteredItems.map((movie) => (
                <tr key={movie.id} className="transition hover:bg-zinc-850/60">
                  <td className="px-5 py-3">
                    <PosterImage
                      src={movie.poster}
                      alt={movie.title}
                      className="h-12 w-9 rounded-md object-cover border border-zinc-800"
                    />
                  </td>
                  <td className="px-5 py-3 font-bold text-white">{movie.title}</td>
                  <td className="px-5 py-3 text-zinc-400">{movie.year}</td>
                  <td className="px-5 py-3 font-semibold text-gold-400">⭐ {movie.rating}</td>
                  <td className="px-5 py-3 text-zinc-400">
                    {movie.language} · {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{movie.director}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(movie)}
                        className="rounded-lg border border-gold-400/40 bg-gold-400/10 px-3 py-1 text-xs font-semibold text-gold-400 hover:bg-gold-400 hover:text-black cursor-pointer transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(movie.id, movie.title)}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Movie Modal */}
      {editingMovie ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-700 bg-cinema-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display text-xl font-bold text-white">
                Edit Movie: {editingMovie.title}
              </h3>
              <button
                onClick={() => setEditingMovie(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Title *
                  </label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Release Year *
                  </label>
                  <input
                    type="number"
                    min="1888"
                    max="2100"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Language
                  </label>
                  <select
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                  >
                    {availableLanguages.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Genre
                  </label>
                  <select
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                  >
                    {availableGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Rating & Duration
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={editRating}
                      onChange={(e) => setEditRating(e.target.value)}
                      className="w-1/2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                    />
                    <input
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="w-1/2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Director
                  </label>
                  <input
                    value={editDirector}
                    onChange={(e) => setEditDirector(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Poster Asset URL, Path or File Upload
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <input
                      value={editPoster}
                      onChange={(e) => setEditPoster(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                    />
                    <label className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 cursor-pointer transition shrink-0">
                      <span>📁 Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setEditPoster)}
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="text-zinc-500 py-0.5">Asset library:</span>
                    {PRESET_POSTERS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setEditPoster(preset.url)}
                        className={`rounded px-2 py-0.5 transition ${
                          editPoster === preset.url
                            ? 'bg-gold-400 text-black font-bold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Synopsis
                  </label>
                  <textarea
                    value={editSynopsis}
                    onChange={(e) => setEditSynopsis(e.target.value)}
                    rows={2}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingMovie(null)}
                  className="rounded-full border border-zinc-700 px-5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-gold-400 px-6 py-2 text-xs font-bold text-cinema-950 hover:bg-gold-500 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminMoviesPage
