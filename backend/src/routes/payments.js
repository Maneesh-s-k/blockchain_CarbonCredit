const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const paymentController = require('../controllers/paymentController');

// Validation middleware
const validatePayment = [
  body('transactionId').isMongoId().withMessage('Invalid transaction ID'),
  body('paymentMethod').isIn(['wallet', 'bank_transfer', 'crypto', 'credit_card']).withMessage('Invalid payment method'),
  body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
];

const validatePaymentId = [
  param('paymentId').isMongoId().withMessage('Invalid payment ID')
];

// Routes
router.post('/process', validatePayment, paymentController.processPayment);
router.get('/history/:userId?', paymentController.getPaymentHistory);
router.get('/:paymentId', validatePaymentId, paymentController.getPayment);

module.exports = router;
