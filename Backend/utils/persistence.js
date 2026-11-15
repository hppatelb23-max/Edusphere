const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../persisted_data');

if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
        console.warn('Could not create persisted_data directory:', e.message);
    }
}

function getFilePath(collectionName) {
    return path.join(DATA_DIR, `${collectionName}.json`);
}

function saveCollection(collectionName, data) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const filePath = getFilePath(collectionName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.warn(`Failed to persist collection ${collectionName}:`, err.message);
    }
}

function loadCollection(collectionName) {
    try {
        const filePath = getFilePath(collectionName);
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
        console.warn(`Failed to read persisted collection ${collectionName}:`, err.message);
        return null;
    }
}

// Persist specific collection from Mongoose Model to disk
async function persistModel(collectionName, Model) {
    try {
        if (!Model) return;
        const docs = await Model.find({}).lean();
        saveCollection(collectionName, docs);
    } catch (err) {
        console.warn(`Error persisting model ${collectionName}:`, err.message);
    }
}

// Restore collection from disk into Mongoose Model upon restart
async function restoreModel(collectionName, Model) {
    try {
        if (!Model) return 0;
        const data = loadCollection(collectionName);
        if (!data || data.length === 0) return 0;

        let restoredCount = 0;
        for (const item of data) {
            if (!item || !item._id) continue;
            try {
                await Model.findByIdAndUpdate(item._id, item, { upsert: true, new: true, setDefaultsOnInsert: true });
                restoredCount++;
            } catch (itemErr) {
                // If ID is malformed, try findOne by unique field or create
                try {
                    const fallbackQuery = item.metamask_wallet_id ? { metamask_wallet_id: item.metamask_wallet_id } :
                                          item.title ? { title: item.title } : { _id: item._id };
                    await Model.findOneAndUpdate(fallbackQuery, item, { upsert: true, new: true });
                    restoredCount++;
                } catch (e) {}
            }
        }
        return restoredCount;
    } catch (err) {
        console.warn(`Error restoring model ${collectionName}:`, err.message);
        return 0;
    }
}

// Restore all database collections from disk upon backend launch
async function restoreAllDatabase() {
    try {
        const Courses = require('../models/course_schema');
        const Users = require('../models/user_schema');
        const Admins = require('../models/admin_schema');
        const Transactions = require('../models/transaction_history');
        const Tests = require('../models/test_schema');

        console.log("Restoring persistent state from disk...");
        const restoredCourses = await restoreModel('courses', Courses);
        const restoredUsers = await restoreModel('users', Users);
        const restoredAdmins = await restoreModel('admins', Admins);
        const restoredTx = await restoreModel('transactions', Transactions);
        const restoredTests = await restoreModel('tests', Tests);

        console.log(`Persistent restoration complete: courses (${restoredCourses}), users (${restoredUsers}), admins (${restoredAdmins}), transactions (${restoredTx}), tests (${restoredTests}).`);
    } catch (err) {
        console.warn("Could not complete database restoration from disk:", err.message);
    }
}

// Persist all database collections to disk
async function persistAllDatabase() {
    try {
        const Courses = require('../models/course_schema');
        const Users = require('../models/user_schema');
        const Admins = require('../models/admin_schema');
        const Transactions = require('../models/transaction_history');
        const Tests = require('../models/test_schema');

        await persistModel('courses', Courses);
        await persistModel('users', Users);
        await persistModel('admins', Admins);
        await persistModel('transactions', Transactions);
        await persistModel('tests', Tests);
    } catch (err) {
        console.warn("Could not complete database persistence to disk:", err.message);
    }
}

module.exports = {
    saveCollection,
    loadCollection,
    persistModel,
    restoreModel,
    restoreAllDatabase,
    persistAllDatabase
};
