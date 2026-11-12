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
} , {
    timestamps: true
});

const Admins = mongoose.model("Admins", AdminSchema);

module.exports = Admins;