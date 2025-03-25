require('dotenv').config(); // This will load environment variables from the .env file
const { MongoClient } = require('mongodb');

// Check if URI exists
if (!process.env.MONGO_URI) {
    console.error('MongoDB URI is not defined in environment variables');
    process.exit(1);
}

// Create a MongoDB client using environment variables
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Export a function that returns the connected client
module.exports = async () => {
    try {
        await client.connect();
        console.log('Database connected successfully');
        return client;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};
