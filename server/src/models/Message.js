import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 }
}, { timestamps: true });
export default mongoose.model('Message', schema);
