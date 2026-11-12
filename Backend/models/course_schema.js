const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
    title:
    {
        type: String,
        required:true,
    } , 
    description:
    {
        type: String,
        required:true
    },
    author_name:
    {
        type: String,
        required:true
    },
    author_wallet_id:{
        type:String,
        required:true
    },
    category:
    [{
        type: String,
        required:true
    }],
    course_points:
    {
        type: Number,
        default:100
    },
    
    course_price:
    {
        type: Number,
        required:true
    },
    
    buy_count:
    {
        type: Number,
        default:0
    },
    course_image:{
        type: String,
        required:true
    },
    course_video:[{
        type: String,
        required:true
    }]
} , {
    timestamps: true
});

const Courses = mongoose.model("Courses", CourseSchema);

module.exports = Courses;