export const SAMPLE_NOTICE =
  'This screen uses sample data for the college demo. Nothing is saved to a database yet.'

export const genres = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Drama',
  'Sci-Fi',
  'Thriller',
]

export const languages = ['English', 'Hindi', 'Telugu']

export const movies = [
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

export const theatres = [
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

export const showtimes = [
  {
    id: 'show-opp-1',
    movieId: 'oppenheimer',
    theatreId: 'pvr-phoenix',
    screen: 'IMAX',
    date: '2026-10-26',
    time: '10:30 AM',
    price: 320,
    format: 'IMAX',
    language: 'English',
    bookedSeats: ['A4', 'A5', 'C8', 'D1', 'D2', 'F10'],
  },
  {
    id: 'show-opp-2',
    movieId: 'oppenheimer',
    theatreId: 'inox-city',
    screen: 'Screen 2',
    date: '2026-10-26',
    time: '6:45 PM',
    price: 220,
    format: '2D',
    language: 'English',
    bookedSeats: ['B3', 'B4', 'E6'],
  },
  {
    id: 'show-int-1',
    movieId: 'interstellar',
    theatreId: 'pvr-phoenix',
    screen: 'IMAX',
    date: '2026-10-26',
    time: '2:00 PM',
    price: 340,
    format: 'IMAX',
    language: 'English',
    bookedSeats: ['A1', 'A2', 'A3', 'C5', 'G7'],
  },
  {
    id: 'show-int-2',
    movieId: 'interstellar',
    theatreId: 'cinepolis-downtown',
    screen: 'Audi 1',
    date: '2026-10-27',
    time: '9:15 PM',
    price: 250,
    format: '2D',
    language: 'English',
    bookedSeats: ['D8', 'D9', 'H1'],
  },
  {
    id: 'show-jawan-1',
    movieId: 'jawan',
    theatreId: 'inox-city',
    screen: 'Screen 4',
    date: '2026-10-26',
    time: '4:30 PM',
    price: 180,
    format: '2D',
    language: 'Hindi',
    bookedSeats: ['C2', 'C3', 'C4', 'F5'],
  },
  {
    id: 'show-jawan-2',
    movieId: 'jawan',
    theatreId: 'pvr-phoenix',
    screen: 'Screen 1',
    date: '2026-10-27',
    time: '8:00 PM',
    price: 210,
    format: '2D',
    language: 'Hindi',
    bookedSeats: ['B10', 'B11'],
  },
  {
    id: 'show-dune-1',
    movieId: 'dune-part-two',
    theatreId: 'pvr-phoenix',
    screen: 'IMAX',
    date: '2026-10-27',
    time: '11:00 AM',
    price: 360,
    format: 'IMAX',
    language: 'English',
    bookedSeats: ['E4', 'E5', 'E6', 'A12'],
  },
  {
    id: 'show-dune-2',
    movieId: 'dune-part-two',
    theatreId: 'cinepolis-downtown',
    screen: 'Audi 2',
    date: '2026-10-26',
    time: '7:20 PM',
    price: 240,
    format: '2D',
    language: 'English',
    bookedSeats: ['G3', 'G4'],
  },
  {
    id: 'show-rrr-1',
    movieId: 'rrr',
    theatreId: 'inox-city',
    screen: 'Screen 2',
    date: '2026-10-28',
    time: '1:15 PM',
    price: 190,
    format: '2D',
    language: 'Telugu',
    bookedSeats: ['A6', 'B6', 'C6'],
  },
  {
    id: 'show-kalki-1',
    movieId: 'kalki',
    theatreId: 'pvr-phoenix',
    screen: 'Screen 3',
    date: '2026-10-27',
    time: '5:00 PM',
    price: 230,
    format: '2D',
    language: 'Telugu',
    bookedSeats: ['H8', 'H9', 'H10', 'D4'],
  },
  {
    id: 'show-inside-1',
    movieId: 'inside-out-2',
    theatreId: 'cinepolis-downtown',
    screen: 'Audi 1',
    date: '2026-10-26',
    time: '12:10 PM',
    price: 160,
    format: '2D',
    language: 'English',
    bookedSeats: ['A8', 'A9', 'B8', 'B9'],
  },
  {
    id: 'show-pathaan-1',
    movieId: 'pathaan',
    theatreId: 'inox-city',
    screen: 'Screen 4',
    date: '2026-10-28',
    time: '9:45 PM',
    price: 200,
    format: '2D',
    language: 'Hindi',
    bookedSeats: ['C10', 'C11', 'F2'],
  },
  {
    id: 'show-dk-1',
    movieId: 'dark-knight',
    theatreId: 'pvr-phoenix',
    screen: 'Screen 1',
    date: '2026-10-28',
    time: '3:40 PM',
    price: 210,
    format: '2D',
    language: 'English',
    bookedSeats: ['B1', 'B2', 'E11'],
  },
  {
    id: 'show-inc-1',
    movieId: 'inception',
    theatreId: 'cinepolis-downtown',
    screen: 'Audi 2',
    date: '2026-10-27',
    time: '6:00 PM',
    price: 220,
    format: '2D',
    language: 'English',
    bookedSeats: ['D5', 'D6', 'D7', 'G12'],
  },
  {
    id: 'show-12-1',
    movieId: '12th-fail',
    theatreId: 'inox-city',
    screen: 'Screen 2',
    date: '2026-10-26',
    time: '11:20 AM',
    price: 150,
    format: '2D',
    language: 'Hindi',
    bookedSeats: ['F7', 'F8'],
  },
  {
    id: 'show-sv-1',
    movieId: 'spider-verse',
    theatreId: 'pvr-phoenix',
    screen: 'Screen 3',
    date: '2026-10-28',
    time: '10:00 AM',
    price: 200,
    format: '2D',
    language: 'English',
    bookedSeats: ['A10', 'A11', 'C1'],
  },
]

export const sampleBookings = [
  {
    id: 'DEMO-4821',
    movieId: 'interstellar',
    theatreId: 'pvr-phoenix',
    showId: 'show-int-1',
    seats: ['C2', 'C3'],
    amount: 680,
    status: 'Sample / not stored',
    bookedOn: '2026-10-20',
  },
  {
    id: 'DEMO-1094',
    movieId: 'jawan',
    theatreId: 'inox-city',
    showId: 'show-jawan-1',
    seats: ['D6'],
    amount: 180,
    status: 'Sample / not stored',
    bookedOn: '2026-10-18',
  },
]

export const seatRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
export const seatsPerRow = 12

export function getMovieById(id) {
  return movies.find((movie) => movie.id === id)
}

export function getTheatreById(id) {
  return theatres.find((theatre) => theatre.id === id)
}

export function getShowById(id) {
  return showtimes.find((show) => show.id === id)
}

export function getShowtimesForMovie(movieId) {
  return showtimes.filter((show) => show.movieId === movieId)
}

export function filterMovies({ query = '', genre = 'all', language = 'all' }) {
  const term = query.trim().toLowerCase()

  return movies.filter((movie) => {
    const matchesQuery =
      term.length === 0 ||
      movie.title.toLowerCase().includes(term) ||
      movie.director.toLowerCase().includes(term) ||
      movie.cast.some((name) => name.toLowerCase().includes(term))
    const matchesGenre = genre === 'all' || movie.genres.includes(genre)
    const matchesLanguage = language === 'all' || movie.language === language
    return matchesQuery && matchesGenre && matchesLanguage
  })
}

export function formatShowDate(date) {
  if (!date) return 'Upcoming'
  try {
    const dStr = typeof date === 'string' && date.includes('T') ? date : `${date}T12:00:00`
    const d = new Date(dStr)
    if (isNaN(d.getTime())) return String(date)
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return String(date || 'Upcoming')
  }
}
