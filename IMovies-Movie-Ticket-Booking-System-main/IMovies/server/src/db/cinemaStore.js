import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Booking from '../models/Booking.js'
import Movie from '../models/Movie.js'
import Show from '../models/Show.js'
import Theatre from '../models/Theatre.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.resolve(__dirname, '../../data')
const moviesFilePath = path.join(dataDir, 'movies.json')
const showsFilePath = path.join(dataDir, 'shows.json')
const theatresFilePath = path.join(dataDir, 'theatres.json')
const bookingsFilePath = path.join(dataDir, 'bookings.json')

// Mutex to guarantee serial atomic execution across concurrent asynchronous requests
class Mutex {
  constructor() {
    this._queue = Promise.resolve()
  }
  lock() {
    let unlock
    const next = new Promise((resolve) => {
      unlock = resolve
    })
    const prev = this._queue
    this._queue = prev.then(() => next)
    return () => unlock()
  }
}

const bookingLock = new Mutex()

// Default Movie Seeds
const defaultMovies = [
  {
    id: 'oppenheimer',
    title: 'Oppenheimer',
    year: 2023,
    rating: 8.3,
    duration: '3h 0m',
    genres: ['Biography', 'Drama'],
    language: 'English',
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'],
    synopsis:
      'The story of J. Robert Oppenheimer and the creation of the atomic bomb, told with tense, large-format cinema.',
    poster: '/posters/oppenheimer.jpg',
    backdrop: '/posters/oppenheimer-wide.jpg',
    featured: true,
  },
  {
    id: 'interstellar',
    title: 'Interstellar',
    year: 2014,
    rating: 8.7,
    duration: '2h 49m',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    language: 'English',
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    synopsis:
      'A team of explorers travel through a wormhole in space in an attempt to ensure humanity’s survival.',
    poster: '/posters/interstellar.jpg',
    backdrop: '/posters/interstellar.jpg',
    featured: true,
  },
  {
    id: 'jawan',
    title: 'Jawan',
    year: 2023,
    rating: 7.0,
    duration: '2h 49m',
    genres: ['Action', 'Thriller'],
    language: 'Hindi',
    certificate: 'UA',
    director: 'Atlee',
    cast: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi'],
    synopsis:
      'A man sets out on a mission to correct the wrongs in society, with a high-voltage action drama.',
    poster: '/posters/jawan.jpg',
    backdrop: '/posters/jawan.jpg',
    featured: true,
  },
  {
    id: 'dune-part-two',
    title: 'Dune: Part Two',
    year: 2024,
    rating: 8.5,
    duration: '2h 46m',
    genres: ['Sci-Fi', 'Adventure'],
    language: 'English',
    certificate: 'UA',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
    synopsis:
      'Paul Atreides unites with the Fremen to wage war against House Harkonnen and decide the fate of Arrakis.',
    poster: '/posters/dune-part-two.jpg',
    backdrop: '/posters/dune-part-two.jpg',
    featured: true,
  },
  {
    id: 'spider-verse',
    title: 'Spider-Man: Across the Spider-Verse',
    year: 2023,
    rating: 8.6,
    duration: '2h 20m',
    genres: ['Animation', 'Action', 'Adventure'],
    language: 'English',
    certificate: 'U',
    director: 'Joaquim Dos Santos',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac'],
    synopsis:
      'Miles Morales catapults across the Multiverse, meeting a team of Spider-People on a collision course.',
    poster: '/posters/spider-verse.jpg',
    backdrop: '/posters/spider-verse.jpg',
    featured: false,
  },
  {
    id: '12th-fail',
    title: '12th Fail',
    year: 2023,
    rating: 8.8,
    duration: '2h 27m',
    genres: ['Drama', 'Biography'],
    language: 'Hindi',
    certificate: 'U',
    director: 'Vidhu Vinod Chopra',
    cast: ['Vikrant Massey', 'Medha Shankar'],
    synopsis:
      'Based on a true story, a determined student works against the odds to join the civil services.',
    poster: '/posters/12th-fail.svg',
    backdrop: '/posters/12th-fail.svg',
    featured: false,
  },
  {
    id: 'dark-knight',
    title: 'The Dark Knight',
    year: 2008,
    rating: 9.0,
    duration: '2h 32m',
    genres: ['Action', 'Thriller', 'Drama'],
    language: 'English',
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
    synopsis:
      'Batman faces the Joker, a criminal mastermind who plunges Gotham into chaos.',
    poster: '/posters/dark-knight.jpg',
    backdrop: '/posters/dark-knight.jpg',
    featured: false,
  },
  {
    id: 'rrr',
    title: 'RRR',
    year: 2022,
    rating: 7.8,
    duration: '3h 7m',
    genres: ['Action', 'Drama'],
    language: 'Telugu',
    certificate: 'UA',
    director: 'S. S. Rajamouli',
    cast: ['N. T. Rama Rao Jr.', 'Ram Charan', 'Alia Bhatt'],
    synopsis:
      'A fictional story about two Indian revolutionaries and their fight against the British Raj.',
    poster: '/posters/rrr.jpg',
    backdrop: '/posters/rrr.jpg',
    featured: false,
  },
  {
    id: 'inception',
    title: 'Inception',
    year: 2010,
    rating: 8.8,
    duration: '2h 28m',
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    language: 'English',
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
    synopsis:
      'A thief who steals corporate secrets through dream-sharing is given a chance to have his crime erased.',
    poster: '/posters/inception.jpg',
    backdrop: '/posters/inception.jpg',
    featured: false,
  },
  {
    id: 'kalki',
    title: 'Kalki 2898 AD',
    year: 2024,
    rating: 7.0,
    duration: '3h 1m',
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    language: 'Telugu',
    certificate: 'UA',
    director: 'Nag Ashwin',
    cast: ['Prabhas', 'Amitabh Bachchan', 'Deepika Padukone'],
    synopsis:
      'A mythic sci-fi epic set in a future dystopia, weaving ancient legend with a rebel uprising.',
    poster: '/posters/kalki.jpg',
    backdrop: '/posters/kalki.jpg',
    featured: false,
  },
  {
    id: 'inside-out-2',
    title: 'Inside Out 2',
    year: 2024,
    rating: 7.6,
    duration: '1h 36m',
    genres: ['Animation', 'Adventure', 'Drama'],
    language: 'English',
    certificate: 'U',
    director: 'Kelsey Mann',
    cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman'],
    synopsis:
      'Riley’s emotions welcome new feelings as she enters her teenage years.',
    poster: '/posters/inside-out-2.jpg',
    backdrop: '/posters/inside-out-2.jpg',
    featured: false,
  },
  {
    id: 'pathaan',
    title: 'Pathaan',
    year: 2023,
    rating: 6.6,
    duration: '2h 26m',
    genres: ['Action', 'Thriller'],
    language: 'Hindi',
    certificate: 'UA',
    director: 'Siddharth Anand',
    cast: ['Shah Rukh Khan', 'Deepika Padukone', 'John Abraham'],
    synopsis:
      'An exiled RAW agent works with an unlikely ally to stop a mercenary group from attacking India.',
    poster: '/posters/pathaan.jpg',
    backdrop: '/posters/pathaan.jpg',
    featured: false,
  },
]

