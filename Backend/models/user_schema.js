const mongoose = require("mongoose");

// User Schema
const UserSchema = new mongoose.Schema({
    
    user_name:
    {
        type: String,
        required:true
    },

    locked_account_name:
    {
        type: String,
        default: null
    },
    
    metamask_wallet_id:
    {
        type: String,
        required:true,
        unique:true
    },
    
    courses_enrolled:[{type:mongoose.Schema.ObjectId ,ref:'Courses'}],
    
    courses_completed:[{type:mongoose.Schema.ObjectId ,ref:'Courses'}],
    
    coins:
    {
        type: Number,
        default: 500
    },
    
    demo_upi_balance:
    {
        type: Number,
        default: 0
    },
    
    inr_balance:
    {
        type: Number,
        default: 0
    },
    
    badge:
    {
        type:String,
        default:"Beginner"
    },  
} , {
    timestamps: true
});

const Users = mongoose.model("Users", UserSchema);

module.exports = Users;

