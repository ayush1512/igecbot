const File = require('../models/File');
const UserStats = require('../models/UserStats');
const fileView = require('../views/fileView');
const userView = require('../views/userView');
const Together = require('together-ai')
const together = new Together({
    apiKey: process.env.TOGETHER_API_KEY
});


class BotController {
    // Start command handler
    static async handleStart(ctx) {
        const firstName = ctx.from.first_name;
        ctx.reply(userView.welcomeMessage(firstName), { parse_mode: 'Markdown' });
    }

    // Upload command handler
    static async handleUpload(ctx) {
        ctx.session = {
            uploading: true
        };
        ctx.reply(fileView.uploadPromptMessage(), { parse_mode: 'Markdown' });
    }

    // Get command handler
    static async handleGet(ctx) {
        await ctx.reply(fileView.yearSelectionMessage(), {
            parse_mode: 'Markdown',
            reply_markup: fileView.yearSelectionKeyboard()
        });
    }

    // Text handler
    static async handleTextMessage(ctx) {
        try {
            if (!ctx.message || typeof ctx.message.text !== 'string') {
                console.error('handleTextMessage error: ctx.message or ctx.message.text is undefined', { ctx });
                return ctx.reply('Sorry, I could not understand your message.');
            }
            const userMessage = ctx.message.text;
            
            // Skip if it's a command
            if (userMessage.startsWith('/')) return;
            
            try {
                const response = await together.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are IGEC Bot's AI assistant. You tell students about the use of this bot for getting study material. You chat with them in a sweet-friendly tone with emojis, and always tell them to use the /get command to get the files, tell them to contribute using the /submit command if they have any study resources that might help others, if they ask questions about Indira Gandhi Engineering College, Sagar, Madhya Pradesh or engineering related answer them but avoid much chatting. Keep responses concise and helpful. "
                        },
                        {
                            role: "user",
                            content: userMessage
                        }
                    ],
                    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
                    max_tokens: 150,
                    temperature: 0.7
                });

                await ctx.reply(response.choices[0].message.content);
            } catch (error) {
                console.error('Together AI error:', error);
                await ctx.reply('Sorry, I couldn\'t process your message right now. Try using /get to browse files or /start for help.');
            }
        } catch (outerError) {
            console.error('handleTextMessage outer error:', outerError);
            if (ctx && ctx.reply) {
                ctx.reply('An unexpected error occurred.');
            }
        }
    }

    // Year selection handler
    static async handleYearSelection(ctx) {
        try {
            await ctx.deleteMessage();

            const yearSem = ctx.match[1];
            if (!ctx.session) {
                ctx.session = {};
            }
            ctx.session.selectedYearSem = yearSem;

            const branchKeyboard = fileView.getBranchKeyboard(yearSem);
            const sentMessage = await ctx.reply(fileView.branchSelectionMessage(), {
                parse_mode: 'Markdown',
                reply_markup: branchKeyboard
            });
            
            ctx.session.lastMessageId = sentMessage.message_id;
            await ctx.answerCbQuery();
        } catch (error) {
            console.error('Error handling year selection:', error);
            ctx.reply(fileView.errorMessage(), { parse_mode: 'Markdown' });
        }
    }

    // Branch selection handler
    static async handleBranchSelection(ctx) {
        try {
            if (ctx.session?.lastMessageId) {
                await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.lastMessageId).catch(() => {});
            }

            if (!ctx.session) {
                ctx.session = {};
            }

            const branch = ctx.match[1];
            ctx.session.selectedBranch = branch;

            const sentMessage = await ctx.reply(fileView.categorySelectionMessage(), {
                parse_mode: 'Markdown',
                reply_markup: fileView.categorySelectionKeyboard()
            });

            ctx.session.lastMessageId = sentMessage.message_id;
            await ctx.answerCbQuery();
        } catch (error) {
            console.error('Error handling branch selection:', error);
            ctx.reply(fileView.errorMessage(), { parse_mode: 'Markdown' });
        }
    }

    // Category selection handler
    static async handleCategorySelection(ctx) {
        try {
            if (ctx.session?.lastMessageId) {
                await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.lastMessageId).catch(() => {});
            }

            if (!ctx.session) {
                ctx.session = {};
            }

            const fileCatgry = ctx.match[1];
            const yearSem = ctx.session.selectedYearSem;
            const branch = ctx.session.selectedBranch;

            if (!yearSem || !branch) {
                return ctx.reply(fileView.sessionExpiredMessage(), { parse_mode: 'Markdown' });
            }

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
                await ctx.reply(fileView.noFilesFoundMessage(category, yearSem, branch), { 
                    parse_mode: 'Markdown' 
                });
                
                setTimeout(async () => {
                    await ctx.reply(fileView.yearSelectionMessage(), {
                        parse_mode: 'Markdown',
                        reply_markup: fileView.yearSelectionKeyboard()
                    });
                }, 1000);
                return;
            }

            const keyboard = fileView.createFileListKeyboard(files, fileCatgry);
            const categoryDisplay = fileCatgry === 'all' ? 'All Files' : fileCatgry;
            const sentMessage = await ctx.reply(fileView.fileListMessage(categoryDisplay, yearSem, branch), {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: keyboard
                }
            });

            ctx.session.lastMessageId = sentMessage.message_id;
            await ctx.answerCbQuery();
        } catch (error) {
            console.error('Error fetching files:', error);
            ctx.reply(fileView.fetchErrorMessage(), { parse_mode: 'Markdown' });
        }
    }

    // File options handler
    static async handleFileOptions(ctx) {
        try {
            const fileId = ctx.match[1];
            const file = await File.findById(fileId);
            
            if (!file) {
                return ctx.reply(fileView.fileNotFoundMessage(), { parse_mode: 'Markdown' });
            }

            await ctx.reply(fileView.fileOptionsMessage(file.fileName), {
                parse_mode: 'Markdown',
                reply_markup: fileView.fileOptionsKeyboard(fileId)
            });
            await ctx.answerCbQuery();
        } catch (error) {
            console.error('Error showing file options:', error);
            ctx.reply(fileView.errorMessage(), { parse_mode: 'Markdown' });
        }
    }

    // Back to menu handler
    static async handleBackToMenu(ctx) {
        try {
            const messageId = ctx.callbackQuery.message.message_id;
            for (let i = 0; i < 5; i++) {
                try {
                    await ctx.telegram.deleteMessage(ctx.chat.id, messageId - i);
                } catch (err) {
                    console.log(`Could not delete message ${messageId - i}:`, err.message);
                }
            }

            await ctx.reply(fileView.yearSelectionMessage(), {
                parse_mode: 'Markdown',
                reply_markup: fileView.yearSelectionKeyboard()
            });
            await ctx.answerCbQuery();
        } catch (error) {
            console.error('Error in backToMenu handler:', error);
            ctx.reply(fileView.backToMenuErrorMessage(), { parse_mode: 'Markdown' });
        }
    }

    // File download handler
    static async handleFileDownload(ctx) {
        try {
            const fileId = ctx.match[1];
            const file = await File.findById(fileId);
            
            if (!file) {
                return ctx.reply(fileView.fileNotFoundMessage(), { parse_mode: 'Markdown' });
            }

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
                    ctx.reply(fileView.unsupportedFileTypeMessage(), { parse_mode: 'Markdown' });
            }

            await ctx.answerCbQuery();
        } catch (error) {
            console.error('Error sending file:', error);
            ctx.reply(fileView.fileRetrievalErrorMessage(), { parse_mode: 'Markdown' });
        }
    }

    // Stats command handler
    static async handleStats(ctx) {
        try {
            const stats = await UserStats.find().sort({ interactions: -1 });
            const totalUsers = stats.length;
            const totalInteractions = stats.reduce((sum, user) => sum + user.interactions, 0);

            const message = userView.statsMessage(totalUsers, totalInteractions, stats);
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error generating stats:', error);
            ctx.reply(userView.statsErrorMessage(), { parse_mode: 'Markdown' });
        }
    }

    // Submit command handler
    static async handleSubmit(ctx, config) {
        if (!config.BOT_OWNER) {
            return ctx.reply(userView.submitUnavailableMessage(), { parse_mode: 'Markdown' });
        }
        
        const ownerUsername = config.BOT_OWNER.startsWith('@') ? config.BOT_OWNER.substring(1) : config.BOT_OWNER;
        const firstName = ctx.from.first_name;
        
        ctx.reply(userView.submitMessage(firstName), {
            parse_mode: 'Markdown',
            reply_markup: userView.submitKeyboard(ownerUsername)
        });
    }

    // Text message handler
    // (Removed duplicate definition to avoid overwriting the main handler with error logging)

    // Media message handler
    static async handleMediaMessage(ctx) {
        ctx.reply(userView.uploadNotAllowedMessage(), { parse_mode: 'Markdown' });
    }

    // Helper method to determine file type
    static getFileType(message) {
        if (message.document) return 'document';
        if (message.photo) return 'photo';
        if (message.video) return 'video';
        if (message.audio) return 'audio';
        return 'unknown';
    }
}

module.exports = BotController;