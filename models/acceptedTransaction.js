const mongoose = require('mongoose');
const acceptedTransactionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  plan: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  status: { type: String, required: true },
  transaction_date: { type: Date, required: true },
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
});

module.exports = mongoose.model('AcceptedTransaction', acceptedTransactionSchema);

