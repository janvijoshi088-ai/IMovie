import mongoose from 'mongoose'

const theatreSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    screens: [{ type: String }],
    amenities: [{ type: String }],
    seatingCapacity: { type: Number, default: 96 },
  },
  { timestamps: true },
)

const Theatre = mongoose.models.Theatre || mongoose.model('Theatre', theatreSchema)

export default Theatre
