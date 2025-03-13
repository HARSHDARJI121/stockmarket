const db = require('../config/db'); // Ensure correct DB connection

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

        // Format date for MySQL (YYYY-MM-DD)
        const formattedEndDate = endDate.toISOString().split('T')[0];

        // Insert into database
        const query = `INSERT INTO transactions (email, name, plan, amount, status, createdAt, end_date) VALUES (?, ?, ?, ?, ?, NOW(), ?)`;
        await db.execute(query, [email, name, plan, amount, status, formattedEndDate]);

        res.status(201).json({ message: 'Transaction added successfully!', end_date: formattedEndDate });
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { addTransaction };