// Default Theatres Seeds
const defaultTheatres = [
  {
    id: 'pvr-phoenix',
    name: 'PVR Phoenix Mall',
    city: 'Pune',
    address: 'Phoenix Marketcity, Viman Nagar',
    screens: ['Screen 1', 'IMAX', 'Screen 3'],
    amenities: ['Dolby Atmos', 'Recliner', 'Food court'],
  },
  {
    id: 'inox-city',
    name: 'INOX City Center',
    city: 'Pune',
    address: 'City Center Mall, Bund Garden',
    screens: ['Screen 2', 'Screen 4'],
    amenities: ['4K projection', 'Wheelchair access'],
  },
  {
    id: 'cinepolis-downtown',
    name: 'Cinepolis Downtown',
    city: 'Pune',
    address: 'Downtown Plaza, Baner',
    screens: ['Audi 1', 'Audi 2'],
    amenities: ['Laser projection', 'Cafe'],
  },
]

// Default Shows Seeds
const defaultShows = [
  {
    id: 'show-opp-1',
    movieId: 'oppenheimer',
    theatreId: 'pvr-phoenix',
    screen: 'IMAX',
    date: '2026-10-27',
    time: '10:30 AM',
    price: 320,
    format: 'IMAX',
    language: 'English',
    seatRows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 12,
    bookedSeats: ['A4', 'A5', 'C8', 'D1', 'D2', 'F10'],
    maxSeatsPerBooking: 6,
    status: 'scheduled',
  },
  {
    id: 'show-opp-2',
    movieId: 'oppenheimer',
    theatreId: 'inox-city',
    screen: 'Screen 2',
    date: '2026-10-27',
    time: '6:45 PM',
    price: 220,
    format: '2D',
    language: 'English',
    seatRows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 12,
    bookedSeats: ['B3', 'B4', 'E6'],
    maxSeatsPerBooking: 6,
    status: 'scheduled',
  },
  {
    id: 'show-int-1',
    movieId: 'interstellar',
    theatreId: 'pvr-phoenix',
    screen: 'IMAX',
    date: '2026-10-27',
    time: '2:00 PM',
    price: 340,
    format: 'IMAX',
    language: 'English',
    seatRows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 12,
    bookedSeats: ['A1', 'A2', 'A3', 'C5', 'G7'],
    maxSeatsPerBooking: 6,
    status: 'scheduled',
  },
  {
    id: 'show-jawan-1',
    movieId: 'jawan',
    theatreId: 'inox-city',
    screen: 'Screen 4',
    date: '2026-10-27',
    time: '4:30 PM',
    price: 180,
    format: '2D',
    language: 'Hindi',
    seatRows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 12,
    bookedSeats: ['C2', 'C3', 'C4', 'F5'],
    maxSeatsPerBooking: 6,
    status: 'scheduled',
  },
  {
    id: 'show-dune-1',
    movieId: 'dune-part-two',
    theatreId: 'pvr-phoenix',
    screen: 'IMAX',
    date: '2026-10-28',
    time: '11:00 AM',
    price: 360,
    format: 'IMAX',
    language: 'English',
    seatRows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 12,
    bookedSeats: ['E4', 'E5', 'E6', 'A12'],
    maxSeatsPerBooking: 6,
    status: 'scheduled',
  },
  {
    id: 'show-expired-1',
    movieId: 'oppenheimer',
    theatreId: 'pvr-phoenix',
    screen: 'Screen 1',
    date: '2026-01-01', // Clearly in the past
    time: '9:00 AM',
    price: 200,
    format: '2D',
    language: 'English',
    seatRows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 12,
    bookedSeats: ['A1'],
    maxSeatsPerBooking: 6,
    status: 'expired',
  },
]

