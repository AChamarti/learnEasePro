import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'instructor', 'student'], default: 'student' },
  bio: { type: String, default: '' },
  resetTokenHash: String,
  resetTokenExpires: Date
}, { timestamps: true });
export default mongoose.model('User', userSchema);
