// In server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export default function (req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1]; // Expects "Bearer [token]"

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);// Add a JWT_SECRET to your .env file
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};