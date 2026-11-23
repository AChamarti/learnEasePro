import jwt from 'jsonwebtoken';
export const makeToken = (user) => jwt.sign({ id: user._id, role: user.role, sid: process.env.SERVER_SESSION_ID }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
export const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });
