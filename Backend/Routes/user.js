const express = require('express')
const {VerifyUser , CreateUser , DisplayMyLearning , DisplayTransactionHistory , PurchaseCourse , GetCoins , UpdateCoins} = require('../Controllers/user')
// DisplayStore

const {allow_login_user} = require("../Middlewares/login_user")

const user_router = express.Router()


user_router.post('/login' , VerifyUser)
user_router.post('/add-details' , CreateUser)
user_router.get("/my-learning" , allow_login_user , DisplayMyLearning)
user_router.get("/transaction-history" , allow_login_user , DisplayTransactionHistory)
user_router.post("/purchase-course" , allow_login_user, PurchaseCourse)
user_router.get("/redeem" ,allow_login_user, GetCoins)
user_router.post("/redeem" ,allow_login_user, UpdateCoins)


module.exports = user_router;

// DisplayUserLoginPage
// DisplayUserSignupPage
// DisplayCourses