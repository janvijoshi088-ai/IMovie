import mongoose from 'mongoose'

const movieSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    rating: {
      type: Number,
      default: 7.5,
      min: 0,
      max: 10,
    },
    duration: {
      type: String,
      default: '2h 00m',
    },
    genres: {
      type: [String],
      default: ['Action'],
    },
    language: {
      type: String,
      default: 'English',
    },
    certificate: {
      type: String,
      default: 'UA',
    },
    director: {
      type: String,
      default: 'Director',
    },
    cast: {
      type: [String],
      default: [],
    },
    synopsis: {
      type: String,
      default: '',
    },
    poster: {
      type: String,
      default: '',
    },
    backdrop: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema)

export default Movie
