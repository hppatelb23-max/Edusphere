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
  saveSubmissionLocally,
  getDeletedTestIds,
  markTestAsDeleted
} from "./dummyTests";

export const fetchAllTests = async () => {
  const deletedIds = getDeletedTestIds();
  try {
    const res = await axios.get(`${API_BASE_URL}/tests`, { timeout: 10000 });
    if (res.data?.tests && Array.isArray(res.data.tests) && res.data.tests.length > 0) {
      const backendTests = res.data.tests;
      const backendIds = new Set(backendTests.map(t => String(t._id)));
      const backendTitles = new Set(backendTests.map(t => (t.title || "").trim().toLowerCase()));

      const local = getStoredTests();
      // Only keep local tests that do NOT already exist on backend by ID or Title
      const uniqueLocal = local.filter(t => 
        !backendIds.has(String(t._id)) && 
        !backendTitles.has((t.title || "").trim().toLowerCase())
      );

      const combined = [...backendTests, ...uniqueLocal];
      return combined.filter(t => !deletedIds.has(String(t._id)) && !deletedIds.has(t._id));
    }
  } catch (err) {
    console.warn("Backend /tests not reachable, using offline question banks:", err.message);
  }
  return getStoredTests().filter(t => !deletedIds.has(String(t._id)) && !deletedIds.has(t._id));
};

