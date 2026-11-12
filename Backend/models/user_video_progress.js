const mongoose = require('mongoose');

const UserVideoProgressSchema = new mongoose.Schema({

});

const UserVideoProgress = mongoose.model("UserVideoProgress", UserVideoProgressSchema);

module.exports = UserVideoProgress;