// JSON Helpers
function readFileJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2))
      return defaultValue
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw || '[]')
  } catch {
    return defaultValue
  }
}

function writeFileJson(filePath, data) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err)
  }
}

export async function initCinemaStore() {
  // Ensure default movies
  const currentMovies = readFileJson(moviesFilePath, defaultMovies)
  if (!currentMovies || currentMovies.length === 0) {
    writeFileJson(moviesFilePath, defaultMovies)
  }

  // Ensure default theatres
  const currentTheatres = readFileJson(theatresFilePath, defaultTheatres)
  if (!currentTheatres || currentTheatres.length === 0) {
    writeFileJson(theatresFilePath, defaultTheatres)
  }

  // Ensure default shows
  const currentShows = readFileJson(showsFilePath, defaultShows)
  if (!currentShows || currentShows.length === 0) {
    writeFileJson(showsFilePath, defaultShows)
  }

  // Ensure bookings file
  readFileJson(bookingsFilePath, [])
}

export function isShowExpired(show) {
  if (show.status === 'expired') return true
  try {
    const today = new Date().toISOString().split('T')[0]
    if (show.date < today) {
      return true
    }
    return false
  } catch {
    return false
  }
}

// ==========================================
// MOVIES MANAGEMENT
// ==========================================
export async function getMovies({ query = '', genre = 'all', language = 'all', featured } = {}) {
  const movies = readFileJson(moviesFilePath, defaultMovies)
  const term = query.trim().toLowerCase()

  return movies.filter((movie) => {
    const matchesQuery =
      term.length === 0 ||
      movie.title.toLowerCase().includes(term) ||
      (movie.director && movie.director.toLowerCase().includes(term)) ||
      (Array.isArray(movie.cast) &&
        movie.cast.some((c) => c.toLowerCase().includes(term)))

    const matchesGenre =
      genre === 'all' || (Array.isArray(movie.genres) && movie.genres.includes(genre))

    const matchesLanguage =
      language === 'all' || movie.language?.toLowerCase() === language.toLowerCase()

    const matchesFeatured =
      featured === undefined ? true : movie.featured === (featured === 'true' || featured === true)

    return matchesQuery && matchesGenre && matchesLanguage && matchesFeatured
  })
}

export async function getMovieById(id) {
  const list = readFileJson(moviesFilePath, defaultMovies)
  return list.find((m) => m.id === id) || null
}

export async function createMovie(movieData) {
  if (!movieData.title || !movieData.title.trim()) {
    const err = new Error('Movie title is required')
    err.status = 400
    throw err
  }

  const yr = Number(movieData.year)
  if (movieData.year !== undefined && (isNaN(yr) || yr < 1888 || yr > 2100)) {
    const err = new Error('Movie release year must be a valid four-digit year')
    err.status = 400
    throw err
  }

  const rat = Number(movieData.rating)
  if (movieData.rating !== undefined && (isNaN(rat) || rat < 0 || rat > 10)) {
    const err = new Error('Movie rating must be between 0 and 10')
    err.status = 400
    throw err
  }

  const movies = readFileJson(moviesFilePath, defaultMovies)
  const baseId = movieData.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `movie-${Date.now()}`

  let id = movieData.id || baseId
  let counter = 1
  while (movies.some((m) => m.id === id)) {
    id = `${baseId}-${counter++}`
  }

  const newMovie = {
    id,
    title: movieData.title.trim(),
    year: yr || new Date().getFullYear(),
    rating: !isNaN(rat) ? rat : 7.5,
    duration: movieData.duration?.trim() || '2h 00m',
    genres: Array.isArray(movieData.genres)
      ? movieData.genres
      : (movieData.genre || movieData.genres || 'Action')
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
    language: movieData.language?.trim() || 'English',
    certificate: movieData.certificate?.trim() || 'UA',
    director: movieData.director?.trim() || 'Director',
    cast: Array.isArray(movieData.cast)
      ? movieData.cast
      : (movieData.cast || 'Lead Actor').split(',').map((c) => c.trim()).filter(Boolean),
    synopsis: movieData.synopsis?.trim() || `${movieData.title.trim()} was recently added to the cinema repertoire.`,
    poster: movieData.poster?.trim() || '',
    backdrop: movieData.backdrop?.trim() || movieData.poster?.trim() || '',
    featured: Boolean(movieData.featured),
    createdAt: new Date().toISOString(),
  }

  movies.unshift(newMovie)
  writeFileJson(moviesFilePath, movies)

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Movie.findOneAndUpdate({ id: newMovie.id }, newMovie, { upsert: true })
    } catch (e) {
      console.error('[Database] Movie Mongo sync error:', e.message)
    }
  }

  return newMovie
}

