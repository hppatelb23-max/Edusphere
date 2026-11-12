import axios from "axios";
import { API_BASE_URL } from "./api";
import { deleteProctorRecording, clearAllProctorRecordings } from "./proctorRecordingDB";
import {
  dummySampleTests,
  getStoredTests,
  saveCustomTest,
  getRandomQuestionsForTest,
  gradeTestSubmissionLocally,
  getStoredSubmissions,
  saveSubmissionLocally
} from "./dummyTests";

export const fetchAllTests = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/tests`, { timeout: 4000 });
    if (res.data?.tests && Array.isArray(res.data.tests) && res.data.tests.length > 0) {
      // Merge backend tests with any locally created custom tests
      const local = getStoredTests();
      const backendIds = new Set(res.data.tests.map(t => t._id));
      const combined = [...res.data.tests, ...local.filter(t => !backendIds.has(t._id))];
      return combined;
    }
  } catch (err) {
    console.warn("Backend /tests not reachable, using offline question banks:", err.message);
  }
  return getStoredTests();
};

export const fetchTestById = async (id, randomize = false) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/tests/${id}?randomize=${randomize}`, { timeout: 4000 });
    if (res.data?.test) {
      return res.data.test;
    }
  } catch (err) {
    console.warn(`Backend /tests/${id} not reachable, searching local store:`, err.message);
  }

  const all = getStoredTests();
  const found = all.find(t => String(t._id) === String(id)) || all[0];
  if (!found) return null;

  if (randomize) {
    const sampleQuestions = getRandomQuestionsForTest(found, found.pick_random_count || 5);
    return {
      ...found,
      questions: sampleQuestions
    };
  }
  return found;
};

