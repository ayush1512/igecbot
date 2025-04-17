require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');
const trackUserStats = require('./middlewares/statsTracking');
const UserStats = require('./models/UserStats');

// Configuration
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    MONGO_URI: process.env.MONGO_URI,
    BOT_OWNER: process.env.BOT_OWNER // Add this line
};

// MongoDB Schema
const fileSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true,
        unique: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: String,
    uploadedBy: {
        userId: Number,
        username: String
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    yearSem: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    fileCatgry: {
        type: String,
        required: true
    }
});

const File = mongoose.model('File', fileSchema);

// Database Connection
async function connectDB() {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Initialize bot
const bot = new Telegraf(config.BOT_TOKEN);

// Enable session middleware and stats tracking
bot.use(session());
bot.use(trackUserStats);

// Connect to MongoDB
connectDB();

// Start command
bot.command('start', (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    
    // Original code commented out
    /*
    const firstName = ctx.from.first_name;
    ctx.reply(`*🎉 Welcome ${firstName}!* \n*📥 Use /get to search and download files.*`, { parse_mode: 'Markdown' });
    */
});

// Upload command handler
bot.command(`${process.env.uplCmd}`, (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    
    // Original code commented out
    /*
    ctx.session = {
        uploading: true
    };
    ctx.reply('*📤 Please send me the file you want to upload.*', { parse_mode: 'Markdown' });
    */
});

// File upload handler
bot.on(['document', 'photo', 'video', 'audio'], async (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    
    // Original code commented out
    /*
    try {
        const file = ctx.message.document || ctx.message.photo?.[0] || ctx.message.video || ctx.message.audio;
        const fileName = ctx.message.document?.file_name || 'untitled';

        // Save file with default categories
        const newFile = new File({
            fileId: file.file_id,
            fileName: fileName,
            fileType: getFileType(ctx.message),
            uploadedBy: {
                userId: ctx.from.id,
                username: ctx.from.username
            },
            yearSem: '4',
            branch: 'it',
            fileCatgry: 'qb'
        });

        await newFile.save();
        ctx.reply('*✅ File saved successfully!*\n*📥 Use /get to access and categorize your files.*', { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error handling file upload:', error);
        ctx.reply('*❌ Sorry, there was an error handling your file upload.*', { parse_mode: 'Markdown' });
    }
    */
});

// Get command
bot.command('get', async (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    
    // Original code commented out
    /*
    await ctx.reply('*📚 Select Year:*', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '1️⃣', callback_data: 'listYearSem:1' }],
                [{ text: '2️⃣', callback_data: 'listYearSem:2' }],
                [{ text: '3️⃣', callback_data: 'listYearSem:3' }],
                [{ text: '4️⃣', callback_data: 'listYearSem:4' }]
            ]
        }
    });
    */
});

// Year/semester selection handler
bot.action(/listYearSem:(.+)/, async (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    await ctx.answerCbQuery('Bot is currently under maintenance');
    
    // Original code commented out
    /*
    try {
        // Delete the previous message if exists
        if (ctx.session?.lastMessageId) {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.lastMessageId).catch(() => {});
        }

        const yearSem = ctx.match[1];
        
        // Initialize session if it doesn't exist
        if (!ctx.session) {
            ctx.session = {};
        }
        
        ctx.session.selectedYearSem = yearSem;
        
        const sentMessage = await ctx.reply('*🎓 Select Branch:*', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💻 CSE', callback_data: 'listBranch:cse' }],
                    [{ text: '💾 IT', callback_data: 'listBranch:it' }],
                    [{ text: '⚡️ ECE', callback_data: 'listBranch:ece' }],
                    [{ text: '🔋 EE', callback_data: 'listBranch:ee' }]
                ]
            }
        });
        
        // Store new message ID
        ctx.session.lastMessageId = sentMessage.message_id;
        
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error handling year/semester selection:', error);
        ctx.reply('*❌ Sorry, there was an error processing your request.*', { parse_mode: 'Markdown' });
    }
    */
});

// Branch selection handler
bot.action(/listBranch:(.+)/, async (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    await ctx.answerCbQuery('Bot is currently under maintenance');
    
    // Original code commented out
    /*
    try {
        // ...existing code...
    } catch (error) {
        console.error('Error handling branch selection:', error);
        ctx.reply('*❌ Sorry, there was an error processing your request.*', { parse_mode: 'Markdown' });
    }
    */
});

// Category selection handler
bot.action(/listCategory:(.+)/, async (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    await ctx.answerCbQuery('Bot is currently under maintenance');
    
    // Original code commented out
    /*
    try {
        // ...existing code...
    } catch (error) {
        console.error('Error fetching files:', error);
        ctx.reply('*❌ Sorry, there was an error fetching your files.\n🔄 Please try again with /get command*', { parse_mode: 'Markdown' });
    }
    */
});

// File options handler
bot.action(/fileOptions:(.+)/, async (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    await ctx.answerCbQuery('Bot is currently under maintenance');
    
    // Original code commented out
    /*
    try {
        // ...existing code...
    } catch (error) {
        console.error('Error showing file options:', error);
        ctx.reply('*❌ Sorry, there was an error processing your request*', { parse_mode: 'Markdown' });
    }
    */
});

// Back to menu handler
bot.action('backToMenu', async (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    await ctx.answerCbQuery('Bot is currently under maintenance');
    
    // Original code commented out
    /*
    try {
        // ...existing code...
    } catch (error) {
        console.error('Error in backToMenu handler:', error);
        ctx.reply('*❌ Please use /get command to start over*', { parse_mode: 'Markdown' });
    }
    */
});

// File selection handler
bot.action(/file:(.+)/, async (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    await ctx.answerCbQuery('Bot is currently under maintenance');
    
    // Original code commented out
    /*
    try {
        // ...existing code...
    } catch (error) {
        console.error('Error sending file:', error);
        ctx.reply('*❌ Sorry, there was an error retrieving the file*', { parse_mode: 'Markdown' });
    }
    */
});

// Stats command
bot.command(`${process.env.statsCmd}`, async (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    
    // Original code commented out
    /*
    try {
        // ...existing code...
    } catch (error) {
        console.error('Error generating stats:', error);
        ctx.reply('*❌ Error generating statistics*', { parse_mode: 'Markdown' });
    }
    */
});

// Submit command
bot.command('submit', (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    
    // Original code commented out
    /*
    if (!config.BOT_OWNER) {
        return ctx.reply('*❌ Sorry, file submission is currently unavailable.*', { parse_mode: 'Markdown' });
    }
    
    // ...existing code...
    */
});

// Text message handler
bot.on('text', (ctx) => {
    // Downtime message
    ctx.reply('*🛠️ Bot Maintenance*\n\n*The bot is currently undergoing maintenance and is temporarily unavailable. Please try again later.*', { parse_mode: 'Markdown' });
    
    // Original code commented out
    /*
    if (!ctx.message.text.startsWith('/')) {
        ctx.reply('*😔 Sorry! I cannot accept messages or files.\n📥 Use /get to access files or /submit to share files.*', { parse_mode: 'Markdown' });
    } else if (ctx.message.text !== '/get' && ctx.message.text !== '/start' && ctx.message.text !== '/submit') {
        ctx.reply('*❌ Invalid command!\n📥 Available commands: /get (access files) and /submit (share files)*', { parse_mode: 'Markdown' });
    }
    */
});

// Helper function to determine file type
function getFileType(message) {
    if (message.document) return 'document';
    if (message.photo) return 'photo';
    if (message.video) return 'video';
    if (message.audio) return 'audio';
    return 'unknown';
}

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('*❌ An error occurred while processing your request.*', { parse_mode: 'Markdown' });
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start the bot
bot.launch().then(() => {
    console.log('Bot is running...');
}).catch((error) => {
    console.error('Error starting bot:', error);
});