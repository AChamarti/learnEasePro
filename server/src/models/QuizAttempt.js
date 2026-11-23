import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ type: Number }], score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });
schema.index({ quiz: 1, student: 1 });
export default mongoose.model('QuizAttempt', schema);
