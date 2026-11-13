const express = require('express')
const cors = require('cors')

require('dotenv').config();

const ConnectToDB = require("./connect")

const user_router = require("./Routes/user")
const admin_router = require("./Routes/admin")
const course_router = require("./Routes/courses")
const test_router = require("./Routes/tests")

const path = require('path')
const fs = require('fs')

const app = express()

ConnectToDB()    // Establishing connection with the DataBase

// Ensure uploads folder exists and is statically served
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}
app.use('/uploads', express.static(uploadsDir))

// Setting up middleware for parsing the request body and allowing the client to make the request
app.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-wallet-address', 'x-requested-with', 'Accept'],
}));
app.options('*', cors());
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))


//routes
app.use("/user" , user_router)
app.use("/admin" , admin_router)
app.use('/courses' , course_router)
app.use('/tests' , test_router)

app.listen(process.env.PORT , ()=>{console.log(`Sever started at port ${process.env.PORT}`)})