export async function updateMovie(id, updateData) {
  const movies = readFileJson(moviesFilePath, defaultMovies)
  const index = movies.findIndex((m) => m.id === id)

  if (index === -1) {
    const err = new Error(`Movie with ID "${id}" not found`)
    err.status = 404
    throw err
  }

  if (updateData.title !== undefined && !updateData.title.trim()) {
    const err = new Error('Movie title cannot be empty')
    err.status = 400
    throw err
  }

  if (updateData.year !== undefined) {
    const yr = Number(updateData.year)
    if (isNaN(yr) || yr < 1888 || yr > 2100) {
      const err = new Error('Movie release year must be a valid four-digit year')
      err.status = 400
      throw err
    }
  }

  if (updateData.rating !== undefined) {
    const rat = Number(updateData.rating)
    if (isNaN(rat) || rat < 0 || rat > 10) {
      const err = new Error('Movie rating must be between 0 and 10')
      err.status = 400
      throw err
    }
  }

  const updatedMovie = {
    ...movies[index],
    ...updateData,
    id, // Preserve ID
    updatedAt: new Date().toISOString(),
  }

  movies[index] = updatedMovie
  writeFileJson(moviesFilePath, movies)

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Movie.findOneAndUpdate({ id }, updatedMovie, { upsert: true })
    } catch (e) {
      console.error('[Database] Movie Mongo update error:', e.message)
    }
  }

  return updatedMovie
}

export async function deleteMovie(id) {
  const movies = readFileJson(moviesFilePath, defaultMovies)
  const index = movies.findIndex((m) => m.id === id)

  if (index === -1) {
    const err = new Error(`Movie with ID "${id}" not found`)
    err.status = 404
    throw err
  }

  const movie = movies[index]

  // Check for active scheduled showtimes
  const shows = readFileJson(showsFilePath, defaultShows)
  const activeShows = shows.filter((s) => s.movieId === id && !isShowExpired(s))
  if (activeShows.length > 0) {
    const err = new Error(`Cannot delete movie "${movie.title}" with ${activeShows.length} active scheduled showtime(s). Please remove all showtimes first.`)
    err.status = 400
    throw err
  }

  const deleted = movies.splice(index, 1)[0]
  writeFileJson(moviesFilePath, movies)

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Movie.deleteOne({ id })
    } catch (e) {
      console.error('[Database] Movie Mongo delete error:', e.message)
    }
  }

  return deleted
}

// ==========================================
// THEATRES MANAGEMENT
// ==========================================
export async function getTheatres() {
  return readFileJson(theatresFilePath, defaultTheatres)
}

export async function getTheatreById(id) {
  const list = await getTheatres()
  return list.find((t) => t.id === id) || null
}

export async function createTheatre(theatreData) {
  if (!theatreData.name || !theatreData.name.trim()) {
    const err = new Error('Theatre name is required')
    err.status = 400
    throw err
  }
  if (!theatreData.city || !theatreData.city.trim()) {
    const err = new Error('City is required for theatre location')
    err.status = 400
    throw err
  }

  const theatres = readFileJson(theatresFilePath, defaultTheatres)
  const baseId = theatreData.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `theatre-${Date.now()}`

  let id = theatreData.id || baseId
  let counter = 1
  while (theatres.some((t) => t.id === id)) {
    id = `${baseId}-${counter++}`
  }

  if (theatreData.seatingCapacity !== undefined && theatreData.seatingCapacity !== null && theatreData.seatingCapacity !== '') {
    const cap = Number(theatreData.seatingCapacity)
    if (isNaN(cap) || cap <= 0) {
      const err = new Error('Seating capacity must be a positive integer greater than 0')
      err.status = 400
      throw err
    }
  }

  const parsedScreens = Array.isArray(theatreData.screens) && theatreData.screens.length > 0
    ? theatreData.screens
    : (theatreData.screens || 'Screen 1, Screen 2')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

  const seatingCapacity = Number(theatreData.seatingCapacity) > 0
    ? Number(theatreData.seatingCapacity)
    : (parsedScreens.length > 0 ? parsedScreens.length * 96 : 96)

  const newTheatre = {
    id,
    name: theatreData.name.trim(),
    city: theatreData.city.trim(),
    address: theatreData.address?.trim() || 'Central Plaza',
    screens: parsedScreens,
    amenities: Array.isArray(theatreData.amenities)
      ? theatreData.amenities
      : ['Dolby Atmos', '4K Projection', 'Food Court'],
    seatingCapacity,
    createdAt: new Date().toISOString(),
  }

  theatres.unshift(newTheatre)
  writeFileJson(theatresFilePath, theatres)

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Theatre.findOneAndUpdate({ id: newTheatre.id }, newTheatre, { upsert: true })
    } catch (e) {
      console.error('[Database] Theatre Mongo sync error:', e.message)
    }
  }

  return newTheatre
}

