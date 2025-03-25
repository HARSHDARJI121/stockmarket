const mongoose = require('mongoose');

// MongoDB Models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, default: 'basic' }
});

const transactionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  plan: { type: String, required: true },
  amount: { type: String, required: true },
  status: { type: String, required: true },
  transaction_date: { type: Date, required: true },
  end_date: { type: Date },
});

const acceptedTransactionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  amount: { type: String, required: true },
  plan: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  status: { type: String, required: true },
  transaction_date: { type: Date, required: true },
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
});

// Create Mongoose models only if they don't exist
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const AcceptedTransaction = mongoose.models.AcceptedTransaction || mongoose.model('AcceptedTransaction', acceptedTransactionSchema);

module.exports = {
  User,
  Transaction,
  AcceptedTransaction
}; 