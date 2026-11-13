const express = require('express')
const {
    VerifyUser,
    CreateUser,
    DisplayMyLearning,
    DisplayTransactionHistory,
    DisplayEducatorTransactions,
    CheckUpiPaymentStatus,
    PurchaseCourse,
    HandlePaymentErrorAndRefund,
    GetCoins,
    UpdateCoins,
    GetPendingPayments,
    ApprovePayment,
    RejectPayment,
    CreateRazorpayOrder,
    VerifyRazorpayPayment,
    RazorpayWebhookHandler,
    GetDemoUpiBalance,
    AddDemoUpiCash
} = require('../Controllers/user')

const { allow_login_user, optional_login_user } = require("../Middlewares/login_user")

const user_router = express.Router()

user_router.post('/login', VerifyUser)
user_router.post('/add-details', CreateUser)
user_router.get("/my-learning", allow_login_user, DisplayMyLearning)
user_router.get("/transaction-history", allow_login_user, DisplayTransactionHistory)
user_router.get("/educator-transactions", optional_login_user, DisplayEducatorTransactions)
user_router.get("/check-upi-payment", optional_login_user, CheckUpiPaymentStatus)
user_router.post("/purchase-course", optional_login_user, PurchaseCourse)
user_router.post("/payment-error-refund", optional_login_user, HandlePaymentErrorAndRefund)
user_router.get("/redeem", allow_login_user, GetCoins)
user_router.post("/redeem", allow_login_user, UpdateCoins)

// ─── DEMO UPI CASH (FAKE INDIAN RUPEES) ──────────────────────────────────────
user_router.get("/demo-upi-balance", optional_login_user, GetDemoUpiBalance)
user_router.post("/demo-upi-add-cash", optional_login_user, AddDemoUpiCash)

// ─── RAZORPAY UPI AUTOMATIC PAYMENT & VERIFICATION ROUTES ───────────────────
user_router.post("/razorpay-create-order", optional_login_user, CreateRazorpayOrder)
user_router.post("/razorpay-verify", optional_login_user, VerifyRazorpayPayment)
user_router.post("/razorpay-webhook", RazorpayWebhookHandler)

// ─── ADMIN / EDUCATOR PAYMENT MANAGEMENT ROUTES ──────────────────────────────
user_router.get("/payments", optional_login_user, GetPendingPayments)
user_router.post("/payments/approve", optional_login_user, ApprovePayment)
user_router.post("/payments/reject", optional_login_user, RejectPayment)

module.exports = user_router;

// DisplayUserLoginPage
// DisplayUserSignupPage
// DisplayCourses