const mysql = require('mysql2');

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',         // Your MySQL username
  password: 'Harsh@5489',         // Your MySQL password
  database: 'stocktrade' // Your database name
});

module.exports = pool.promise(); // Using promise-based API for easy async/await handling
