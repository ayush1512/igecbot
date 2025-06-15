require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const trackUserStats = require('./middlewares/statsTracking');
const Database = require('./services/database');
const BotRoutes = require('./routes/botRoutes');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/',(req,res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Express server listening on PORT ${PORT}`);
});

if (process.env.RENDER) { // Only run on Render
    setInterval(async () => {
        try {
            const fetch = (await import('node-fetch')).default;
            await fetch(`https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'https://igecbot.onrender.com'}/`);
            console.log('Self-ping sent');
        } catch (err) {
            console.error('Self-ping failed:', err);
        }
    }, 5 * 60 * 1000); // Ping every 5 minutes
}

// Configuration
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    MONGO_URI: process.env.MONGO_URI,
    BOT_OWNER: process.env.BOT_OWNER 
};

// Initialize bot
const bot = new Telegraf(config.BOT_TOKEN);

// Enable session middleware and stats tracking
bot.use(session());
bot.use(trackUserStats);

// Connect to MongoDB
Database.connect(config.MONGO_URI);

// Setup routes
BotRoutes.setupRoutes(bot, config);

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('*❌ An error occurred while processing your request.*', { parse_mode: 'Markdown' });
});

// Graceful shutdown
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    Database.disconnect();
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    Database.disconnect();
});

// Start the bot
bot.launch().then(() => {
    console.log('Bot is running...');
}).catch((error) => {
    console.error('Error starting bot:', error);
});


