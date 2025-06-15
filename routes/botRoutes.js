const BotController = require('../controllers/botController');

class BotRoutes {
    static setupRoutes(bot, config) {
        // Command handlers
        bot.command('start', BotController.handleStart);
        bot.command(`${process.env.uplCmd}`, BotController.handleUpload);
        bot.command('get', BotController.handleGet);
        bot.command(`${process.env.statsCmd}`, (ctx) => BotController.handleStats(ctx));
        bot.command('submit', (ctx) => BotController.handleSubmit(ctx, config));

        // Callback query handlers
        bot.action(/listYearSem:(.+)/, BotController.handleYearSelection);
        bot.action(/listBranch:(.+)/, BotController.handleBranchSelection);
        bot.action(/listCategory:(.+)/, BotController.handleCategorySelection);
        bot.action(/fileOptions:(.+)/, BotController.handleFileOptions);
        bot.action('backToMenu', BotController.handleBackToMenu);
        bot.action(/file:(.+)/, BotController.handleFileDownload);

        // Message handlers
        bot.on('text', BotController.handleTextMessage);

        // Media message handler (for blocking uploads)
        bot.on(['document', 'photo', 'video', 'audio'], BotController.handleMediaMessage);
    }
}

module.exports = BotRoutes;