export const createNewTest = async (testData) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/tests/create`, testData, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000
    });
    if (res.status === 201 && res.data?.test) {
      // Also cache in local storage
      saveCustomTest(res.data.test);
      return { success: true, test: res.data.test, message: res.data.message };
    }
  } catch (err) {
    console.warn("Backend create test failed or offline, saving to local storage:", err.message);
  }

  // Graceful local fallback
  const saved = saveCustomTest(testData);
  return {
    success: true,
    test: saved,
    message: "Test successfully created and saved to question bank!"
  };
};

export const submitTestAnswers = async (submissionData) => {
  const { test_id, student_wallet_id, answers } = submissionData;
  try {
    const res = await axios.post(`${API_BASE_URL}/tests/submit`, submissionData, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000
    });
    if (res.status === 200 && res.data?.result) {
      // Save locally too so educator gradebook updates immediately
      saveSubmissionLocally({
        test_id: test_id,
        test_title: res.data.result.test_title,
        student_wallet_id: student_wallet_id,
        student_name: submissionData.student_name || "",
        score_percentage: res.data.result.score_percentage,
        correct_answers: res.data.result.correct_answers,
        wrong_answers: res.data.result.wrong_answers,
        total_questions: res.data.result.total_questions,
        passed: res.data.result.passed,
        passing_score: res.data.result.passing_score,
        recording_id: submissionData.recording_id || res.data.result.recording_id || "",
        proctor_logs: submissionData.proctor_logs || res.data.result.proctor_logs || [],
        detailed_review: res.data.result.detailed_review
      });
      return { success: true, result: res.data.result };
    }
  } catch (err) {
    console.warn("Backend submit test failed, grading offline:", err.message);
  }

  // Offline grading
  const all = getStoredTests();
  const test = all.find(t => String(t._id) === String(test_id));
  if (test) {
    const localResult = gradeTestSubmissionLocally(test, answers, student_wallet_id);
    // Enrich local result with recording and proctor logs
    localResult.recording_id = submissionData.recording_id || "";
    localResult.proctor_logs = submissionData.proctor_logs || [];
    localResult.student_name = submissionData.student_name || "";
    saveSubmissionLocally(localResult);
    return { success: true, result: localResult };
  }

  return { success: false, error: "Unable to find test to evaluate answers." };
};

export const fetchMySubmissions = async (studentWallet) => {
  if (!studentWallet) return [];
  try {
    const res = await axios.get(
      `${API_BASE_URL}/tests/submissions/my?student_wallet=${studentWallet}`,
      { timeout: 4000 }
    );
    if (res.data?.submissions && Array.isArray(res.data.submissions)) {
      return res.data.submissions;
    }
  } catch (err) {
    console.warn("Backend /submissions/my not reachable, using local filter:", err.message);
  }
  // Local fallback: filter stored submissions by wallet address
  return getStoredSubmissions().filter(
    (s) => s.student_wallet_id && s.student_wallet_id.toLowerCase() === studentWallet.toLowerCase()
  );
};

export const fetchEducatorSubmissions = async (educatorWallet) => {
  try {
    const url = educatorWallet
      ? `${API_BASE_URL}/tests/submissions/all?educator_wallet=${educatorWallet}`
      : `${API_BASE_URL}/tests/submissions/all`;
    const res = await axios.get(url, { timeout: 4000 });
    if (res.data?.submissions && Array.isArray(res.data.submissions) && res.data.submissions.length > 0) {
      // Merge with local submissions
      const local = getStoredSubmissions();
      const backendIds = new Set(res.data.submissions.map(s => s.submission_id || s._id));
      return [...res.data.submissions, ...local.filter(s => !backendIds.has(s.submission_id))];
    }
  } catch (err) {
    console.warn("Backend submissions failed, loading local gradebook:", err.message);
  }
  return getStoredSubmissions();
};


export const deleteTest = async (testId, educatorWallet) => {
  const LOCAL_STORAGE_TESTS_KEY = "edusphere_tests_v2";
  const removeLocal = () => {
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TESTS_KEY) || "[]");
      const updated = local.filter(t => String(t._id) !== String(testId));
      localStorage.setItem(LOCAL_STORAGE_TESTS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };
  try {
    const res = await axios.delete(`${API_BASE_URL}/tests/${testId}`, {
      data: { educator_wallet: educatorWallet },
      timeout: 5000
    });
    if (res.status === 200) {
      removeLocal();
      return { success: true };
    }
  } catch (err) {
    console.warn("Delete test backend failed, removing locally:", err.message);
    removeLocal();
    return { success: true, offlineOnly: true };
  }
  return { success: false };
};

const LOCAL_STORAGE_SUBMISSIONS_KEY = "edusphere_test_submissions_v1";

/**
 * Delete a single student's submission record and associated proctor recording
 */
export const deleteStudentSubmission = async (submissionId, recordingId) => {
  // 1. Delete webcam video recording from IndexedDB/memory
  if (recordingId) {
    try {
      await deleteProctorRecording(recordingId);
    } catch (e) {
      console.warn("Failed to delete recording:", e);
    }
  }

  // 2. Remove from browser localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBMISSIONS_KEY) || "[]";
    const parsed = JSON.parse(raw);
    const updated = parsed.filter(
      (s) => String(s.submission_id || s._id) !== String(submissionId)
    );
    localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to delete local submission:", err);
  }

  // 3. Delete from backend if running
  try {
    const res = await axios.delete(`${API_BASE_URL}/tests/submissions/${submissionId}`, { timeout: 4000 });
    return { success: true, message: res.data?.message || "Record deleted." };
  } catch (err) {
    console.warn("Backend submission delete failed (handled locally):", err.message);
    return { success: true, message: "Record deleted from local history." };
  }
};

/**
 * Delete only the video recording for a submission, keeping the score history intact
 */
export const deleteStudentRecordingOnly = async (submissionId, recordingId) => {
  if (recordingId) {
    try {
      await deleteProctorRecording(recordingId);
    } catch (e) {
      console.warn("Failed to delete proctor recording:", e);
    }
  }

  // Update in localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBMISSIONS_KEY) || "[]";
    const parsed = JSON.parse(raw);
    const updated = parsed.map((s) => {
      if (String(s.submission_id || s._id) === String(submissionId)) {
        return { ...s, recording_id: "" };
      }
      return s;
    });
    localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to update local submission:", err);
  }

  // Update in backend
  try {
    const res = await axios.delete(`${API_BASE_URL}/tests/submissions/recording/${submissionId}`, { timeout: 4000 });
    return { success: true, message: res.data?.message || "Recording removed." };
  } catch (err) {
    console.warn("Backend recording delete failed:", err.message);
    return { success: true, message: "Recording removed." };
  }
};

/**
 * Clear all submissions history and recordings for an educator
 */
export const clearAllStudentSubmissions = async (educatorWallet) => {
  // 1. Wipe all local proctor recordings
  try {
    await clearAllProctorRecordings();
  } catch (e) {
    console.warn("Failed to clear proctor recordings:", e);
  }

  // 2. Wipe local storage submissions
  try {
    localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify([]));
  } catch (err) {
    console.warn("Failed to clear local submissions:", err);
  }

  // 3. Clear backend submissions
  try {
    const res = await axios.post(`${API_BASE_URL}/tests/submissions/clear`, {
      educator_wallet: educatorWallet
    }, { timeout: 4000 });
    return { success: true, message: res.data?.message || "All records cleared." };
  } catch (err) {
    console.warn("Backend clear failed (handled locally):", err.message);
    return { success: true, message: "All history cleared." };
  }
};

