const express = require('express')
const {CreateAdmin , VerifyAdmin , GetCourses , DeleteCourse , AddCourse} = require('../Controllers/admin');
const {allow_login_admin } = require('../Middlewares/login_user');

const admin_router = express.Router()

admin_router.post("/add-details" , CreateAdmin);
admin_router.post('/login' , VerifyAdmin);
admin_router.get("/get-courses", allow_login_admin , GetCourses);
admin_router.post("/delete-course" ,allow_login_admin, DeleteCourse);
admin_router.post("/add-course" ,allow_login_admin, AddCourse);

module.exports = admin_router;