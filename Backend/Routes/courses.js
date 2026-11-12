const express = require("express");
const {
    DisplayCourses,
    UploadCourse,
    GetCourseById,
    AddVideoToCourse,
    DeleteVideoFromCourse,
    UploadMedia
} = require("../Controllers/courses");
const { allow_login_admin } = require("../Middlewares/login_user");

const course_router = express.Router();

course_router.get("/", DisplayCourses);
course_router.post("/upload-media", UploadMedia);
course_router.get("/:id", GetCourseById);
course_router.post("/", allow_login_admin, UploadCourse);
course_router.post("/:id/videos", AddVideoToCourse);
course_router.delete("/:id/videos", DeleteVideoFromCourse);

module.exports = course_router;
