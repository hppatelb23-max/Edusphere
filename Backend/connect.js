const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

let mongoServer;

async function ConnectToDB(){
    try{
        // Use in-memory MongoDB for local development
        mongoServer = new MongoMemoryServer();
        await mongoServer.start();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri);
        console.log("Database connected Successfully (in-memory MongoDB)");
        console.log("MongoDB URI:", mongoUri);
    }
    catch(error){
        console.log("Error connecting to database:", error.message);
    }
}

module.exports = ConnectToDB;