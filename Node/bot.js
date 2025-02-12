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
    ctx.reply('Welcome! Use /upload to send me any file to store it. Use /get to see your stored files.');
});

// Handle upload command
bot.command('upload', (ctx) => {
    ctx.session = {
        uploading: true
    };
    ctx.reply('Please send me the file you want to upload.');
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
            yearSem: '1',
            branch: 'it',
            fileCatgry: 'books'
        });

        await newFile.save();
        ctx.reply('File saved successfully! Use /get to access and categorize your files.');
    } catch (error) {
        console.error('Error handling file upload:', error);
        ctx.reply('Sorry, there was an error handling your file upload.');
    }
});

// List user's files - start with year selection
bot.command('get', async (ctx) => {
    await ctx.reply('Select Year:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📅 Year 1', callback_data: 'listYearSem:1' }],
                [{ text: '📅 Year 2', callback_data: 'listYearSem:2' }]
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

        await ctx.reply('Select Branch:', {
            reply_markup: branchKeyboard
        });
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error handling year selection:', error);
        ctx.reply('Sorry, there was an error processing your request.');
    }
});

// Handle branch selection
bot.action(/listBranch:(.+)/, async (ctx) => {
    try {
        const branch = ctx.match[1];
        ctx.session.selectedBranch = branch;

        await ctx.reply('Select Category:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📚 Books', callback_data: 'listCategory:books' }],
                    [{ text: '📝 Notes', callback_data: 'listCategory:notes' }],
                    [{ text: '📄 Question Papers', callback_data: 'listCategory:question_papers' }],
                    [{ text: '📑 Shivani QB', callback_data: 'listCategory:qb' }]
                ]
            }
        });
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error handling branch selection:', error);
        ctx.reply('Sorry, there was an error processing your request.');
    }
});

// Handle category selection and show filtered files
bot.action(/listCategory:(.+)/, async (ctx) => {
    try {
        const fileCatgry = ctx.match[1];
        const yearSem = ctx.session.selectedYearSem;
        const branch = ctx.session.selectedBranch;

        const files = await File.find({
            'uploadedBy.userId': ctx.from.id,
            yearSem: yearSem,
            branch: branch,
            fileCatgry: fileCatgry
        });

        if (files.length === 0) {
            return ctx.reply(`No files found in ${fileCatgry} for Year ${yearSem} - ${branch.toUpperCase()}`);
        }

        const keyboard = files.map((file) => [{
            text: `📁 ${file.fileName}`,
            callback_data: `fileOptions:${file._id}`
        }]);

        await ctx.reply(`Files in ${fileCatgry} (Year ${yearSem} - ${branch.toUpperCase()}):`, {
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error fetching files:', error);
        ctx.reply('Sorry, there was an error fetching your files.');
    }
});

// Handle file options selection
bot.action(/fileOptions:(.+)/, async (ctx) => {
    try {
        const fileId = ctx.match[1];
        const file = await File.findById(fileId);
        
        if (!file) {
            return ctx.reply('File not found.');
        }

        await ctx.reply(`File: ${file.fileName}\nYear: ${file.yearSem}\nBranch: ${file.branch.toUpperCase()}\nCategory: ${file.fileCatgry}`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📥 Download', callback_data: `file:${fileId}` }],
                    [{ text: '📅 Change Year', callback_data: `changeYear:${fileId}` }],
                    [{ text: '🏛 Change Branch', callback_data: `changeBranch:${fileId}` }],
                    [{ text: '📚 Change Category', callback_data: `changeCategory:${fileId}` }],
                    [{ text: '🔙 Back to Files', callback_data: `listCategory:${file.fileCatgry}` }]
                ]
            }
        });
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error showing file options:', error);
        ctx.reply('Sorry, there was an error processing your request.');
    }
});

// Handle year/semester change
bot.action(/changeYear:(.+)/, async (ctx) => {
    const fileId = ctx.match[1];
    await ctx.reply('Select new Year:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📅 Year 1', callback_data: `updateYear:${fileId}:1` }],
                [{ text: '📅 Year 2', callback_data: `updateYear:${fileId}:2` }]
            ]
        }
    });
    await ctx.answerCbQuery();
});