export async function updateTheatre(id, updateData) {
  const theatres = readFileJson(theatresFilePath, defaultTheatres)
  const index = theatres.findIndex((t) => t.id === id)

  if (index === -1) {
    const err = new Error(`Theatre with ID "${id}" not found`)
    err.status = 404
    throw err
  }

  if (updateData.name !== undefined && !updateData.name.trim()) {
    const err = new Error('Theatre name cannot be empty')
    err.status = 400
    throw err
  }

  if (updateData.seatingCapacity !== undefined && updateData.seatingCapacity !== null && updateData.seatingCapacity !== '') {
    const cap = Number(updateData.seatingCapacity)
    if (isNaN(cap) || cap <= 0) {
      const err = new Error('Seating capacity must be a positive integer greater than 0')
      err.status = 400
      throw err
    }
  }

  const updated = {
    ...theatres[index],
    ...updateData,
    id, // Preserve ID
    updatedAt: new Date().toISOString(),
  }

  if (updateData.screens) {
    updated.screens = Array.isArray(updateData.screens)
      ? updateData.screens
      : updateData.screens.split(',').map((s) => s.trim()).filter(Boolean)
  }

  if (updateData.seatingCapacity !== undefined && updateData.seatingCapacity !== null && updateData.seatingCapacity !== '') {
    updated.seatingCapacity = Number(updateData.seatingCapacity)
  }

  theatres[index] = updated
  writeFileJson(theatresFilePath, theatres)

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Theatre.findOneAndUpdate({ id }, updated, { upsert: true })
    } catch (e) {
      console.error('[Database] Theatre Mongo update error:', e.message)
    }
  }

  return updated
}

export async function deleteTheatre(id) {
  const theatres = readFileJson(theatresFilePath, defaultTheatres)
  const index = theatres.findIndex((t) => t.id === id)

  if (index === -1) {
    const err = new Error(`Theatre with ID "${id}" not found`)
    err.status = 404
    throw err
  }

  const theatre = theatres[index]

  // Check dependent active shows
  const shows = readFileJson(showsFilePath, defaultShows)
  const activeShows = shows.filter((s) => s.theatreId === id && !isShowExpired(s))
  if (activeShows.length > 0) {
    const err = new Error(
      `Cannot delete theatre "${theatre.name}" because it has ${activeShows.length} active scheduled showtime(s). Please remove all showtimes first.`,
    )
    err.status = 400
    throw err
  }

  // Check dependent confirmed customer bookings
  const bookings = readFileJson(bookingsFilePath, [])
  const activeBookings = bookings.filter((b) => b.theatreId === id && b.status === 'confirmed')
  if (activeBookings.length > 0) {
    const err = new Error(
      `Cannot delete theatre "${theatre.name}" because it has ${activeBookings.length} confirmed customer booking(s).`,
    )
    err.status = 400
    throw err
  }

  const deleted = theatres.splice(index, 1)[0]
  writeFileJson(theatresFilePath, theatres)

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Theatre.deleteOne({ id })
    } catch (e) {
      console.error('[Database] Theatre Mongo delete error:', e.message)
    }
  }

  return deleted
}

// ==========================================
// SHOWS MANAGEMENT
// ==========================================
export async function getShows() {
  return readFileJson(showsFilePath, defaultShows)
}

export async function getShowsForMovie(movieId) {
  const shows = await getShows()
  return shows.filter((s) => s.movieId === movieId && !isShowExpired(s))
}

export async function getShowById(id) {
  const shows = await getShows()
  return shows.find((s) => s.id === id) || null
}

