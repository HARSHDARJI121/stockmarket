const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

async function setupLocalDB() {
    try {
        // Try connecting to local MongoDB
        const client = await MongoClient.connect('mongodb://localhost:27017', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });

        // Create database if it doesn't exist
        const db = client.db('stocktrade');
        
        console.log('Successfully connected to local MongoDB');
        console.log('Database "stocktrade" is ready to use');
        
        // Create indexes for better performance
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('transactions').createIndex({ user_id: 1 });
        await db.collection('transactions').createIndex({ status: 1 });
        
        console.log('Database indexes created successfully');
        
        await client.close();
        console.log('Setup completed successfully');
        
    } catch (error) {
        console.error('Error setting up local MongoDB:', error);
        console.log('\nTroubleshooting steps:');
        console.log('1. Make sure MongoDB is installed on your system');
        console.log('2. Ensure MongoDB service is running:');
        console.log('   - Windows: Open Services app and check MongoDB service');
        console.log('   - Linux/Mac: Run "sudo service mongod status"');
        console.log('3. Try starting MongoDB manually:');
        console.log('   - Windows: "C:\\Program Files\\MongoDB\\Server\\{version}\\bin\\mongod.exe"');
        console.log('   - Linux/Mac: "sudo service mongod start"');
        process.exit(1);
    }
}

setupLocalDB(); 