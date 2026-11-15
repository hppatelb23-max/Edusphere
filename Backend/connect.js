const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { restoreAllDatabase, persistAllDatabase } = require('./utils/persistence');
require('dotenv').config();

let mongoServer;

async function ConnectToDB(){
    try{
        mongoServer = new MongoMemoryServer();
        await mongoServer.start();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri);
        console.log("Database connected Successfully (Edusphere local server)");

        // Restore all persistent data (courses, accounts, tests, transactions) from disk
        await restoreAllDatabase();

        // Persist on process shutdown
        const handleShutdown = async () => {
            try {
                await persistAllDatabase();
            } catch (e) {}
            process.exit(0);
        };
        process.on('SIGINT', handleShutdown);
        process.on('SIGTERM', handleShutdown);
    }
    catch(error){
        console.log("Error connecting to database:", error.message);
    }
}

module.exports = ConnectToDB;