import mongoose from 'mongoose';
const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  videoUrl: String,
  durationMinutes: { type: Number, default: 0 },
  order: { type: Number, default: 0 }
});
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, subtitle: String, description: { type: String, required: true },
  category: { type: String, required: true }, level: { type: String, enum: ['Beginner','Intermediate','Advanced'], default: 'Beginner' },
  price: { type: Number, default: 0, min: 0 }, thumbnailUrl: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessons: [lessonSchema], published: { type: Boolean, default: false }
}, { timestamps: true });
export default mongoose.model('Course', courseSchema);
