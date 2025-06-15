class FileView {
    static welcomeMessage(firstName) {
        return `*🎉 Welcome ${firstName}!* \n*📥 Use /get to search and download files.*`;
    }

    static uploadPromptMessage() {
        return '*📤 Please send me the file you want to upload.*';
    }

    static uploadSuccessMessage() {
        return '*✅ File saved successfully!*\n*📥 Use /get to access and categorize your files.*';
    }

    static uploadErrorMessage() {
        return '*❌ Sorry, there was an error handling your file upload.*';
    }

    static yearSelectionMessage() {
        return '*📚 Select Year:*';
    }

    static yearSelectionKeyboard() {
        return {
            inline_keyboard: [
                [{ text: '1️⃣', callback_data: 'listYearSem:1' }],
                [{ text: '2️⃣', callback_data: 'listYearSem:2' }],
                [{ text: '3️⃣', callback_data: 'listYearSem:3' }],
                [{ text: '4️⃣', callback_data: 'listYearSem:4' }]
            ]
        };
    }

    static branchSelectionMessage() {
        return '*📑 Select Branch:*';
    }

    static getBranchKeyboard(yearSem) {
        return yearSem === '1' ? {
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
    }

    static categorySelectionMessage() {
        return '*📑 Select Category:*';
    }

    static categorySelectionKeyboard() {
        return {
            inline_keyboard: [
                [{ text: '📚 Books', callback_data: 'listCategory:books' }],
                [{ text: '📝 Notes', callback_data: 'listCategory:notes' }],
                [{ text: '📄 Question Papers', callback_data: 'listCategory:qp' }],
                [{ text: '📑 Shivani QB', callback_data: 'listCategory:qb' }],
                [{ text: '📂 All Files', callback_data: 'listCategory:all' }]
            ]
        };
    }

    static sessionExpiredMessage() {
        return '*⌛ Session expired. Please start over with /get command 🔄*';
    }

    static noFilesFoundMessage(category, yearSem, branch) {
        return `*❌ No files found in ${category} for Year ${yearSem} - ${branch.toUpperCase()} 📂*`;
    }

    static createFileListKeyboard(files, fileCatgry) {
        return files.map((file) => [{
            text: fileCatgry === 'all' ? 
                `📁 ${file.fileName} (${file.fileCatgry})` : 
                `📁 ${file.fileName}`,
            callback_data: `fileOptions:${file._id}`
        }]);
    }

    static fileListMessage(categoryDisplay, yearSem, branch) {
        return `*📂 ${categoryDisplay} (Year ${yearSem} - ${branch.toUpperCase()}):*`;
    }

    static fileOptionsMessage(fileName) {
        return `*📁 File: ${fileName}*`;
    }

    static fileOptionsKeyboard(fileId) {
        return {
            inline_keyboard: [
                [{ text: '📥 Download', callback_data: `file:${fileId}` }],
                [{ text: '🔙 Back to Menu', callback_data: 'backToMenu' }]
            ]
        };
    }

    static fileNotFoundMessage() {
        return '*❌ File not found*';
    }

    static unsupportedFileTypeMessage() {
        return '*Unsupported file type.*';
    }

    static fileRetrievalErrorMessage() {
        return '*❌ Sorry, there was an error retrieving the file*';
    }

    static fetchErrorMessage() {
        return '*❌ Sorry, there was an error fetching your files.\n🔄 Please try again with /get command*';
    }

    static backToMenuErrorMessage() {
        return '*❌ Please use /get command to start over*';
    }

    static errorMessage() {
        return '*❌ Sorry, there was an error processing your request.*';
    }
}

module.exports = FileView;