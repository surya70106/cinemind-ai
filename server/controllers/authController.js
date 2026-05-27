import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function formatUser(user) {
  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      supabaseUserId: crypto.randomUUID(),
    });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: formatUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: formatUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: { user: formatUser(user) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
