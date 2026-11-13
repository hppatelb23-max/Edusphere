const express = require('express')
const {CreateAdmin , VerifyAdmin , GetCourses , DeleteCourse , AddCourse, GetAdminEarnings} = require('../Controllers/admin');
const {GetPendingPayments, ApprovePayment, RejectPayment} = require('../Controllers/user');
const {allow_login_admin } = require('../Middlewares/login_user');

const admin_router = express.Router()

admin_router.post("/add-details" , CreateAdmin);
admin_router.post('/login' , VerifyAdmin);
admin_router.get("/get-courses", allow_login_admin , GetCourses);
admin_router.post("/delete-course" ,allow_login_admin, DeleteCourse);
admin_router.post("/add-course" ,allow_login_admin, AddCourse);
admin_router.get("/inr-earnings", GetAdminEarnings);

// ─── UPI Payment Management ───────────────────────────────────────────────────
admin_router.get("/payments", allow_login_admin, GetPendingPayments);
admin_router.post("/payments/approve", allow_login_admin, ApprovePayment);
admin_router.post("/payments/reject", allow_login_admin, RejectPayment);

module.exports = admin_router;