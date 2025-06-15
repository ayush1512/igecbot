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
        default: 0
    },
    commands: {
        start: { type: Number, default: 0 },
        get: { type: Number, default: 0 },
        submit: { type: Number, default: 0 },
        stats: { type: Number, default: 0 },
        upload: { type: Number, default: 0 }
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    },
    firstInteraction: {
        type: Date,
        default: Date.now
    },
    downloads: {
        type: Number,
        default: 0
    },
    uploads: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
});

// Add indexes (userId index is automatically created by unique: true)
userStatsSchema.index({ interactions: -1 });
userStatsSchema.index({ lastInteraction: -1 });

// Instance methods
userStatsSchema.methods.incrementInteraction = function() {
    this.interactions += 1;
    this.lastInteraction = new Date();
    return this.save();
};

userStatsSchema.methods.incrementCommand = function(command) {
    if (this.commands[command] !== undefined) {
        this.commands[command] += 1;
    }
    this.interactions += 1;
    this.lastInteraction = new Date();
    return this.save();
};

userStatsSchema.methods.incrementDownloads = function() {
    this.downloads += 1;
    this.interactions += 1;
    this.lastInteraction = new Date();
    return this.save();
};

userStatsSchema.methods.incrementUploads = function() {
    this.uploads += 1;
    this.interactions += 1;
    this.lastInteraction = new Date();
    return this.save();
};

// Static methods
userStatsSchema.statics.getTopUsers = function(limit = 10) {
    return this.find({ isActive: true })
        .sort({ interactions: -1 })
        .limit(limit)
        .select('userId username firstName interactions downloads uploads lastInteraction');
};

userStatsSchema.statics.getTotalStats = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        { $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalInteractions: { $sum: '$interactions' },
            totalDownloads: { $sum: '$downloads' },
            totalUploads: { $sum: '$uploads' },
            avgInteractions: { $avg: '$interactions' }
        }}
    ]);
};

userStatsSchema.statics.getActiveUsers = function(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.find({
        isActive: true,
        lastInteraction: { $gte: cutoffDate }
    }).sort({ lastInteraction: -1 });
};

module.exports = mongoose.model('UserStats', userStatsSchema);
