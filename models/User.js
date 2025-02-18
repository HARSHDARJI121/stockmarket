const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');  // Import your Sequelize instance

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,  // Set allowNull to true if you don't want username to be required
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    // Other model options
});

module.exports = User;
