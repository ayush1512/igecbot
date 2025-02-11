import os
import logging
from fastapi import FastAPI, Request
from pymongo import MongoClient
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup, InlineQueryResultArticle, InputTextMessageContent
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, InlineQueryHandler, filters
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Initialize FastAPI
app = FastAPI()

# Load Environment Variables
load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
MONGO_URI = os.getenv("MONGO_URI")

# Initialize Telegram Bot
logging.info("Initializing Telegram Bot")
application = Application.builder().token(TOKEN).build()

# Connect to MongoDB
logging.info("Connecting to MongoDB")
client = MongoClient(MONGO_URI)
db = client["telegram_bot"]
files_collection = db["files"]

# Save File in MongoDB
def save_file(file_id, name, category):
    logging.info(f"Saving file: {name} with ID: {file_id} in category: {category}")
    files_collection.insert_one({"file_id": file_id, "name": name, "category": category})

# Fetch Files from MongoDB
def fetch_files(category=None, query=None):
    logging.info(f"Fetching files with category: {category} or query: {query}")
    if category:
        return list(files_collection.find({"category": category}, {"_id": 0, "file_id": 1, "name": 1}))
    elif query:
        return list(files_collection.find({"name": {"$regex": query, "$options": "i"}}, {"_id": 0, "file_id": 1, "name": 1}))
    return []

# Handle /start Command
def start(update: Update, context):
    logging.info("Received /start command")
    update.message.reply_text("Welcome! Use /upload to send files or /search to find them.")

# Handle File Upload
def handle_document(update: Update, context):
    file = update.message.document
    file_id = file.file_id
    file_name = file.file_name
    category = "documents"  # Default category, can be changed dynamically
    
    logging.info(f"Handling document upload: {file_name} with ID: {file_id}")
    save_file(file_id, file_name, category)
    update.message.reply_text(f"File '{file_name}' saved successfully!")

# Send File Categories as Inline Buttons
def show_categories(update: Update, context):
    logging.info("Showing file categories")
    keyboard = [
        [InlineKeyboardButton("📁 Documents", callback_data='documents')],
        [InlineKeyboardButton("🎵 Music", callback_data='music')],
        [InlineKeyboardButton("📷 Images", callback_data='images')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    update.message.reply_text("Select a category:", reply_markup=reply_markup)

# Handle Inline Button Clicks
def button_click(update: Update, context):
    query = update.callback_query
    query.answer()
    
    category = query.data
    logging.info(f"Button clicked for category: {category}")
    files = fetch_files(category=category)
    
    if files:
        for file in files:
            query.message.reply_document(file["file_id"], caption=file["name"])
    else:
        query.message.reply_text("No files found in this category.")

# Inline Search Functionality
def inline_search(update: Update, context):
    query = update.inline_query.query
    if not query:
        return

    logging.info(f"Inline search query: {query}")
    results = [
        InlineQueryResultArticle(
            id=file["file_id"],
            title=file["name"],
            input_message_content=InputTextMessageContent(f"Here’s your file: {file['name']}")
        )
        for file in fetch_files(query=query)
    ]

    update.inline_query.answer(results)

# Register Handlers
logging.info("Registering handlers")
application.add_handler(CommandHandler("start", start))
application.add_handler(CommandHandler("categories", show_categories))
application.add_handler(MessageHandler(filters.Document.ALL, handle_document))
application.add_handler(CallbackQueryHandler(button_click))
application.add_handler(InlineQueryHandler(inline_search))

# Webhook Endpoint
@app.post("/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()
    update = Update.de_json(data, application.bot)
    await application.update_queue.put(update)
    logging.info("Webhook received and processed")
    return {"status": "ok"}

# Health Check Route
@app.get("/")
def home():
    logging.info("Health check route accessed")
    return {"message": "Telegram Bot is Running!"}

# Shutdown Event Handler
@app.on_event("shutdown")
async def shutdown_event():
    logging.info("Shutting down application")
    await application.shutdown()
