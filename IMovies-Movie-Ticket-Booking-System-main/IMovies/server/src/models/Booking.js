import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    movieId: { type: String, required: true },
    movieTitle: { type: String, required: true },
    theatreId: { type: String, required: true },
    theatreName: { type: String, required: true },
    showId: { type: String, required: true, index: true },
    screen: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    format: { type: String, default: '2D' },
    seats: [{ type: String, required: true }],
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    paymentMethod: {
      type: String,
      default: 'demo_simulator',
    },
    paymentStatus: {
      type: String,
      default: 'paid_demo',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema)

export default Booking
