import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.sid !== process.env.SERVER_SESSION_ID) return res.status(401).json({ message: 'Your session ended because the server restarted. Please log in again.' });
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User no longer exists' });
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' });
  }
}
export const allow = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission' });
