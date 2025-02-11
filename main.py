from typing import Final
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes


TOKEN: Final = '6560956956:AAGKq89stenDJ86Qy-byS9OCnkt2FTdbuVc'
BOT_USERNAME: Final = '@itigecbot'

# Commands
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('Hey, this is me IT IGEC to help you.')

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('How can I help you!')

async def custom_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('BHAG ** kuch nhi ho rha')

# Responses

def handle_response(text: str) -> str:
    processed = str = text.lower()
    
    if 'hello' or 'hi' in processed:
        return 'bhag tori bahin ke chodo utar jaldi wahan se'    
    
    if 'how are you' in processed:
        return 'I am fine wbu'
    
    if 'i love you' in processed:
        return 'awww..... i love you too!'

    if 'jaldi wahan se hato' in processed:
        return 'Hi there'
    
    return "I don't understand what you said"

# Checking the chat type before replying to the user
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message_type: str = update.message.chat.type
    text = update.message.text

    print(f'User ({update.message.chat.id}) in ({message_type}): "{text}"')

    if message_type == 'group':
        if BOT_USERNAME in text:
            new_text: str = text.replace(BOT_USERNAME, '').strip()
            response: str = handle_response(new_text)
        else:
            return
    else:
        response: str = handle_response(text)

    print('Bot:', response)
    await update.message.reply_text(response)

async def error(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print(f'Update {update} caused error {context.error}')


# if __name__ == '__main__':
#     app = Application(
#         token=TOKEN,
#         application_id='itigecbot',
#         api_url='https://api.telegram.org',
#         app_url='https://api.telegram.org',
#     )

#     app.add_handler(CommandHandler('start', start_command))
#     app.add_handler(CommandHandler('help', help_command))
#     app.add_handler(CommandHandler('custom', custom_command))
#     app.add_handler(MessageHandler(filters.Filters.text, handle_message))
#     app.add_error_handler(error)

#     app.run()


if __name__ == '__main__':
    print('Bot is running...')
    app = Application.builder().token(TOKEN).build()

    #Commands: Add handlers for commands
    app.add_handler(CommandHandler('start', start_command))
    app.add_handler(CommandHandler('help', help_command))
    app.add_handler(CommandHandler('custom', custom_command))

    #Messages: Add handlers for messages
    app.add_handler(MessageHandler(filters.TEXT, handle_message))

    #Errors: Add handlers for errors
    app.add_error_handler(error)

    #Polls the Telegram server for updates
    print('Bot is polling...')
    app.run_polling(poll_interval=3)