import bcrypt from 'bcrypt'
import { getUserByUsername, createUser } from '../models/User.js'
import { createSession, deleteSessionByToken } from '../models/Session.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

import dotenv from 'dotenv'
dotenv.config();

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;
// const REFRESH_TOKEN_TTL = 100;

export const signUp = async (req, res) => {
  try {
    const {username, password, email, firstName, lastName, exp, role} = req.body;
    
    if (
      username == null || password == null || email == null ||
      firstName == null || lastName == null || exp == null || role == null
    ) {
      return res.status(400).json({message: "Missing sign up information!"})
    }

    const duplicate = await getUserByUsername(username)

    if (duplicate) {
      return res.status(400).json({message: "Username is taken!"})
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await createUser(username, hashedPassword, email, firstName, lastName, exp, role);

    return res.sendStatus(204);

  } catch (error) {
    console.error('Fail in sign up!', error);
    return res.status(500).json({message: 'System failed'});
  }
}

export const signIn = async (req, res) => {
  try {
    const {username, password} = req.body;

    if (!process.env.ACCESS_TOKEN_SECRET) {
      return res.status(500).json({ message: 'Missing ACCESS_TOKEN_SECRET' })
    }

    if (username == null || password == null) {
      return res.status(400).json({message: "Missing username or password!"})
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({message: "Username or Password is incorrect!"})
    }
    
    console.log('Login user:', user);

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({message: "Username or Password is incorrect!"})
    }

    const accessToken = jwt.sign(
      { userID: user.user_id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    )

    const refreshToken = crypto.randomBytes(64).toString('hex')
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL)

    await createSession(user.user_id, refreshToken, expiresAt)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // local dev có thể đặt false
      sameSite: 'none',
      maxAge: REFRESH_TOKEN_TTL
    })

    return res.status(200).json({
      message: "Signed in",
      token: accessToken,
      username: user.username,
      role: user.role,
      warehouseId: user.warehouse_id
    });
  } catch (error) {
    console.error('Fail in sign in!', error);
    return res.status(500).json({message: 'System failed'});
  }
}

export const signOut = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await deleteSessionByToken(token);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Fail in sign out!', error);
    return res.status(500).json({message: 'System failed'});
  }
}
