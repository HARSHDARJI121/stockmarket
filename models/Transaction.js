const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    plan: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt` fields
);

module.exports = mongoose.model('Transaction', transactionSchema);