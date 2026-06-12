const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const Clinic = require('../models/Clinic');
const UserRegistry = require('../models/UserRegistry');
const { getClinicConnection, getClinicUserModel } = require('../db/connectionManager');
const { validate } = require('../middleware/validate');

const router = express.Router();

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/login', loginValidation, validate, async (req, res) => {
  try {
    const { username, password } = req.body;

    const registryEntry = await UserRegistry.findOne({ username: username.toLowerCase() });
    if (!registryEntry) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const clinic = await Clinic.findOne({ clinicId: registryEntry.clinicId });
    if (!clinic || !clinic.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Clinic account is inactive. Contact support.',
      });
    }

    const clinicConn = await getClinicConnection(clinic.clinicId, clinic.dbName);
    const User = getClinicUserModel(clinicConn);

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        clinicId: clinic.clinicId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          clinicName: clinic.name,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/clinics', async (req, res) => {
  try {
    const clinics = await Clinic.find({}).select('name clinicId').sort({ name: 1 }).lean();
    res.json({ success: true, data: { clinics } });
  } catch (error) {
    console.error('Get clinics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clinics' });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const clinic = await Clinic.findOne({ clinicId: decoded.clinicId });
    if (!clinic) {
      return res.status(401).json({ success: false, message: 'Clinic not found' });
    }

    const clinicConn = await getClinicConnection(decoded.clinicId, clinic.dbName);
    const User = getClinicUserModel(clinicConn);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          clinicId: decoded.clinicId,
          clinicName: clinic.name,
        },
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