export async function createShow(showData) {
  if (!showData.movieId || !showData.theatreId) {
    const err = new Error('Both movieId and theatreId are required')
    err.status = 400
    throw err
  }

  // Verify movie exists
  const movie = await getMovieById(showData.movieId)
  if (!movie) {
    const err = new Error(`Movie with ID "${showData.movieId}" does not exist in the catalogue`)
    err.status = 400
    throw err
  }

  // Verify theatre exists
  const theatre = await getTheatreById(showData.theatreId)
  if (!theatre) {
    const err = new Error(`Theatre with ID "${showData.theatreId}" does not exist`)
    err.status = 400
    throw err
  }

  const price = Number(showData.price)
  if (isNaN(price) || price <= 0) {
    const err = new Error('Ticket price must be a positive number greater than 0')
    err.status = 400
    throw err
  }

  const showDate = showData.date || new Date().toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  if (showDate < today) {
    const err = new Error('Cannot schedule showtimes on past dates')
    err.status = 400
    throw err
  }

  const showTime = showData.time?.trim() || '7:00 PM'
  const screen = showData.screen?.trim() || 'Screen 1'

  if (showData.seatsPerRow !== undefined && showData.seatsPerRow !== null && showData.seatsPerRow !== '') {
    const spr = Number(showData.seatsPerRow)
    if (isNaN(spr) || spr <= 0 || spr > 30) {
      const err = new Error('Seats per row must be a positive number between 1 and 30')
      err.status = 400
      throw err
    }
  }

  if (showData.maxSeatsPerBooking !== undefined && showData.maxSeatsPerBooking !== null && showData.maxSeatsPerBooking !== '') {
    const ms = Number(showData.maxSeatsPerBooking)
    if (isNaN(ms) || ms <= 0 || ms > 20) {
      const err = new Error('Max seats per booking must be a positive number between 1 and 20')
      err.status = 400
      throw err
    }
  }

  if (showData.seatRows !== undefined) {
    if (!Array.isArray(showData.seatRows) || showData.seatRows.length === 0) {
      const err = new Error('Seat rows must be a non-empty array of row letters')
      err.status = 400
      throw err
    }
  }

  // Schedule conflict detection (same theatre, same screen, same date, same time)
  const shows = readFileJson(showsFilePath, defaultShows)
  const conflict = shows.find(
    (s) =>
      s.theatreId === showData.theatreId &&
      s.screen.trim().toLowerCase() === screen.toLowerCase() &&
      s.date === showDate &&
      s.time.trim().toLowerCase() === showTime.toLowerCase() &&
      s.status !== 'cancelled' &&
      !isShowExpired(s),
  )

  if (conflict) {
    const err = new Error(
      `Schedule Conflict: ${theatre.name} (${screen}) already has a screening scheduled for "${conflict.movieId}" on ${showDate} at ${showTime}.`,
    )
    err.status = 409
    throw err
  }

  const id = showData.id || `show-${Date.now()}`
  const newShow = {
    id,
    movieId: showData.movieId,
    theatreId: showData.theatreId,
    screen,
    date: showDate,
    time: showTime,
    price,
    format: showData.format || '2D',
    language: showData.language || movie.language || 'English',
    seatRows: showData.seatRows || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: Number(showData.seatsPerRow) || 12,
    bookedSeats: Array.isArray(showData.bookedSeats) ? showData.bookedSeats : [],
    maxSeatsPerBooking: Number(showData.maxSeatsPerBooking) || 6,
    status: showData.status || 'scheduled',
    createdAt: new Date().toISOString(),
  }

  shows.unshift(newShow)
  writeFileJson(showsFilePath, shows)

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Show.findOneAndUpdate({ id: newShow.id }, newShow, { upsert: true })
    } catch (e) {
      console.error('[Database] Show Mongo sync error:', e.message)
    }
  }

  return newShow
}

export async function updateShow(id, updateData) {
  const shows = readFileJson(showsFilePath, defaultShows)
  const index = shows.findIndex((s) => s.id === id)

  if (index === -1) {
    const err = new Error(`Show with ID "${id}" not found`)
    err.status = 404
    throw err
  }

  const current = shows[index]

  if (updateData.movieId) {
    const movie = await getMovieById(updateData.movieId)
    if (!movie) {
      const err = new Error(`Movie with ID "${updateData.movieId}" does not exist`)
      err.status = 400
      throw err
    }
  }

  const theatreId = updateData.theatreId || current.theatreId
  if (updateData.theatreId) {
    const theatre = await getTheatreById(updateData.theatreId)
    if (!theatre) {
      const err = new Error(`Theatre with ID "${updateData.theatreId}" does not exist`)
      err.status = 400
      throw err
    }
  }

  if (updateData.price !== undefined) {
    const p = Number(updateData.price)
    if (isNaN(p) || p <= 0) {
      const err = new Error('Ticket price must be a positive number greater than 0')
      err.status = 400
      throw err
    }
  }

  if (updateData.seatsPerRow !== undefined && updateData.seatsPerRow !== null && updateData.seatsPerRow !== '') {
    const spr = Number(updateData.seatsPerRow)
    if (isNaN(spr) || spr <= 0 || spr > 30) {
      const err = new Error('Seats per row must be a positive number between 1 and 30')
      err.status = 400
      throw err
    }
  }

  if (updateData.maxSeatsPerBooking !== undefined && updateData.maxSeatsPerBooking !== null && updateData.maxSeatsPerBooking !== '') {
    const ms = Number(updateData.maxSeatsPerBooking)
    if (isNaN(ms) || ms <= 0 || ms > 20) {
      const err = new Error('Max seats per booking must be a positive number between 1 and 20')
      err.status = 400
      throw err
    }
  }

  if (updateData.seatRows !== undefined) {
    if (!Array.isArray(updateData.seatRows) || updateData.seatRows.length === 0) {
      const err = new Error('Seat rows must be a non-empty array of row letters')
      err.status = 400
      throw err
    }
  }

  const targetDate = updateData.date || current.date
  const targetTime = updateData.time ? updateData.time.trim() : current.time
  const targetScreen = updateData.screen ? updateData.screen.trim() : current.screen

  // Check schedule conflict with any other show
  const conflict = shows.find(
    (s) =>
      s.id !== id &&
      s.theatreId === theatreId &&
      s.screen.trim().toLowerCase() === targetScreen.toLowerCase() &&
      s.date === targetDate &&
      s.time.trim().toLowerCase() === targetTime.toLowerCase() &&
      s.status !== 'cancelled' &&
      !isShowExpired(s),
  )

  if (conflict) {
    const err = new Error(
      `Schedule Conflict: Screen "${targetScreen}" at this theatre already has a screening on ${targetDate} at ${targetTime}.`,
    )
    err.status = 409
    throw err
  }

  const updated = {
    ...current,
    ...updateData,
    id, // Preserve ID
    updatedAt: new Date().toISOString(),
  }

  shows[index] = updated
  writeFileJson(showsFilePath, shows)

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Show.findOneAndUpdate({ id }, updated, { upsert: true })
    } catch (e) {
      console.error('[Database] Show Mongo update error:', e.message)
    }
  }

  return updated
}

