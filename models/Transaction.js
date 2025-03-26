// transaction.js (Mongoose Model)

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the transaction schema
const transactionSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    plan: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'], // Enum for valid statuses
        default: 'pending'
    },
    transaction_date: { // Renamed from createdAt to transaction_date
        type: Date,
        default: Date.now // Automatically sets the date when the document is created
    },
    endDate: {
        type: Date,
        default: null
    }
});

// Create the model from the schema
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