export const fetchTestById = async (id, randomize = false) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/tests/${id}?randomize=${randomize}`, { timeout: 10000 });
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
      timeout: 30000  // 30s — base64 image payloads can be large
    });
    if (res.status === 201 && res.data?.test) {
      // Backend succeeded: save ONLY the single authoritative backend test to local cache
      saveCustomTest(res.data.test);
      return { success: true, test: res.data.test, message: res.data.message };
    }
  } catch (err) {
    console.warn("Backend create test failed or offline, saving to local storage:", err.message);
  }

  // Offline fallback only: save locally if backend is unreachable
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
        recording_id_part1: submissionData.recording_id_part1 || res.data.result.recording_id_part1 || "",
        recording_id_part2: submissionData.recording_id_part2 || res.data.result.recording_id_part2 || "",
        has_interruption: Boolean(submissionData.has_interruption || submissionData.recording_id_part1),
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
    localResult.recording_id_part1 = submissionData.recording_id_part1 || "";
    localResult.recording_id_part2 = submissionData.recording_id_part2 || "";
    localResult.has_interruption = Boolean(submissionData.has_interruption || submissionData.recording_id_part1);
    localResult.proctor_logs = submissionData.proctor_logs || [];
    localResult.student_name = submissionData.student_name || "";
    saveSubmissionLocally(localResult);
    return { success: true, result: localResult };
  }

  return { success: false, error: "Unable to find test to evaluate answers." };
};

export const fetchMySubmissions = async (studentWallet, studentName) => {
  const currentName =
    studentName ||
    localStorage.getItem("username") ||
    localStorage.getItem("studentName") ||
    localStorage.getItem("name") ||
    "";

  let backendSubmissions = [];
  try {
    const params = new URLSearchParams();
    if (studentWallet) params.append("student_wallet", studentWallet);
    if (currentName) params.append("student_name", currentName);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const res = await axios.get(`${API_BASE_URL}/tests/submissions/my${queryStr}`, { timeout: 4000 });
    if (res.data?.submissions && Array.isArray(res.data.submissions)) {
      backendSubmissions = res.data.submissions;
    }
  } catch (err) {
    console.warn("Backend /submissions/my not reachable, using local storage:", err.message);
  }

  // Get local stored submissions on this browser
  const local = getStoredSubmissions();

  // Combine backend + local submissions, deduplicating by ID
  const combined = [...backendSubmissions];
  const seenIds = new Set(backendSubmissions.map((s) => String(s.submission_id || s._id)));

  local.forEach((s) => {
    const sId = String(s.submission_id || s._id);
    if (seenIds.has(sId)) return;

    let isMatch = true;
    if (studentWallet) {
      const matchWallet =
        s.student_wallet_id && s.student_wallet_id.toLowerCase() === studentWallet.toLowerCase();
      const matchName =
        currentName &&
        s.student_name &&
        s.student_name.trim().toLowerCase() === currentName.trim().toLowerCase();
      isMatch = matchWallet || matchName;
    } else if (currentName) {
      isMatch =
        s.student_name &&
        s.student_name.trim().toLowerCase() === currentName.trim().toLowerCase();
    }

    if (isMatch) {
      combined.push(s);
      seenIds.add(sId);
    }
  });

  // Detect any scheduled assessments whose deadline has passed and student missed
  try {
    const allTests = await fetchAllTests();
    const now = new Date();
    const submittedTestIds = new Set(combined.map((s) => String(s.test_id)));

    (allTests || []).forEach((t) => {
      if (t.test_type === "scheduled" && t.schedule_end && new Date(t.schedule_end) < now) {
        if (!submittedTestIds.has(String(t._id))) {
          combined.push({
            submission_id: `missed_${t._id}`,
            test_id: t._id,
            test_title: t.title,
            author_name: t.author_name || "Faculty",
            student_wallet_id: studentWallet || "",
            student_name: currentName || "",
            score_percentage: 0,
            correct_answers: 0,
            wrong_answers: 0,
            total_questions: t.questions?.length || 0,
            passed: false,
            is_missed: true,
            status: "Missed / Window Expired",
            passing_score: t.passing_score || 60,
            schedule_start: t.schedule_start,
            schedule_end: t.schedule_end,
            submitted_at: t.schedule_end,
            detailed_review: []
          });
          submittedTestIds.add(String(t._id));
        }
      }
    });
  } catch (e) {
    console.warn("Error augmenting missed tests:", e);
  }

  // Sort latest submissions first
  combined.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
  return combined;
};

export const fetchEducatorSubmissions = async (educatorWallet) => {
  let backendSubmissions = [];
  try {
    const url = educatorWallet
      ? `${API_BASE_URL}/tests/submissions/all?educator_wallet=${educatorWallet}`
      : `${API_BASE_URL}/tests/submissions/all`;
    const res = await axios.get(url, { timeout: 5000 });
    if (res.data?.submissions && Array.isArray(res.data.submissions)) {
      backendSubmissions = res.data.submissions;
    }
  } catch (err) {
    console.warn("Backend submissions failed, loading local gradebook:", err.message);
  }

  // Merge with local submissions, strictly deduplicating so records NEVER appear twice
  const local = getStoredSubmissions();
  const seenSubIds = new Set();
  const seenRecIds = new Set();
  const seenComposite = new Set();
  const deduplicated = [];

  const addUnique = (s) => {
    if (!s) return;
    const subId = String(s.submission_id || s._id || "").trim();
    const recId = s.recording_id ? String(s.recording_id).trim() : "";
    const testId = String(s.test_id || s.test_title || "").trim();
    const studentWallet = String(s.student_wallet_id || "").toLowerCase().trim();
    const studentName = String(s.student_name || "").toLowerCase().trim();
    const score = String(s.score_percentage ?? "");
    const timeBucket = Math.floor(new Date(s.submitted_at || Date.now()).getTime() / 180000);
    const compositeKey = `${testId}_${studentWallet || studentName}_${score}_${timeBucket}`;

    if (subId && seenSubIds.has(subId)) return;
    if (recId && seenRecIds.has(recId)) return;
    if (compositeKey && seenComposite.has(compositeKey)) return;

    if (subId) seenSubIds.add(subId);
    if (recId) seenRecIds.add(recId);
    if (compositeKey) seenComposite.add(compositeKey);
    deduplicated.push(s);
  };

  // Process backend submissions first (authoritative)
  backendSubmissions.forEach(addUnique);
  // Then merge any purely offline local submissions
  local.forEach(addUnique);

  return deduplicated;
};


export const deleteTest = async (testId, educatorWallet) => {
  // Always mark as deleted in browser storage and purge from local custom list
  markTestAsDeleted(testId);

  try {
    const res = await axios.delete(`${API_BASE_URL}/tests/${testId}`, {
      data: { educator_wallet: educatorWallet },
      timeout: 5000
    });
    if (res.status === 200) {
      return { success: true };
    }
  } catch (err) {
    console.warn("Delete test backend notice (handled locally):", err.message);
    return { success: true, offlineOnly: true };
  }
  return { success: true };
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

