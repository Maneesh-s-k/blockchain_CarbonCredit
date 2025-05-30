const User = require('../models/User');
const PaymentMethod = require('../models/PaymentMethod');
const WalletTransaction = require('../models/WalletTransaction');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// Get wallet information
exports.getWalletInfo = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [user, paymentMethods, recentTransactions] = await Promise.all([
      User.findById(userId).select('wallet'),
      PaymentMethod.find({ user: userId, isActive: true }),
      WalletTransaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('paymentMethod', 'type card.last4 bankAccount.bankName')
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      wallet: {
        balance: user.wallet.balance,
        pendingBalance: user.wallet.pendingBalance,
        totalEarnings: user.wallet.totalEarnings,
        totalSpent: user.wallet.totalSpent,
        totalBalance: user.wallet.balance + user.wallet.pendingBalance
      },
      paymentMethods: paymentMethods.map(method => ({
        id: method._id,
        type: method.type,
        isDefault: method.isDefault,
        last4: method.type === 'card' ? method.card?.last4 : 
               method.type === 'bank' ? method.bankAccount?.accountNumber?.slice(-4) : null,
        brand: method.card?.brand,
        bankName: method.bankAccount?.bankName,
        expiryMonth: method.card?.expiryMonth,
        expiryYear: method.card?.expiryYear
      })),
      recentTransactions
    });

  } catch (error) {
    console.error('Get wallet info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching wallet information'
    });
  }
};

// Add payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const { type, cardData, bankData } = req.body;

    let paymentMethodData = {
      user: userId,
      type,
      metadata: {
        addedIP: req.ip,
        userAgent: req.get('User-Agent')
      }
    };

    // Check if this is the first payment method
    const existingMethods = await PaymentMethod.countDocuments({ 
      user: userId, 
      isActive: true 
    });
    
    if (existingMethods === 0) {
      paymentMethodData.isDefault = true;
    }

    if (type === 'card' && cardData) {
      // In production, you'd integrate with Stripe/other payment processor
      paymentMethodData.card = {
        last4: cardData.cardNumber.slice(-4),
        brand: detectCardBrand(cardData.cardNumber),
        expiryMonth: parseInt(cardData.expiryMonth),
        expiryYear: parseInt(cardData.expiryYear),
        holderName: cardData.holderName
      };
    } else if (type === 'bank' && bankData) {
      paymentMethodData.bankAccount = {
        accountNumber: bankData.accountNumber,
        routingNumber: bankData.routingNumber,
        accountType: bankData.accountType,
        bankName: bankData.bankName,
        holderName: bankData.holderName
      };
    }

    const paymentMethod = new PaymentMethod(paymentMethodData);
    await paymentMethod.save();

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethod: {
        id: paymentMethod._id,
        type: paymentMethod.type,
        last4: type === 'card' ? paymentMethod.card.last4 : 
               paymentMethod.bankAccount.accountNumber.slice(-4),
        isDefault: paymentMethod.isDefault
      }
    });

  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding payment method'
    });
  }
};

// Deposit funds
exports.depositFunds = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const { amount, paymentMethodId } = req.body;

    const depositAmount = parseFloat(amount);
    if (depositAmount < 1 || depositAmount > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount must be between $1 and $10,000'
      });
    }

    // Get user and payment method
    const [user, paymentMethod] = await Promise.all([
      User.findById(userId),
      PaymentMethod.findOne({
        _id: paymentMethodId,
        user: userId,
        isActive: true
      })
    ]);

    if (!user || !paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'User or payment method not found'
      });
    }

    // Calculate fees (2.9% + $0.30 for card transactions)
    const fees = paymentMethod.type === 'card' 
      ? (depositAmount * 0.029) + 0.30 
      : 0;
    
    const netAmount = depositAmount - fees;

    // Create wallet transaction
    const walletTransaction = new WalletTransaction({
      user: userId,
      type: 'deposit',
      amount: netAmount,
      status: 'processing',
      description: `Deposit via ${paymentMethod.type}`,
      paymentMethod: paymentMethodId,
      fees: {
        payment: fees,
        total: fees
      },
      balanceBefore: user.wallet.balance,
      balanceAfter: user.wallet.balance + netAmount,
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });

    await walletTransaction.save();

    // In production, process payment with payment gateway
    // For now, simulate successful payment
    setTimeout(async () => {
      try {
        await processDeposit(walletTransaction._id, userId, netAmount);
      } catch (error) {
        console.error('Deposit processing error:', error);
      }
    }, 2000);

    res.json({
      success: true,
      message: 'Deposit initiated successfully',
      transaction: {
        id: walletTransaction._id,
        amount: netAmount,
        fees: fees,
        status: 'processing'
      }
    });

  } catch (error) {
    console.error('Deposit funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing deposit'
    });
  }
};

