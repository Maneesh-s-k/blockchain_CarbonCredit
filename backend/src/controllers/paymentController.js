const User = require('../models/User');
const PaymentMethod = require('../models/PaymentMethod');
const WalletTransaction = require('../models/WalletTransaction');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// ADD THIS MISSING FUNCTION - Get payment methods only
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const paymentMethods = await PaymentMethod.find({ 
      user: userId, 
      isActive: true 
    });

    // Transform the data to match what your frontend expects
    const formattedMethods = paymentMethods.map(method => ({
      id: method._id,
      type: method.type,
      isDefault: method.isDefault,
      // Card details
      ...(method.type === 'card' && method.card && {
        card: {
          last4: method.card.last4,
          brand: method.card.brand,
          holderName: method.card.holderName
        }
      }),
      // Bank details  
      ...(method.type === 'bank' && method.bankAccount && {
        bankAccount: {
          last4: method.bankAccount.accountNumber?.slice(-4),
          bankName: method.bankAccount.bankName,
          holderName: method.bankAccount.holderName
        }
      })
    }));

    res.json({
      success: true,
      paymentMethods: formattedMethods
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payment methods'
    });
  }
};

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
        balance: {
          available: user.wallet?.balance || 0,
          pending: user.wallet?.pendingBalance || 0,
          total: (user.wallet?.balance || 0) + (user.wallet?.pendingBalance || 0)
        }
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

// Rest of your existing functions remain the same...
// (depositFunds, withdrawFunds, getTransactionHistory)

// Keep all your existing functions exactly as they are
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
      balanceBefore: user.wallet?.balance || 0,
      balanceAfter: (user.wallet?.balance || 0) + netAmount,
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

// Keep all other existing functions...
exports.withdrawFunds = async (req, res) => {
  // Your existing withdrawFunds code
};

exports.getTransactionHistory = async (req, res) => {
  // Your existing getTransactionHistory code  
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
      if (!user.wallet) {
        user.wallet = { balance: 0, pendingBalance: 0, totalEarnings: 0, totalSpent: 0 };
      }
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
  getPaymentMethods: exports.getPaymentMethods, // ADD THIS LINE
  addPaymentMethod: exports.addPaymentMethod,
  depositFunds: exports.depositFunds,
  withdrawFunds: exports.withdrawFunds,
  getTransactionHistory: exports.getTransactionHistory
};
