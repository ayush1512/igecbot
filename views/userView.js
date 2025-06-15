class UserView {
    static welcomeMessage(firstName) {
        return `*🎉 Welcome ${firstName}!* \n*📥 Use /get to search and download files.*`;
    }

    static statsMessage(totalUsers, totalInteractions, stats) {
        let message = '*📊 Bot Statistics*\n\n';
        message += `*Total Users:* ${totalUsers}\n`;
        message += `*Total Interactions:* ${totalInteractions}\n\n`;
        message += '*👥 User Interactions:*\n';

        stats.forEach(user => {
            const name = user.firstName || user.username || 'Unknown';
            message += `- ${name}: ${user.interactions} interactions\n`;
        });

        return message;
    }

    static statsErrorMessage() {
        return '*❌ Error generating statistics*';
    }

    static submitMessage(firstName) {
        return `*👋 Hey! ${firstName} thanks for taking an initiative*\n` +
               `*📤 To submit files, contact admin*\n\n` +
               '*📝 Please include:*\n' +
               '📚 Year and Branch\n' +
               '📖 Subject/Topic\n' +
               '📁 File type (Notes/QB/etc.)';
    }

    static submitKeyboard(ownerUsername) {
        return {
            inline_keyboard: [
                [{
                    text: '📤 Submit Files',
                    url: `https://t.me/${ownerUsername}`
                }]
            ]
        };
    }

    static submitUnavailableMessage() {
        return '*❌ Sorry, file submission is currently unavailable.*';
    }

    static invalidTextMessage() {
        return '*😔 Sorry! I cannot accept messages or files.\n📥 Use /get to access files or /submit to share files.*';
    }

    static invalidCommandMessage() {
        return '*❌ Invalid command!\n📥 Available commands: /get (access files) and /submit (share files)*';
    }

    static uploadNotAllowedMessage() {
        return '*❌ Sorry! File uploads are not allowed.\n📥 Please use /get command to access available files.*';
    }

    static errorMessage() {
        return '*❌ An error occurred while processing your request.*';
    }
}

module.exports = UserView;