export async function deleteShow(id) {
  const shows = readFileJson(showsFilePath, defaultShows)
  const index = shows.findIndex((s) => s.id === id)

  if (index === -1) {
    const err = new Error(`Show with ID "${id}" not found`)
    err.status = 404
    throw err
  }

  const show = shows[index]

  // Check if show has confirmed bookings or reserved seats
  const bookings = readFileJson(bookingsFilePath, [])
  const confirmedBookings = bookings.filter((b) => b.showId === id && b.status === 'confirmed')
  if ((show.bookedSeats && show.bookedSeats.length > 0) || confirmedBookings.length > 0) {
    const count = show.bookedSeats?.length || confirmedBookings.length
    const err = new Error(
      `Cannot delete showtime because it has ${count} reserved seat(s) or active booking(s). Please cancel bookings first.`,
    )
    err.status = 400
    throw err
  }

  const deleted = shows.splice(index, 1)[0]
  writeFileJson(showsFilePath, shows)

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await Show.deleteOne({ id })
    } catch (e) {
      console.error('[Database] Show Mongo delete error:', e.message)
    }
  }

  return deleted
}

// ==========================================
// ADMIN DASHBOARD METRICS
// ==========================================
export async function getAdminMetrics() {
  const movies = readFileJson(moviesFilePath, defaultMovies)
  const theatres = readFileJson(theatresFilePath, defaultTheatres)
  const shows = readFileJson(showsFilePath, defaultShows)
  const bookings = readFileJson(bookingsFilePath, [])

  const activeShows = shows.filter((s) => !isShowExpired(s))
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled')

  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)

  // Recent 5 bookings
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0))
    .slice(0, 5)

  return {
    moviesCount: movies.length,
    theatresCount: theatres.length,
    showsCount: shows.length,
    activeShowsCount: activeShows.length,
    bookingsCount: confirmedBookings.length,
    cancelledBookingsCount: cancelledBookings.length,
    totalRevenue,
    isDemoRevenue: true,
    recentBookings,
    serverUptimeSeconds: Math.floor(process.uptime()),
  }
}

// ==========================================
// SEAT VALIDATION & ATOMIC BOOKING
// ==========================================
export function validateSeatFormat(show, seatList) {
  if (!Array.isArray(seatList) || seatList.length === 0) {
    return { valid: false, error: 'At least one seat must be selected' }
  }

  const maxAllowed = show.maxSeatsPerBooking || 6
  if (seatList.length > maxAllowed) {
    return {
      valid: false,
      error: `You cannot select more than ${maxAllowed} seats at a time`,
    }
  }

  const rows = show.seatRows || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const maxNumber = show.seatsPerRow || 12

  for (const seat of seatList) {
    if (typeof seat !== 'string' || seat.length < 2) {
      return { valid: false, error: `Invalid seat identifier: "${seat}"` }
    }
    const row = seat[0].toUpperCase()
    const num = Number(seat.slice(1))

    if (!rows.includes(row) || isNaN(num) || num < 1 || num > maxNumber) {
      return {
        valid: false,
        error: `Invalid seat identifier "${seat}". Allowed rows: ${rows.join(', ')}, seats: 1 to ${maxNumber}`,
      }
    }
  }

  // Check for duplicates in the request itself
  const unique = new Set(seatList)
  if (unique.size !== seatList.length) {
    return { valid: false, error: 'Duplicate seats selected in request' }
  }

  return { valid: true }
}

export async function getBookingById(id) {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const doc = await Booking.findOne({ id }).lean()
      if (doc) return doc
    } catch {}
  }
  const bookings = readFileJson(bookingsFilePath, [])
  return bookings.find((b) => b.id === id || b._id === id) || null
}

