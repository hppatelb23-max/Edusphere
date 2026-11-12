const mongoose = require("mongoose");

const QuestionSubSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    options: [{
        type: String,
        required: true,
    }],
    correct_option: {
        type: Number,
        required: true,
    },
    explanation: {
        type: String,
        default: "",
    }
}, { _id: true });

const SubmissionSubSchema = new mongoose.Schema({
    student_wallet_id: {
        type: String,
        required: true,
    },
    student_name: {
        type: String,
        default: "",
    },
    score_percentage: {
        type: Number,
        required: true,
    },
    correct_answers: {
        type: Number,
        required: true,
    },
    wrong_answers: {
        type: Number,
        required: true,
    },
    total_questions: {
        type: Number,
        required: true,
    },
    passed: {
        type: Boolean,
        required: true,
    },
    recording_id: {
        type: String,
        default: "",
    },
    proctor_logs: [{
        time: String,
        reason: String,
        alert: String,
        timestamp: { type: Date, default: Date.now }
    }],
    submitted_at: {
        type: Date,
        default: Date.now,
    },
    answers: [{
        question_id: String,
        question: String,
        options: [String],
        selected_option: Number,
        correct_option: Number,
        is_correct: Boolean,
        explanation: String
    }]
}, { _id: true });

const TestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    author_name: {
        type: String,
        default: "Edusphere Faculty",
    },
    author_wallet_id: {
        type: String,
        required: true,
    },
    category: [{
        type: String,
        required: true,
    }],
    difficulty: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Intermediate",
    },
    duration_minutes: {
        type: Number,
        default: 15,
    },
    passing_score: {
        type: Number,
        default: 60, // percentage
    },
    pick_random_count: {
        type: Number,
        default: 5,
    },
    attempts_count: {
        type: Number,
        default: 0,
    },
    questions: [QuestionSubSchema],
    submissions: [SubmissionSubSchema],
    created_at: {
        type: Date,
        default: Date.now,
    }
});

const Tests = mongoose.model("Tests", TestSchema);
module.exports = Tests;

