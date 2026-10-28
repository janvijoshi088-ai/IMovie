import mongoose from 'mongoose'

const showSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    movieId: { type: String, required: true, index: true },
    theatreId: { type: String, required: true, index: true },
    screen: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // e.g. 10:30 AM
    price: { type: Number, required: true },
    format: { type: String, default: '2D' },
    language: { type: String, default: 'English' },
    seatRows: {
      type: [String],
      default: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    },
    seatsPerRow: { type: Number, default: 12 },
    bookedSeats: { type: [String], default: [] },
    maxSeatsPerBooking: { type: Number, default: 6 },
    status: { type: String, enum: ['scheduled', 'cancelled', 'expired'], default: 'scheduled' },
  },
  { timestamps: true },
)

const Show = mongoose.models.Show || mongoose.model('Show', showSchema)

export default Show