// Add branch change handler
bot.action(/changeBranch:(.+)/, async (ctx) => {
    const fileId = ctx.match[1];
    const file = await File.findById(fileId);
    
    // Different branch options based on file's year
    const branchKeyboard = file.yearSem === '1' ? {
        inline_keyboard: [
            [{ text: '💻 IT', callback_data: `updateBranch:${fileId}:it` }],
            [{ text: '📡 EC', callback_data: `updateBranch:${fileId}:ec` }],
            [{ text: '⚡ EE', callback_data: `updateBranch:${fileId}:ee` }],
            [{ text: '🔧 ME', callback_data: `updateBranch:${fileId}:me` }],
            [{ text: '🏗️ CE', callback_data: `updateBranch:${fileId}:ce` }],
            [{ text: '📐 Mathematics', callback_data: `updateBranch:${fileId}:maths` }],
            [{ text: '🧪 Chemistry', callback_data: `updateBranch:${fileId}:chem` }],
            [{ text: '🔬 Physics', callback_data: `updateBranch:${fileId}:phy` }],
            [{ text: '📖 English', callback_data: `updateBranch:${fileId}:eng` }]
        ]
    } : {
        inline_keyboard: [
            [{ text: '💻 IT', callback_data: `updateBranch:${fileId}:it` }],
            [{ text: '📡 EC', callback_data: `updateBranch:${fileId}:ec` }],
            [{ text: '⚡ EE', callback_data: `updateBranch:${fileId}:ee` }],
            [{ text: '🔧 ME', callback_data: `updateBranch:${fileId}:me` }],
            [{ text: '🏗️ CE', callback_data: `updateBranch:${fileId}:ce` }]
        ]
    };

    await ctx.reply('Select new Branch:', {
        reply_markup: branchKeyboard
    });
    await ctx.answerCbQuery();
});

// Handle category change
bot.action(/changeCategory:(.+)/, async (ctx) => {
    const fileId = ctx.match[1];
    await ctx.reply('Select new Category:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📚 Books', callback_data: `updateCategory:${fileId}:books` }],
                [{ text: '📝 Notes', callback_data: `updateCategory:${fileId}:notes` }],
                [{ text: '📄 Question Papers', callback_data: `updateCategory:${fileId}:question_papers` }],
                [{ text: '📑 Shivani QB', callback_data: `updateCategory:${fileId}:qb` }]
            ]
        }
    });
    await ctx.answerCbQuery();
});

// Handle year update
bot.action(/updateYear:(.+):(.+)/, async (ctx) => {
    try {
        const [_, fileId, yearSem] = ctx.match;
        await File.findByIdAndUpdate(fileId, { yearSem });
        ctx.reply('Year updated successfully! Use /get to see your files.');
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error updating year:', error);
        ctx.reply('Sorry, there was an error updating the year.');
    }
});

// Add branch update handler
bot.action(/updateBranch:(.+):(.+)/, async (ctx) => {
    try {
        const [_, fileId, branch] = ctx.match;
        await File.findByIdAndUpdate(fileId, { branch });
        ctx.reply('Branch updated successfully! Use /get to see your files.');
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error updating branch:', error);
        ctx.reply('Sorry, there was an error updating the branch.');
    }
});

// Handle category update
bot.action(/updateCategory:(.+):(.+)/, async (ctx) => {
    try {
        const [_, fileId, fileCatgry] = ctx.match;
        await File.findByIdAndUpdate(fileId, { fileCatgry });
        ctx.reply('Category updated successfully! Use /get to see your files.');
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error updating category:', error);
        ctx.reply('Sorry, there was an error updating the category.');
    }
});

// Handle file selection
bot.action(/file:(.+)/, async (ctx) => {
    try {
        const fileId = ctx.match[1];
        const file = await File.findById(fileId);
        
        if (!file) {
            return ctx.reply('File not found.');
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
                ctx.reply('Unsupported file type.');
        }

        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error sending file:', error);
        ctx.reply('Sorry, there was an error retrieving the file.');
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
    ctx.reply('An error occurred while processing your request.');
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