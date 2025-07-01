const mongoose = require('mongoose');

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
    fileType: {
        type: String,
        required: true,
        enum: ['document', 'photo', 'video', 'audio', 'unknown']
    },
    uploadedBy: {
        userId: {
            type: Number,
            required: true
        },
        username: String
    },
    yearSem: {
        type: String,
        required: true,
        enum: ['1', '2', '3', '4']
    },
    branch: {
        type: String,
        required: true,
        enum: ['it', 'ec', 'ee', 'me', 'ce', 'maths', 'chem', 'phy', 'eng']
    },
    fileCatgry: {
        type: String,
        required: true,
        enum: ['books', 'notes', 'qp', 'qb']
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    downloads: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    collection: 'files'
});

// Add indexes for better query performance
fileSchema.index({ yearSem: 1, branch: 1, fileCatgry: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ fileName: 'text', fileCatgry: 'text' });

// Instance methods
fileSchema.methods.incrementDownloads = function() {
    this.downloads += 1;
    return this.save();
};

// Static methods
fileSchema.statics.findByCategory = function(yearSem, branch, fileCatgry) {
    const query = { yearSem, branch, isActive: true };
    if (fileCatgry !== 'all') {
        query.fileCatgry = fileCatgry;
    }
    return this.find(query).sort({ uploadedAt: -1 });
};

fileSchema.statics.getFileStats = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        { $group: {
            _id: { yearSem: '$yearSem', branch: '$branch', fileCatgry: '$fileCatgry' },
            count: { $sum: 1 },
            totalDownloads: { $sum: '$downloads' }
        }},
        { $sort: { '_id.yearSem': 1, '_id.branch': 1, '_id.fileCatgry': 1 } }
    ]);
};

module.exports = mongoose.model('File', fileSchema);