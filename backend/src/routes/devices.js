const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const deviceController = require('../controllers/deviceController');

// Validation middleware
const validateDeviceRegistration = [
  body('deviceName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Device name must be between 1 and 100 characters'),
  body('deviceType')
    .isIn(['solar', 'wind', 'hydro', 'geothermal', 'biomass'])
    .withMessage('Invalid device type'),
  body('capacity')
    .isFloat({ min: 0.1, max: 10000 })
    .withMessage('Capacity must be between 0.1 and 10,000 kW'),
  body('location')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Location must be between 1 and 200 characters')
];

const validateDeviceUpdate = [
  body('deviceName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Device name must be 1-100 characters'),
  body('capacity').optional().isNumeric().isFloat({ min: 0 }).withMessage('Capacity must be positive'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Device routes - using the correct function names from your controller
router.post('/register', validateDeviceRegistration, deviceController.registerDevice);
router.get('/', validatePagination, deviceController.getUserDevices);
router.get('/available', validatePagination, deviceController.getAvailableDevices);
router.get('/:deviceId', param('deviceId').isMongoId(), deviceController.getDeviceById);
router.put('/:deviceId', [param('deviceId').isMongoId(), ...validateDeviceUpdate], deviceController.updateDevice);
router.delete('/:deviceId', param('deviceId').isMongoId(), deviceController.deleteDevice);
router.post('/:deviceId/energy', param('deviceId').isMongoId(), deviceController.updateEnergyProduction);
router.post('/:deviceId/maintenance', param('deviceId').isMongoId(), deviceController.addMaintenanceRecord);
router.get('/:deviceId/analytics', param('deviceId').isMongoId(), deviceController.getDeviceAnalytics);

module.exports = router;
