const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    admin_name:
    {
        type:String,
        required:true
    },
    
    metamask_wallet_id:
    {
        type: String,
        required:true,
        unique:true
    },
    
    courses_created:[{type:mongoose.Schema.ObjectId ,ref:'Courses'}],
    inr_earnings: {
        type: Number,
        default: 0
    },
    inr_balance: {
        type: Number,
        default: 0
    }
} , {
    timestamps: true
});

const Admins = mongoose.model("Admins", AdminSchema);

module.exports = Admins;