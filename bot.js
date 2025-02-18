require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');
const trackUserStats = require('./middlewares/statsTracking');
const UserStats = require('./models/UserStats');

// Configuration
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    MONGO_URI: process.env.MONGO_URI
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

// Start command - removed upload mention
bot.command('start', (ctx) => {
    const firstName = ctx.from.first_name;
    ctx.reply(`*🎉 Welcome ${firstName}!* \n*📥 Use /get to search and download files.*`, { parse_mode: 'Markdown' });
});

// Comment out upload command handler

bot.command(`${process.env.uplCmd}`, (ctx) => {
    ctx.session = {
        uploading: true
    };
    ctx.reply('*📤 Please send me the file you want to upload.*', { parse_mode: 'Markdown' });
});


// Comment out file upload handler

bot.on(['document', 'photo', 'video', 'audio'], async (ctx) => {
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
});


// List user's files - start with year selection
bot.command('get', async (ctx) => {
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
});

// Handle year/semester selection for listing
bot.action(/listYearSem:(.+)/, async (ctx) => {
    try {
        // Delete the current message
        await ctx.deleteMessage();

        const yearSem = ctx.match[1];
        if (!ctx.session) {
            ctx.session = {};
        }
        ctx.session.selectedYearSem = yearSem;

        // Different branch options based on year
        const branchKeyboard = yearSem === '1' ? {
            inline_keyboard: [
                [{ text: '💻 IT', callback_data: 'listBranch:it' }],
                [{ text: '📡 EC', callback_data: 'listBranch:ec' }],
                [{ text: '⚡ EE', callback_data: 'listBranch:ee' }],
                [{ text: '🔧 ME', callback_data: 'listBranch:me' }],
                [{ text: '🏗️ CE', callback_data: 'listBranch:ce' }],
                [{ text: '📐 Mathematics', callback_data: 'listBranch:maths' }],
                [{ text: '🧪 Chemistry', callback_data: 'listBranch:chem' }],
                [{ text: '🔬 Physics', callback_data: 'listBranch:phy' }],
                [{ text: '📖 English', callback_data: 'listBranch:eng' }]
            ]
        } : {
            inline_keyboard: [
                [{ text: '💻 IT', callback_data: 'listBranch:it' }],
                [{ text: '📡 EC', callback_data: 'listBranch:ec' }],
                [{ text: '⚡ EE', callback_data: 'listBranch:ee' }],
                [{ text: '🔧 ME', callback_data: 'listBranch:me' }],
                [{ text: '🏗️ CE', callback_data: 'listBranch:ce' }]
            ]
        };

        const sentMessage = await ctx.reply('*📑 Select Branch:*', {
            parse_mode: 'Markdown',
            reply_markup: branchKeyboard
        });
        
        // Store message ID for later deletion
        ctx.session.lastMessageId = sentMessage.message_id;
        
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error handling year selection:', error);
        ctx.reply('*❌ Sorry, there was an error processing your request.*', { parse_mode: 'Markdown' });
    }
});

// Handle branch selection
bot.action(/listBranch:(.+)/, async (ctx) => {
    try {
        // Delete the previous message if exists
        if (ctx.session?.lastMessageId) {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.lastMessageId).catch(() => {});
        }

        if (!ctx.session) {
            ctx.session = {};
        }

        const branch = ctx.match[1];
        ctx.session.selectedBranch = branch;

        const sentMessage = await ctx.reply('*📑 Select Category:*', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📚 Books', callback_data: 'listCategory:books' }],
                    [{ text: '📝 Notes', callback_data: 'listCategory:notes' }],
                    [{ text: '📄 Question Papers', callback_data: 'listCategory:qp' }],
                    [{ text: '📑 Shivani QB', callback_data: 'listCategory:qb' }],
                    [{ text: '📂 All Files', callback_data: 'listCategory:all' }]
                ]
            }
        });

        // Store new message ID
        ctx.session.lastMessageId = sentMessage.message_id;
        
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error handling branch selection:', error);
        ctx.reply('*❌ Sorry, there was an error processing your request.*', { parse_mode: 'Markdown' });
    }
});

