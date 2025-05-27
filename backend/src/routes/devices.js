const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const deviceController = require('../controllers/deviceController');

// Validation middleware
const validateDeviceId = [
  param('deviceId').isMongoId().withMessage('Invalid device ID')
];

const validateDeviceUpdate = [
  body('deviceName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Device name must be 1-100 characters'),
  body('capacity').optional().isNumeric().isFloat({ min: 0 }).withMessage('Capacity must be positive'),
  body('location.address').optional().trim().isLength({ min: 1 }).withMessage('Address cannot be empty'),
];

const validateVerification = [
  body('isVerified').isBoolean().withMessage('isVerified must be boolean'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

// Routes
router.get('/:deviceId', validateDeviceId, deviceController.getDevice);
router.put('/:deviceId', validateDeviceId, validateDeviceUpdate, deviceController.updateDevice);
router.post('/:deviceId/documents', validateDeviceId, deviceController.uploadVerificationDocuments);
router.put('/:deviceId/verify', validateDeviceId, validateVerification, deviceController.verifyDevice);
router.delete('/:deviceId', validateDeviceId, deviceController.deleteDevice);
router.get('/:deviceId/statistics', validateDeviceId, deviceController.getDeviceStatistics);

module.exports = router;
