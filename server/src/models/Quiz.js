import mongoose from 'mongoose';
const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true, trim: true },
  options: { type: [String], validate: v => v.length >= 2 },
  correctIndex: { type: Number, required: true, min: 0 },
  explanation: String
});
const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: String,
  passMark: { type: Number, default: 60, min: 0, max: 100 },
  questions: { type: [questionSchema], validate: v => v.length > 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
export default mongoose.model('Quiz', quizSchema);
