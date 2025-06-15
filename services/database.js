const mongoose = require('mongoose');

class Database {
    static async connect(mongoUri) {
        try {
            await mongoose.connect(mongoUri);
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }

    static async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
        }
    }
}

module.exports = Database;