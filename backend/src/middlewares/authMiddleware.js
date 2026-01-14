import jwt from 'jsonwebtoken'
import { getUserById } from '../models/User.js';

import dotenv from 'dotenv'
dotenv.config();

export const protectedRoute = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token not found' })
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token expired' });
        }
        console.error(err);
        return res.status(403).json({ message: 'Access token invalid' });
      }

      const user = await getUserById(decodedUser.userID);

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }
      delete user.password;

      req.user = user;
      next();
    })

    
  } catch (error) {
    console.error('Fail in JWT verification in authMiddleware', error);
    return res.status(500).json({ message: 'System failed'});
  }
}