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

            // Use static method calls
            const keywords = BotController.extractKeywords(userMessage);
            const relevantFiles = await BotController.searchRelevantFiles(keywords);

            // Filter files to only show highly relevant ones (score > 5)
            const highlyRelevantFiles = await BotController.getHighlyRelevantFiles(keywords, relevantFiles);

            try {
                let fileContext = '';
                if (highlyRelevantFiles.length > 0) {
                    fileContext = "Available study materials in our database:\n";
                    highlyRelevantFiles.forEach((file, index) => {
                        fileContext += `${index + 1}. "${file.fileName}" - ${file.fileCatgry} (${file.yearSem}, ${file.branch})\n`;
                    });
                    fileContext += "\nWhen suggesting files, reference them by their exact file name.";
                } else {
                    fileContext = "No specific files found matching the query. Suggest using /get command to browse available files.";
                }

                const response = await together.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are IGEC Bot's AI assistant for Indira Gandhi Engineering College, Sagar, MP. Help students with study materials and academic queries. Use a friendly tone with emojis. Keep responses concise. Always mention /get command for browsing files and /submit for contributing resources. Focus on being helpful for academic needs."
                        },
                        {
                            role: "system",
                            content: `Context: ${fileContext}`
                        },
                        {
                            role: "user",
                            content: userMessage
                        }
                    ],
                    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
                    max_tokens: 250,
                    temperature: 0.7
                });

                await ctx.reply(response.choices[0].message.content);

                // Only show keyboard if we have highly relevant files
                if (highlyRelevantFiles.length > 0) {
                    // Additional filtering to show only the most relevant files based on the AI's context
                    const contextuallyRelevantFiles = BotController.filterContextuallyRelevantFiles(highlyRelevantFiles, keywords);
                    
                    if (contextuallyRelevantFiles.length > 0) {
                        const keyboard = BotController.createFileAccessKeyboard(contextuallyRelevantFiles);
                        await ctx.reply("📁 Here are the relevant files:", {
                            reply_markup: {
                                inline_keyboard: keyboard
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Together AI error:', error);
                await ctx.reply('Sorry, I couldn\'t process your message right now. Try using /get to browse files or ask a simpler question! 😊');
            }
        } catch (outerError) {
            console.error('handleTextMessage outer error:', outerError);
            if (ctx && ctx.reply) {
                ctx.reply('An unexpected error occurred. Please try again! 🔄');
            }
        }
    }

    // Helper methods
    static extractKeywords(message) {
        const stopWords = ['the', 'a', 'an', 'and', 'in', 'on', 'at', 'for', 'to', 'of', 'is', 'are', 'i', 'you', 'me', 'my', 'can', 'need', 'want', 'get', 'find', 'help', 'please'];
        const academicTerms = ['notes', 'syllabus', 'assignment', 'lab', 'manual', 'question', 'paper', 'exam', 'tutorial', 'lecture', 'ppt', 'pdf', 'book', 'study', 'material'];
        
        // Branch mappings
        const branchMappings = {
            'information technology': 'it',
            'it': 'it',
            'computer science': 'it',
            'cs': 'it',
            'electronics communication': 'ec',
            'electronics': 'ec',
            'ec': 'ec',
            'ece': 'ec',
            'electrical engineering': 'ee',
            'electrical': 'ee',
            'ee': 'ee',
            'eee': 'ee',
            'mechanical engineering': 'me',
            'mechanical': 'me',
            'me': 'me',
            'mech': 'me',
            'civil engineering': 'ce',
            'civil': 'ce',
            'ce': 'ce',
            'mathematics': 'maths',
            'maths': 'maths',
            'math': 'maths',
            'chemistry': 'chem',
            'chem': 'chem',
            'physics': 'phy',
            'phy': 'phy',
            'english': 'eng',
            'eng': 'eng'
        };
        
        // Category mappings
        const categoryMappings = {
            'books': 'books',
            'book': 'books',
            'textbook': 'books',
            'textbooks': 'books',
            'notes': 'notes',
            'note': 'notes',
            'class notes': 'notes',
            'lecture notes': 'notes',
            'question papers': 'qp',
            'question paper': 'qp',
            'qp': 'qp',
            'papers': 'qp',
            'paper': 'qp',
            'exam papers': 'qp',
            'question books': 'qb',
            'question book': 'qb',
            'qb': 'qb',
            'question bank': 'qb',
            'questionbank': 'qb'
        };
        
        const words = message.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => word.length > 1 && !stopWords.includes(word));
        
        // Prioritize academic terms and technical keywords
        const prioritizedWords = words.filter(word => academicTerms.includes(word) || word.length > 3);
        const finalWords = prioritizedWords.length > 0 ? prioritizedWords : words;
        
        // Map terms to database values
        const mappedWords = [];
        const originalMessage = message.toLowerCase();
        
        // Check for multi-word mappings first
        for (const [key, value] of Object.entries(branchMappings)) {
            if (originalMessage.includes(key)) {
                mappedWords.push(value);
            }
        }
        
        for (const [key, value] of Object.entries(categoryMappings)) {
            if (originalMessage.includes(key)) {
                mappedWords.push(value);
            }
        }
        
        // Add individual word mappings
        finalWords.forEach(word => {
            mappedWords.push(word);
            if (branchMappings[word]) {
                mappedWords.push(branchMappings[word]);
            }
            if (categoryMappings[word]) {
                mappedWords.push(categoryMappings[word]);
            }
        });
        
        // Remove duplicates and return
        return [...new Set(mappedWords)];
    }

    static async searchRelevantFiles(keywords) {
        if (!keywords.length) return [];

        try {
            // Score-based search for better relevance
            const files = await File.find({ isActive: { $ne: false } });
            
            const scoredFiles = files.map(file => {
                let score = 0;
                const fileName = (file.fileName || '').toLowerCase();
                const category = (file.fileCatgry || '').toLowerCase();
                const branch = (file.branch || '').toLowerCase();
                const yearSem = (file.yearSem || '').toLowerCase();
                
                // Skip files with missing essential data
                if (!file.fileName || !file.fileCatgry) {
                    return { file, score: 0 };
                }
                
                keywords.forEach(keyword => {
                    const lowerKeyword = keyword.toLowerCase();
                    
                    // Highest priority: exact branch match (database values)
                    if (branch === lowerKeyword) {
                        score += 20;
                    }
                    
                    // Very high priority: exact category match (database values)
                    if (category === lowerKeyword) {
                        score += 15;
                    }
                    
                    // High priority: exact year/semester match
                    if (yearSem === lowerKeyword) {
                        score += 12;
                    }
                    
                    // Medium-high priority: filename contains keyword (minimum 4 chars)
                    if (fileName.includes(lowerKeyword) && lowerKeyword.length >= 4) {
                        score += 10;
                    }
                    
                    // Lower priority: partial matches in filename for shorter terms (3 chars)
                    if (fileName.includes(lowerKeyword) && lowerKeyword.length === 3) {
                        score += 5;
                    }
                });
                
                return { file, score };
            });

            // Filter files with score > 5 and sort by relevance
            const relevantFiles = scoredFiles
                .filter(item => item.score >= 10) // Increased threshold to reduce false positives
                .sort((a, b) => b.score - a.score)
                .slice(0, 6)
                .map(item => item.file);

            return relevantFiles;
        } catch (error) {
            console.error('Error searching files:', error);
            return [];
        }
    }

    static async getHighlyRelevantFiles(keywords, relevantFiles) {
        if (!relevantFiles.length) return [];

        // Re-score the files to filter only highly relevant ones
        const highlyRelevantFiles = [];
        
        relevantFiles.forEach(file => {
            let score = 0;
            let hasStrongMatch = false;
            const fileName = (file.fileName || '').toLowerCase();
            const category = (file.fileCatgry || '').toLowerCase();
            const branch = (file.branch || '').toLowerCase();
            const yearSem = (file.yearSem || '').toLowerCase();
            
            // Skip files with missing essential data
            if (!file.fileName || !file.fileCatgry) {
                return;
            }
            
            keywords.forEach(keyword => {
                const lowerKeyword = keyword.toLowerCase();
                
                // Check for strong matches (exact database field matches)
                if (branch === lowerKeyword) {
                    score += 15;
                    hasStrongMatch = true;
                }
                if (category === lowerKeyword) {
                    score += 12;
                    hasStrongMatch = true;
                }
                if (yearSem === lowerKeyword) {
                    score += 10;
                    hasStrongMatch = true;
                }
                // Only count filename matches if they're substantial (more than 3 chars)
                if (fileName.includes(lowerKeyword) && lowerKeyword.length > 3) {
                    score += 8;
                    hasStrongMatch = true;
                }
            });
            
            // Only include files with high relevance score AND at least one strong match
            if (score >= 10 && hasStrongMatch) {
                highlyRelevantFiles.push(file);
            }
        });

        return highlyRelevantFiles;
    }

    static filterContextuallyRelevantFiles(files, keywords) {
        // Only show files that have very strong contextual relevance
        return files.filter(file => {
            const fileName = (file.fileName || '').toLowerCase();
            const category = (file.fileCatgry || '').toLowerCase();
            const branch = (file.branch || '').toLowerCase();
            const yearSem = (file.yearSem || '').toLowerCase();
            
            let relevanceScore = 0;
            let hasExactMatch = false;
            
            keywords.forEach(keyword => {
                const lowerKeyword = keyword.toLowerCase();
                
                // Exact matches get highest priority
                if (branch === lowerKeyword || category === lowerKeyword || yearSem === lowerKeyword) {
                    hasExactMatch = true;
                    relevanceScore += 10;
                }
                
                // Substantial filename matches (4+ characters)
                if (fileName.includes(lowerKeyword) && lowerKeyword.length >= 4) {
                    relevanceScore += 8;
                    hasExactMatch = true;
                }
            });
            
            // Only return files with exact matches and high relevance
            return hasExactMatch && relevanceScore >= 8;
        }).slice(0, 3); // Limit to top 3 most relevant files
    }

    static createFileAccessKeyboard(files) {
        return files.map(file => [{
            text: `📁 ${file.fileName}`,
            callback_data: `file:${file._id}`
        }]);
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
                await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.lastMessageId).catch(() => { });
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
                await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.lastMessageId).catch(() => { });
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