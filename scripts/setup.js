const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI ;

async function setupDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Check if admin user exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            // Create admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminUser = new User({
                name: 'Admin',
                email: 'admin@stocktrade.com',
                password: hashedPassword,
                role: 'admin',
                plan: 'premium',
                active: true,
                subscription: {
                    status: 'active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
                }
            });

            await adminUser.save();
            console.log('Admin user created successfully');
            console.log('Email: admin@stocktrade.com');
            console.log('Password: admin123');
        } else {
            console.log('Admin user already exists');
        }

        // Create test user if it doesn't exist
        const testUserExists = await User.findOne({ email: 'test@stocktrade.com' });
        if (!testUserExists) {
            const hashedPassword = await bcrypt.hash('test123', 10);
            const testUser = new User({
                name: 'Test User',
                email: 'test@stocktrade.com',
                password: hashedPassword,
                role: 'user',
                plan: 'basic',
                active: true,
                subscription: {
                    status: 'inactive'
                }
            });

            await testUser.save();
            console.log('Test user created successfully');
            console.log('Email: test@stocktrade.com');
            console.log('Password: test123');
        } else {
            console.log('Test user already exists');
        }

        console.log('Database setup completed');
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        await mongoose.disconnect();
    }
}

setupDatabase(); 