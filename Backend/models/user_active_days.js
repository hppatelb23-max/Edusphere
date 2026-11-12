const mongoose = require('mongoose');

const UserActiveDaysSchema = new mongoose.Schema({
    
    user_id:
    {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required:true
    },
    
    counter:
    {
        type: Number,
        default: 0
    },
    
    active_date:
    {
        type: Date,
        default: Date.now
    }
} , {
    timestamps: true
});

const UserActiveDays = mongoose.model("UserActiveDays", UserActiveDaysSchema);

module.exports = UserActiveDays;