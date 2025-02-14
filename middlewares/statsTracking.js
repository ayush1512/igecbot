const UserStats = require('../models/UserStats');

async function trackUserStats(ctx, next) {
    try {
        if (ctx.from) {
            const { id, username, first_name, last_name } = ctx.from;
            
            await UserStats.findOneAndUpdate(
                { userId: id },
                {
                    $inc: { interactions: 1 },
                    $setOnInsert: {
                        username,
                        firstName: first_name,
                        lastName: last_name,
                        firstSeen: new Date()
                    },
                    $set: { lastSeen: new Date() }
                },
                { upsert: true }
            );
        }
    } catch (error) {
        console.error('Error tracking user stats:', error);
    }
    return next();
}

module.exports = trackUserStats;
