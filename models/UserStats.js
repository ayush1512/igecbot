const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
        unique: true
    },
    username: String,
    firstName: String,
    lastName: String,
    interactions: {
        type: Number,
        default: 1
    },
    firstSeen: {
        type: Date,
        default: Date.now
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserStats', userStatsSchema);
