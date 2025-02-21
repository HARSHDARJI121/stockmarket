const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('stocktrade', 'root', 'Harsh@5489', {
    host: 'localhost',
    dialect: 'mysql',
});

// Define AcceptedTransaction model
const AcceptedTransaction = sequelize.define('AcceptedTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
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
        defaultValue: 'accepted',
    },
    transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: 'AcceptedTransactions',
});

sequelize.sync();

module.exports = AcceptedTransaction;
