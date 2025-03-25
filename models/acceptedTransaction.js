const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the AcceptedTransaction Schema
const acceptedTransactionSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    plan: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'accepted',
        required: true,
    },
    transaction_date: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true, // Automatically add `createdAt` and `updatedAt`
    collection: 'AcceptedTransactions', // Specify the collection name
});

// Create the AcceptedTransaction Model
const AcceptedTransaction = mongoose.model('AcceptedTransaction', acceptedTransactionSchema);

// Define another model for AcceptedTransactions (if required, can be similar)
const acceptedTransactionsSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    plan: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    start_date: {
        type: Date,
        required: true,
    },
    end_date: {
        type: Date,
        required: true,
    },
}, {
    collection: 'AcceptedTransactions', // Ensure this matches the collection name
    timestamps: false, // Disable timestamps if you don't want `createdAt` and `updatedAt`
});

// Create the AcceptedTransactions Model
const AcceptedTransactions = mongoose.model('AcceptedTransactions', acceptedTransactionsSchema);

module.exports = { AcceptedTransaction, AcceptedTransactions };
