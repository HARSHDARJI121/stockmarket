const Transaction = require('../models/Transaction.js'); // Ensure correct path to model

const addTransaction = async (req, res) => {
    try {
        const { email, name, plan, amount, status } = req.body;

        // Get current date
        const currentDate = new Date();

        // Determine duration based on amount
        let daysToAdd = 0;
        if (amount == 1251) {
            daysToAdd = 30;
        } else if (amount == 3200) {
            daysToAdd = 90;
        }

        // Calculate end_date
        const endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() + daysToAdd);

        // Insert into database
        const transaction = new Transaction({
            email,
            name,
            plan,
            amount,
            status,
            end_date: endDate
        });

        await transaction.save();

        res.status(201).json({ message: 'Transaction added successfully!', end_date: endDate });
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { addTransaction };
