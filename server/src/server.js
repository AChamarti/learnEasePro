import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Enrollment from './models/Enrollment.js';
import Message from './models/Message.js';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import learningRoutes from './routes/learning.js';
import adminRoutes from './routes/admin.js';
import discussionRoutes from './routes/discussions.js';
import quizRoutes from './routes/quizzes.js';
import uploadRoutes from './routes/uploads.js';

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(value => value.trim()).filter(Boolean);
const originAllowed = origin => !origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (origin, callback) => callback(null, originAllowed(origin)), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (error) {
    console.error('Database connection failed', error);
    res.status(503).json({ message: 'Database temporarily unavailable' });
  }
});

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'LearnEase Pro' }));
app.use('/api/courses', courseRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/uploads', uploadRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.name === 'ValidationError' || err.name === 'MulterError' ? 400 : (err.status || 500);
  res.status(status).json({ message: status === 400 ? err.message : (status === 404 ? 'Not found' : 'Server error') });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: (origin, callback) => callback(null, originAllowed(origin)), methods: ['GET', 'POST'] }
});
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch { next(new Error('Invalid or expired token')); }
});

async function canJoin(courseId, user) {
  if (user.role === 'admin') return true;
  const course = await Course.findById(courseId);
  if (!course) return false;
  if (user.role === 'instructor' && course.instructor.equals(user._id)) return true;
  return !!await Enrollment.exists({ course: courseId, student: user._id, status: 'approved' });
}

io.on('connection', socket => {
  socket.on('course:join', async (courseId, ack) => {
    try {
      if (!await canJoin(courseId, socket.user)) return ack?.({ error: 'Approved course access required' });
      socket.join(`course:${courseId}`);
      ack?.({ ok: true });
    } catch { ack?.({ error: 'Unable to join course chat' }); }
  });
  socket.on('course:message', async ({ courseId, body }, ack) => {
    try {
      const text = String(body || '').trim();
      if (!text || text.length > 2000) return ack?.({ error: 'Message must be between 1 and 2000 characters' });
      if (!await canJoin(courseId, socket.user)) return ack?.({ error: 'Course access required' });
      const message = await Message.create({ course: courseId, sender: socket.user._id, body: text });
      const populated = await message.populate('sender', 'name role');
      io.to(`course:${courseId}`).emit('course:message', populated);
      ack?.({ ok: true });
    } catch { ack?.({ error: 'Unable to send message' }); }
  });
});

export default server;

// Local development starts the listener; Vercel imports the exported HTTP server.
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`API and Socket.IO listening on ${port}`));
}