// Handle category selection and show filtered files
bot.action(/listCategory:(.+)/, async (ctx) => {
    try {
        // Delete the previous message if exists
        if (ctx.session?.lastMessageId) {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.lastMessageId).catch(() => {});
        }

        // Initialize session if it doesn't exist
        if (!ctx.session) {
            ctx.session = {};
        }

        const fileCatgry = ctx.match[1];
        const yearSem = ctx.session.selectedYearSem;
        const branch = ctx.session.selectedBranch;

        // Validate required session data
        if (!yearSem || !branch) {
            return ctx.reply('*⌛ Session expired. Please start over with /get command 🔄*', { parse_mode: 'Markdown' });
        }

        // Build query based on whether we want all files or specific category
        const query = {
            yearSem: yearSem,
            branch: branch
        };

        if (fileCatgry !== 'all') {
            query.fileCatgry = fileCatgry;
        }

        const files = await File.find(query);

        if (files.length === 0) {
            const category = fileCatgry === 'all' ? 'any category' : fileCatgry;
            await ctx.reply(`*❌ No files found in ${category} for Year ${yearSem} - ${branch.toUpperCase()} 📂*`, { 
                parse_mode: 'Markdown' 
            });
            
            // Wait a moment before showing the year selection
            setTimeout(async () => {
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
            }, 1000); // 1.5 second delay
            return;
        }

        const keyboard = files.map((file) => [{
            text: fileCatgry === 'all' ? 
                `📁 ${file.fileName} (${file.fileCatgry})` : 
                `📁 ${file.fileName}`,
            callback_data: `fileOptions:${file._id}`
        }]);

        const categoryDisplay = fileCatgry === 'all' ? 'All Files' : fileCatgry;
        const sentMessage = await ctx.reply(`*📂 ${categoryDisplay} (Year ${yearSem} - ${branch.toUpperCase()}):*`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: keyboard
            }
        });

        ctx.session.lastMessageId = sentMessage.message_id;
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error fetching files:', error);
        ctx.reply('*❌ Sorry, there was an error fetching your files.\n🔄 Please try again with /get command*', { parse_mode: 'Markdown' });
    }
});

// Handle file options selection
bot.action(/fileOptions:(.+)/, async (ctx) => {
    try {
        const fileId = ctx.match[1];
        const file = await File.findById(fileId);
        
        if (!file) {
            return ctx.reply('*❌ File not found*', { parse_mode: 'Markdown' });
        }

        await ctx.reply(`*📁 File: ${file.fileName}*`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📥 Download', callback_data: `file:${fileId}` }],
                    [{ text: '🔙 Back to Menu', callback_data: 'backToMenu' }]
                ]
            }
        });
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error showing file options:', error);
        ctx.reply('*❌ Sorry, there was an error processing your request*', { parse_mode: 'Markdown' });
    }
});

// Add back to menu handler
bot.action('backToMenu', async (ctx) => {
    try {
        // Delete the last 5 messages
        const messageId = ctx.callbackQuery.message.message_id;
        for (let i = 0; i < 5; i++) {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, messageId - i);
            } catch (err) {
                console.log(`Could not delete message ${messageId - i}:`, err.message);
            }
        }

        // Replicate /get command functionality
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
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error in backToMenu handler:', error);
        ctx.reply('*❌ Please use /get command to start over*', { parse_mode: 'Markdown' });
    }
});

// Handle file selection
bot.action(/file:(.+)/, async (ctx) => {
    try {
        const fileId = ctx.match[1];
        const file = await File.findById(fileId);
        
        if (!file) {
            return ctx.reply('*File not found.*', { parse_mode: 'Markdown' });
        }

        // Send the file back to user based on its type
        switch (file.fileType) {
            case 'document':
                await ctx.replyWithDocument(file.fileId);
                break;
            case 'photo':
                await ctx.replyWithPhoto(file.fileId);
                break;
            case 'video':
                await ctx.replyWithVideo(file.fileId);
                break;
            case 'audio':
                await ctx.replyWithAudio(file.fileId);
                break;
            default:
                ctx.reply('*Unsupported file type.*', { parse_mode: 'Markdown' });
        }

        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error sending file:', error);
        ctx.reply('*❌ Sorry, there was an error retrieving the file*', { parse_mode: 'Markdown' });
    }
});

// Add stats command
bot.command(`${process.env.statsCmd}`, async (ctx) => {
    try {
        const stats = await UserStats.find().sort({ interactions: -1 });
        const totalUsers = stats.length;
        const totalInteractions = stats.reduce((sum, user) => sum + user.interactions, 0);

        let message = '*📊 Bot Statistics*\n\n';
        message += `*Total Users:* ${totalUsers}\n`;
        message += `*Total Interactions:* ${totalInteractions}\n\n`;
        message += '*👥 User Interactions:*\n';

        stats.forEach(user => {
            const name = user.firstName || user.username || 'Unknown';
            message += `- ${name}: ${user.interactions} interactions\n`;
        });

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error generating stats:', error);
        ctx.reply('*❌ Error generating statistics*', { parse_mode: 'Markdown' });
    }
});

// Modified text message handler to block uploads
bot.on('text', (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
        ctx.reply('*😔 Sorry! I cannot accept messages or files.\n📥 Please use /get command to access files.*', { parse_mode: 'Markdown' });
    } else if (ctx.message.text !== '/get' && ctx.message.text !== '/start') {
        ctx.reply('*❌ Invalid command!\n📥 Only /get command is available to access files.*', { parse_mode: 'Markdown' });
    }
});

// Add media message handler to block uploads
bot.on(['document', 'photo', 'video', 'audio'], (ctx) => {
    ctx.reply('*❌ Sorry! File uploads are not allowed.\n📥 Please use /get command to access available files.*', { parse_mode: 'Markdown' });
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