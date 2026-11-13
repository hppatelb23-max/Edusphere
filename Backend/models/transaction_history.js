const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    user_id: {type: mongoose.Schema.ObjectId, ref: "Users"},

    student_name: {
        type: String,
        default: "Student"
    },

    student_wallet: {
        type: String,
        default: ""
    },

    educator_name: {
        type: String,
        default: ""
    },

    educator_wallet: {
        type: String,
        default: ""
    },

    courses_purchased: {type: mongoose.Schema.ObjectId, ref: "Courses"}, 

    transaction_address : {
        type : String ,
        required : true
    },

    bank_utr: {
        type: String,
        default: null
    },

    blockchain_hash: {
        type: String,
        default: null
    },

    payment_method: {
        type: String,
        default: "ETH"
    },

    amount: {
        type: Number,
        default: 0
    },

    currency: {
        type: String,
        default: "ETH"
    },

    status: {
        type: String,
        default: "SUCCESS" // "SUCCESS", "FAILED", "REFUND_INITIATED", "REFUNDED"
    },

    refund_status: {
        type: String,
        default: null
    },

    refund_amount: {
        type: Number,
        default: 0
    },

    error_message: {
        type: String,
        default: null
    },

    purchased_date: 
    {
        type: Date, 
        default: Date.now
    }
}, {
    timestamps: true
});

const Transactions = mongoose.model("Transactions", TransactionSchema);

module.exports = Transactions;