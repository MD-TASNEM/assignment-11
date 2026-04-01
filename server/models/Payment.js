const Payment = {
  _id: String, // MongoDB ObjectId
  userId: String, // Firebase UID
  stripeSessionId: String,
  stripeCustomerId: String,
  amount: Number, // in cents: 1500 BDT = 150000 cents
  currency: String, // "bdt" or "usd"
  status: String, // "pending", "completed", "canceled", "failed"
  planType: String, // "premium"
  createdAt: Date,
  completedAt: Date,
};

module.exports = Payment;
