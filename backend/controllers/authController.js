const User = require('../models/User');
const Student = require('../models/Student');
const { generateToken } = require('../middleware/auth');

// In-memory store for tracking login attempts
// Format: { email: { attempts: number, lockUntil: Date | null } }
const loginAttempts = new Map();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 60; // seconds

// Clean up old entries periodically
setInterval(() => {
  const now = new Date();
  for (const [email, data] of loginAttempts.entries()) {
    if (data.lockUntil && data.lockUntil < now) {
      loginAttempts.delete(email);
    }
  }
}, 60000); // Check every minute

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { username, email, password, fullName, studentId, department } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Force role to 'student' - only students can register
      const role = 'student';

      // Create user
      const userResult = await User.create(username, email, password, role);
      const userId = userResult.insertId;

      // If student, create student profile
      if (role === 'student' || !role) {
        await Student.create(userId, fullName, studentId, department);
      }

      const user = await User.findById(userId);
      const token = generateToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Check if user is currently locked out
      const attemptData = loginAttempts.get(email);
      const now = new Date();
      
      if (attemptData && attemptData.lockUntil && attemptData.lockUntil > now) {
        const remainingSeconds = Math.ceil((attemptData.lockUntil - now) / 1000);
        return res.status(429).json({ 
          message: `Too many failed attempts. Please try again in ${remainingSeconds} seconds.`,
          locked: true,
          remainingSeconds
        });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        // Increment failed attempts
        const currentAttempts = loginAttempts.get(email) || { attempts: 0, lockUntil: null };
        currentAttempts.attempts += 1;
        
        if (currentAttempts.attempts >= MAX_ATTEMPTS) {
          // Lock the account
          currentAttempts.lockUntil = new Date(now.getTime() + LOCKOUT_DURATION * 1000);
          loginAttempts.set(email, currentAttempts);
          return res.status(429).json({ 
            message: `Too many failed attempts. Please try again in ${LOCKOUT_DURATION} seconds.`,
            locked: true,
            remainingSeconds: LOCKOUT_DURATION
          });
        }
        
        loginAttempts.set(email, currentAttempts);
        const remainingAttempts = MAX_ATTEMPTS - currentAttempts.attempts;
        return res.status(400).json({ 
          message: `Invalid credentials. ${remainingAttempts} attempt(s) remaining.`
        });
      }

      // Successful login - reset attempts
      loginAttempts.delete(email);

      const token = generateToken(user);
      
      // Get student profile if user is a student
      let studentProfile = null;
      if (user.role === 'student') {
        studentProfile = await Student.findByUserId(user.id);
      }

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        studentProfile
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  },

  // Get current user
  async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let studentProfile = null;
      if (user.role === 'student') {
        studentProfile = await Student.findByUserId(user.id);
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        studentProfile
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = authController;
