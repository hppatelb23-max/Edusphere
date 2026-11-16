const express = require('express');
const {
    DisplayTests,
    GetTestById,
    CreateTest,
    SubmitTest,
    GetEducatorSubmissions,
    GetMySubmissions,
    DeleteTest,
    DeleteSubmission,
    DeleteSubmissionRecording,
    ClearAllSubmissions,
    GenerateQuestionsFromNotes,
    ExtractDocumentText
} = require("../Controllers/tests");

const router = express.Router();

router.post("/extract-document", ExtractDocumentText);
router.post("/generate-from-notes", GenerateQuestionsFromNotes);
router.get("/submissions/all", GetEducatorSubmissions);
router.get("/submissions/my", GetMySubmissions);
router.delete("/submissions/recording/:submission_id", DeleteSubmissionRecording);
router.delete("/submissions/:submission_id", DeleteSubmission);
router.post("/submissions/clear", ClearAllSubmissions);
router.get("/", DisplayTests);
router.get("/:id", GetTestById);
router.post("/create", CreateTest);
router.post("/submit", SubmitTest);
router.delete("/:id", DeleteTest);

module.exports = router;

