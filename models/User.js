const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    subscription_start_date: {
        type: Date
    },
    plan_duration: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('User', userSchema);