export async function atomicBookSeats({
  showId,
  requestedSeats,
  userId,
  movieId,
  theatreId,
  movieTitle,
  paymentMethod = 'demo_simulator',
}) {
  const release = await bookingLock.lock()

  try {
    const shows = readFileJson(showsFilePath, defaultShows)
    const showIndex = shows.findIndex((s) => s.id === showId)

    if (showIndex === -1) {
      const err = new Error('Show not found')
      err.status = 404
      throw err
    }

    const show = shows[showIndex]

    if (isShowExpired(show)) {
      const err = new Error(
        'This showtime has expired and is no longer available for booking',
      )
      err.status = 400
      throw err
    }

    // Validate movie if provided
    if (movieId && show.movieId !== movieId) {
      const err = new Error(`Show does not match the requested movie "${movieId}"`)
      err.status = 400
      throw err
    }

    const movie = await getMovieById(show.movieId)
    const resolvedMovieTitle = movieTitle || movie?.title || show.movieId

    // Validate theatre if provided
    if (theatreId && show.theatreId !== theatreId) {
      const err = new Error(`Show does not match the requested theatre "${theatreId}"`)
      err.status = 400
      throw err
    }

    const theatre = await getTheatreById(show.theatreId)

    // Validate seat format & limits
    const validation = validateSeatFormat(show, requestedSeats)
    if (!validation.valid) {
      const err = new Error(validation.error)
      err.status = 400
      throw err
    }

    // Check availability immediately before reserving
    const alreadyBooked = show.bookedSeats || []
    const conflicts = requestedSeats.filter((s) => alreadyBooked.includes(s))

    if (conflicts.length > 0) {
      const err = new Error(
        `Seat(s) ${conflicts.join(', ')} are already booked by another user. Please choose different seats.`,
      )
      err.status = 409
      err.conflicts = conflicts
      throw err
    }

    // Atomically reserve the seats
    show.bookedSeats = [...alreadyBooked, ...requestedSeats]
    shows[showIndex] = show
    writeFileJson(showsFilePath, shows)

    // Final price strictly calculated on the server
    const baseAmount = requestedSeats.length * show.price
    const convenienceFee = requestedSeats.length > 0 ? 30 : 0
    const totalAmount = baseAmount + convenienceFee

    const bookingId = `IMV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
    const booking = {
      id: bookingId,
      userId,
      movieId: show.movieId,
      movieTitle: resolvedMovieTitle,
      theatreId: show.theatreId,
      theatreName: theatre?.name || show.theatreId,
      showId: show.id,
      screen: show.screen,
      date: show.date,
      time: show.time,
      format: show.format,
      seats: requestedSeats,
      pricePerSeat: show.price,
      baseAmount,
      convenienceFee,
      amount: totalAmount,
      status: 'confirmed',
      paymentMethod, // 'demo_simulator'
      paymentStatus: 'paid_demo',
      bookedAt: new Date().toISOString(),
      cancelledAt: null,
    }

    const bookings = readFileJson(bookingsFilePath, [])
    bookings.push(booking)
    writeFileJson(bookingsFilePath, bookings)

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Booking.create(booking)
      } catch (mongoErr) {
        console.error('[Database] Failed to persist booking to MongoDB:', mongoErr.message)
      }
    }

    return { booking, show }
  } finally {
    release()
  }
}

export async function atomicCancelBooking({ bookingId, userId, isAdmin = false }) {
  const release = await bookingLock.lock()

  try {
    const bookings = readFileJson(bookingsFilePath, [])
    const bookingIndex = bookings.findIndex((b) => b.id === bookingId || b._id === bookingId)

    if (bookingIndex === -1) {
      const err = new Error(`Booking "${bookingId}" not found`)
      err.status = 404
      throw err
    }

    const booking = bookings[bookingIndex]

    // Verify ownership
    if (!isAdmin && booking.userId !== userId) {
      const err = new Error('Forbidden: You do not have permission to cancel this booking')
      err.status = 403
      throw err
    }

    // Verify not already cancelled
    if (booking.status === 'cancelled') {
      const err = new Error('This booking has already been cancelled')
      err.status = 400
      throw err
    }

    // Verify show existence & sensible cancellation rules (cannot cancel past/expired show)
    const shows = readFileJson(showsFilePath, defaultShows)
    const showIndex = shows.findIndex((s) => s.id === booking.showId)

    if (showIndex !== -1) {
      const show = shows[showIndex]
      if (isShowExpired(show)) {
        const err = new Error('Cannot cancel bookings for past or expired screenings')
        err.status = 400
        throw err
      }

      // Safely release the seats back to available pool
      const seatsToRelease = new Set(booking.seats || [])
      show.bookedSeats = (show.bookedSeats || []).filter((s) => !seatsToRelease.has(s))
      shows[showIndex] = show
      writeFileJson(showsFilePath, shows)
    }

    // Update booking status
    booking.status = 'cancelled'
    booking.cancelledAt = new Date().toISOString()
    bookings[bookingIndex] = booking
    writeFileJson(bookingsFilePath, bookings)

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Booking.findOneAndUpdate(
          { id: booking.id },
          { status: 'cancelled', cancelledAt: booking.cancelledAt }
        )
      } catch (mongoErr) {
        console.error('[Database] Failed to update booking cancellation in MongoDB:', mongoErr.message)
      }
    }

    return {
      booking,
      message: 'Booking cancelled successfully. Seats have been safely released.',
    }
  } finally {
    release()
  }
}

export async function getUserBookings(userId) {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const docs = await Booking.find({ userId }).sort({ bookedAt: -1 }).lean()
      if (docs && docs.length > 0) return docs
    } catch {}
  }
  const bookings = readFileJson(bookingsFilePath, [])
  return bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0))
}