// Withdraw funds
exports.withdrawFunds = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const { amount, paymentMethodId } = req.body;

    const withdrawAmount = parseFloat(amount);

    // Get user and payment method
    const [user, paymentMethod] = await Promise.all([
      User.findById(userId),
      PaymentMethod.findOne({
        _id: paymentMethodId,
        user: userId,
        isActive: true
      })
    ]);

    if (!user || !paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'User or payment method not found'
      });
    }

    // Check sufficient balance
    if (withdrawAmount > user.wallet.balance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        available: user.wallet.balance,
        requested: withdrawAmount
      });
    }

    // Minimum withdrawal check
    if (withdrawAmount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is $10'
      });
    }

    // Calculate fees
    const fees = 2.50; // Fixed withdrawal fee
    const netAmount = withdrawAmount - fees;

    // Create wallet transaction
    const walletTransaction = new WalletTransaction({
      user: userId,
      type: 'withdrawal',
      amount: withdrawAmount,
      status: 'processing',
      description: `Withdrawal to ${paymentMethod.type}`,
      paymentMethod: paymentMethodId,
      fees: {
        platform: fees,
        total: fees
      },
      balanceBefore: user.wallet.balance,
      balanceAfter: user.wallet.balance - withdrawAmount,
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });

    await walletTransaction.save();

    // Update user balance immediately for withdrawal
    user.wallet.balance -= withdrawAmount;
    await user.save();

    // Process withdrawal (simulate)
    setTimeout(async () => {
      try {
        await processWithdrawal(walletTransaction._id);
      } catch (error) {
        console.error('Withdrawal processing error:', error);
      }
    }, 3000);

    res.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      transaction: {
        id: walletTransaction._id,
        amount: withdrawAmount,
        netAmount: netAmount,
        fees: fees,
        status: 'processing'
      }
    });

  } catch (error) {
    console.error('Withdraw funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing withdrawal'
    });
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      type, 
      status, 
      page = 1, 
      limit = 20,
      startDate,
      endDate
    } = req.query;

    const filters = { user: userId };
    
    if (type) filters.type = type;
    if (status) filters.status = status;
    
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filters)
        .populate('paymentMethod', 'type card.last4 bankAccount.bankName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WalletTransaction.countDocuments(filters)
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching transaction history'
    });
  }
};

// Helper functions
async function processDeposit(transactionId, userId, amount) {
  try {
    const [transaction, user] = await Promise.all([
      WalletTransaction.findById(transactionId),
      User.findById(userId)
    ]);

    if (transaction && user) {
      // Update transaction status
      transaction.status = 'completed';
      await transaction.save();

      // Update user wallet
      user.wallet.balance += amount;
      user.wallet.totalEarnings += amount;
      await user.save();

      console.log(`Deposit completed: $${amount} for user ${userId}`);
    }
  } catch (error) {
    console.error('Process deposit error:', error);
  }
}

async function processWithdrawal(transactionId) {
  try {
    const transaction = await WalletTransaction.findById(transactionId);
    
    if (transaction) {
      // Simulate processing time and update status
      transaction.status = 'completed';
      await transaction.save();

      console.log(`Withdrawal completed: $${transaction.amount} for user ${transaction.user}`);
    }
  } catch (error) {
    console.error('Process withdrawal error:', error);
  }
}

function detectCardBrand(cardNumber) {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6/.test(number)) return 'discover';
  
  return 'unknown';
}

module.exports = {
  getWalletInfo: exports.getWalletInfo,
  addPaymentMethod: exports.addPaymentMethod,
  depositFunds: exports.depositFunds,
  withdrawFunds: exports.withdrawFunds,
  getTransactionHistory: exports.getTransactionHistory
};
