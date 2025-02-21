const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('mysql://root:Harsh@5489@localhost:3306/stocktrade'); // Your DB connection string

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true // Allows NULL since it has a default value
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true // Allows NULL since it has a default value
  },
  plan: {
    type: DataTypes.STRING(50),
    allowNull: false // Plan is required
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false // Amount is required
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending', // Default value is 'pending'
    allowNull: false // Status is required
  },
  transaction_date: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW, // Current timestamp by default
    allowNull: false // This field is automatically set, so it's required
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW, // Automatically set at creation
    allowNull: false // This field is automatically set, so it's required
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW, // Automatically updated on modification
    allowNull: false // This field is automatically updated, so it's required
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Foreign key should not be null
    references: {
      model: 'users', // The name of the referenced model
      key: 'id' // The field in the users table that it references
    },
    onDelete: 'CASCADE' // Deletes associated transactions if the user is deleted
  }
}, {
  timestamps: true, // Ensures that Sequelize automatically adds createdAt/updatedAt fields
  tableName: 'transactions', // Specify the name of the table
  underscored: true, // Ensures snake_case naming convention for columns (e.g., user_id instead of userId)
});

module.exports = Transaction;
