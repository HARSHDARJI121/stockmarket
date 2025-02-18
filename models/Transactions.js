const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Path to your database configuration

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,  // Make sure the field is required
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,  // Make sure the field is required
    },
    plan: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER, // Assuming user_id is related to the user model
        allowNull: true, // Or `false` if it's required
    },
}, {
    timestamps: true,  // This will automatically create `createdAt` and `updatedAt` columns
    tableName: 'Transactions',
});

module.exports = Transaction;
