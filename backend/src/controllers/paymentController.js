// Placeholder payment controller
exports.processPayment = (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
};

exports.getPaymentHistory = (req, res) => {
  res.status(200).json({ 
    success: true, 
    payments: [], 
    pagination: { page: 1, total: 0 } 
  });
};

exports.getPayment = (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet" });
};
