require('dotenv').config(); // This will load environment variables from the .env file
const mysql = require('mysql2');

// Create a connection pool to the database using environment variables
const db = mysql.createPool({
    host: process.env.DB_HOST,           // Database host
    user: process.env.DB_USER,           // Database user
    password: process.env.DB_PASSWORD,   // Database password
    database: process.env.DB_NAME,       // Database name
});

// Export the connection pool to be used in other files
module.exports = db.promise();
