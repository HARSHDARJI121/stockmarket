const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Transaction Schema
const transactionSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  plan: {
    type: String,
    required: true,
    enum: ['standard', 'premium']
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'accepted', 'rejected']
  },
  transaction_date: {
    type: Date,
    default: Date.now
  },
  start_date: Date,
  end_date: Date
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt fields in MongoDB
  collection: 'transactions', // Specify the name of the collection
});

// Create the Transaction Model
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
