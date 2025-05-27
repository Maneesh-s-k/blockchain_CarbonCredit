const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const energyController = require('../controllers/energyController');

// Validation middleware
const validateDeviceRegistration = [
  body('deviceName').trim().isLength({ min: 1, max: 100 }).withMessage('Device name is required'),
  body('deviceType').isIn(['solar', 'wind', 'hydro', 'battery', 'other']).withMessage('Invalid device type'),
  body('capacity').isNumeric().isFloat({ min: 0 }).withMessage('Capacity must be a positive number'),
  body('serialNumber').trim().isLength({ min: 1 }).withMessage('Serial number is required'),
];

const validateEnergySubmission = [
  body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('timestamp').optional().isISO8601().withMessage('Invalid timestamp format'),
];

// Routes
router.post('/devices/register', validateDeviceRegistration, energyController.registerDevice);
router.post('/devices/:deviceId/production', validateEnergySubmission, energyController.submitEnergyProduction);
router.get('/devices/:deviceId', energyController.getDeviceEnergyData);
router.get('/devices', energyController.getAllDevices);

module.exports = router;
