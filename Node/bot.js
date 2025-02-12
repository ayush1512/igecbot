require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');

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

// Enable session middleware
bot.use(session());

// Connect to MongoDB
connectDB();

// Start command
bot.command('start', (ctx) => {
    ctx.reply('*Welcome!* Use /upload to send me any file to store it. Use /get to see your stored files.', { parse_mode: 'Markdown' });
});

// Handle upload command
bot.command('upload', (ctx) => {
    ctx.session = {
        uploading: true
    };
    ctx.reply('*Please send me the file you want to upload.*', { parse_mode: 'Markdown' });
});

// Handle file uploads
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
        ctx.reply('*File saved successfully!* Use /get to access and categorize your files.', { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error handling file upload:', error);
        ctx.reply('*Sorry, there was an error handling your file upload.*', { parse_mode: 'Markdown' });
    }
});

// List user's files - start with year selection
bot.command('get', async (ctx) => {
    await ctx.reply('*Select Year:*', {
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

        await ctx.reply('*Select Branch:*', {
            parse_mode: 'Markdown',
            reply_markup: branchKeyboard
        });
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error handling year selection:', error);
        ctx.reply('*Sorry, there was an error processing your request.*', { parse_mode: 'Markdown' });
    }
});

// Handle branch selection
bot.action(/listBranch:(.+)/, async (ctx) => {
    try {
        // Initialize session if it doesn't exist
        if (!ctx.session) {
            ctx.session = {};
        }

        const branch = ctx.match[1];
        ctx.session.selectedBranch = branch;

        await ctx.reply('*Select Category:*', {
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
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error handling branch selection:', error);
        ctx.reply('*Sorry, there was an error processing your request.*', { parse_mode: 'Markdown' });
    }
});

// Handle category selection and show filtered files
bot.action(/listCategory:(.+)/, async (ctx) => {
    try {
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
            return ctx.reply(`❌ No files found in ${category} for Year ${yearSem} - ${branch.toUpperCase()} 📂`, { parse_mode: 'Markdown' });
        }

        const keyboard = files.map((file) => [{
            text: fileCatgry === 'all' ? 
                `📁 ${file.fileName} (${file.fileCatgry})` : 
                `📁 ${file.fileName}`,
            callback_data: `fileOptions:${file._id}`
        }]);

        const categoryDisplay = fileCatgry === 'all' ? 'All Files' : fileCatgry;
        await ctx.reply(`*📂 ${categoryDisplay} (Year ${yearSem} - ${branch.toUpperCase()}):*`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
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
        await ctx.reply('*Select Year:*', {
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

// Add message handler for text messages
bot.on('text', (ctx) => {
    if (ctx.message.text.startsWith('/') && ctx.message.text !== '/get'||'/start') {
        ctx.reply('*❌ Invalid command!\nOnly /get command is available to access files 📂*', { parse_mode: 'Markdown' });
    } else if (!ctx.message.text.startsWith('/')) {
        ctx.reply('*😔 Sorry! I can not chat with you yet.\nPlease use /get command to access files 📂*', { parse_mode: 'Markdown' });
    }
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
    ctx.reply('*An error occurred while processing your request.*', { parse_mode: 'Markdown' });
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