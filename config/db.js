const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "mysql",
  port: process.env.DB_PORT || 3306,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Add this if you're using a managed database that requires SSL
    }
  },
  logging: false, // Disable logging to clean up console output
});

module.exports = sequelize;
