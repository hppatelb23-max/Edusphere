const mongoose = require("mongoose");

// User Schema
const UserSchema = new mongoose.Schema({
    
    user_name:
    {
        type: String,
        required:true
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
        default:100
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

