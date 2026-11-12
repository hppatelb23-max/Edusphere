import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAward,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiCopy,
  FiCalendar,
  FiEye,
  FiFilter,
  FiLock,
  FiPlus,
  FiBookOpen,
  FiShield,
  FiUser,
  FiVideo,
  FiDownload,
  FiAlertTriangle,
  FiClock,
  FiTrash2,
  FiZoomIn
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useWallet } from "../../context/WalletProvider";
import { useThemeStore } from "../../store/themeStore";
import { useTheme } from "next-themes";
import {
  fetchEducatorSubmissions,
  deleteStudentSubmission,
  deleteStudentRecordingOnly,
  clearAllStudentSubmissions
} from "../../utils/testsApi";
import { getProctorRecording } from "../../utils/proctorRecordingDB";
import ImageZoomModal from "./ImageZoomModal";

const EducatorMarks = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const testIdParam = searchParams.get("testId") || "";
  const testTitleParam = searchParams.get("testTitle") || "";

  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { setTheme } = useTheme();

  // Role validation
  const userRole = localStorage.getItem("role") || "student";
  const isEducator = userRole === "educator";

  // Data states
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTest, setFilterTest] = useState(testTitleParam || "All");
  const [filterStatus, setFilterStatus] = useState("All"); // All | Passed | Failed
  const [selectedSubmission, setSelectedSubmission] = useState(null); // for mistakes review modal
  const [zoomImage, setZoomImage] = useState(null); // { src, alt }
  const [recordingModalSub, setRecordingModalSub] = useState(null); // for video recording playback
  const [recordingBlobUrl, setRecordingBlobUrl] = useState(null);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync filterTest with URL query parameters when navigating
  useEffect(() => {
    if (testTitleParam) {
      setFilterTest(testTitleParam);
    }
  }, [testTitleParam]);

  const handleOpenRecording = async (sub) => {
    setRecordingModalSub(sub);
    setRecordingLoading(true);
    setRecordingBlobUrl(null);

    try {
      if (sub.recording_id) {
        const record = await getProctorRecording(sub.recording_id);
        if (record && record.blob) {
          const url = URL.createObjectURL(record.blob);
          setRecordingBlobUrl(url);
          setRecordingLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to load recording:", err);
    }
    setRecordingLoading(false);
  };

  const handleCloseRecording = () => {
    if (recordingBlobUrl) {
      URL.revokeObjectURL(recordingBlobUrl);
    }
    setRecordingBlobUrl(null);
    setRecordingModalSub(null);
  };

  // Delete a single student's submission and associated recording
  const handleDeleteSubmission = async (sub) => {
    const candidateName = sub.student_name && sub.student_name.trim() && !sub.student_name.startsWith("0x")
      ? sub.student_name.trim()
      : "this student";
    const confirmed = window.confirm(
      `Are you sure you want to delete the test marks and proctor recording for ${candidateName}? This cannot be undone.`
    );
    if (!confirmed) return;

    const subId = sub.submission_id || sub._id;
    try {
      await deleteStudentSubmission(subId, sub.recording_id);
      setSubmissions((prev) => prev.filter((s) => (s.submission_id || s._id) !== subId));
      if (selectedSubmission && (selectedSubmission.submission_id || selectedSubmission._id) === subId) {
        setSelectedSubmission(null);
      }
      if (recordingModalSub && (recordingModalSub.submission_id || recordingModalSub._id) === subId) {
        handleCloseRecording();
      }
      toast.success("Student test marks and recording deleted successfully.");
    } catch (err) {
      console.error("Failed to delete submission:", err);
      toast.error("Failed to delete submission.");
    }
  };

  // Delete only video recording for a submission
  const handleDeleteRecordingOnly = async (sub) => {
    if (!sub.recording_id) {
      toast.info("No video recording exists for this submission.");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to delete only this candidate's proctor webcam recording? Test marks will remain intact."
    );
    if (!confirmed) return;

    const subId = sub.submission_id || sub._id;
    try {
      await deleteStudentRecordingOnly(subId, sub.recording_id);
      if (recordingBlobUrl) {
        URL.revokeObjectURL(recordingBlobUrl);
      }
      setRecordingBlobUrl(null);
      setRecordingModalSub((prev) => (prev ? { ...prev, recording_id: "" } : null));
      setSubmissions((prev) =>
        prev.map((s) => ((s.submission_id || s._id) === subId ? { ...s, recording_id: "" } : s))
      );
      toast.success("Proctor video recording deleted successfully.");
    } catch (err) {
      console.error("Failed to delete recording:", err);
      toast.error("Failed to delete recording.");
    }
  };

  // Clear all student marks and recordings history
  const handleClearAllHistory = async () => {
    if (submissions.length === 0) {
      toast.info("No submission records to clear.");
      return;
    }
    const confirmed = window.confirm(
      "WARNING: Are you sure you want to delete ALL students' marks, history, and video recordings permanently? This action cannot be reversed."
    );
    if (!confirmed) return;

    try {
      await clearAllStudentSubmissions(walletAddress);
      setSubmissions([]);
      setSelectedSubmission(null);
      handleCloseRecording();
      toast.success("All student marks and recordings history have been cleared.");
    } catch (err) {
      console.error("Failed to clear submissions:", err);
      toast.error("Failed to clear student marks history.");
    }
  };

  useEffect(() => {
    const loadSubmissions = async () => {
      setLoading(true);
      try {
        const data = await fetchEducatorSubmissions(walletAddress);
        setSubmissions(data || []);
      } catch (err) {
        console.error("Failed to load student submissions:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSubmissions();
  }, [walletAddress]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  const copyToClipboard = (text, label = "Copied!") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Clear history for only the currently filtered test
  const handleClearFilteredTestHistory = async () => {
    if (filteredSubmissions.length === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete all students' marks and video recordings for "${filterTest}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const filteredIds = new Set(filteredSubmissions.map((s) => s.submission_id || s._id));
      for (const sub of filteredSubmissions) {
        const subId = sub.submission_id || sub._id;
        await deleteStudentSubmission(subId, sub.recording_id);
      }
      setSubmissions((prev) => prev.filter((s) => !filteredIds.has(s.submission_id || s._id)));
      if (selectedSubmission && filteredIds.has(selectedSubmission.submission_id || selectedSubmission._id)) {
        setSelectedSubmission(null);
      }
      if (recordingModalSub && filteredIds.has(recordingModalSub.submission_id || recordingModalSub._id)) {
        handleCloseRecording();
      }
      toast.success(`Marks and recordings for "${filterTest}" have been cleared.`);
    } catch (err) {
      console.error("Failed to clear test history:", err);
      toast.error("Failed to clear marks history.");
    }
  };

  // Filter calculations
  const uniqueTestTitles = [
    "All",
    ...new Set([
      ...(testTitleParam ? [testTitleParam] : []),
      ...submissions.map((s) => s.test_title).filter(Boolean)
    ])
  ];

  const handleTestFilterChange = (selectedTitle) => {
    setFilterTest(selectedTitle);
    if (selectedTitle === "All") {
      setSearchParams({});
    } else {
      setSearchParams({ testTitle: selectedTitle });
    }
  };

  const handleClearTestFilter = () => {
    setFilterTest("All");
    setSearchParams({});
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      (sub.student_wallet_id && sub.student_wallet_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.student_name && sub.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.test_title && sub.test_title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTest = (() => {
      if (filterTest === "All") return true;
      const target = filterTest.trim().toLowerCase();
      // Match by title
      if (sub.test_title && sub.test_title.trim().toLowerCase() === target) {
        return true;
      }
      // Match by test_id if testIdParam is present
      if (testIdParam && sub.test_id && String(sub.test_id) === String(testIdParam)) {
        return true;
      }
      return false;
    })();

    const matchesStatus =
      filterStatus === "All" ||
      (filterStatus === "Passed" && sub.passed) ||
      (filterStatus === "Failed" && !sub.passed);

    return matchesSearch && matchesTest && matchesStatus;
  });

  // Aggregate stats calculated specifically for the currently filtered test/view
  const totalAttempts = filteredSubmissions.length;
  const passedAttempts = filteredSubmissions.filter((s) => s.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  const avgScore =
    totalAttempts > 0
      ? Math.round(filteredSubmissions.reduce((acc, curr) => acc + (curr.score_percentage || 0), 0) / totalAttempts)
      : 0;

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-br from-black via-gray-900 to-gray-800 text-gray-100"
          : "bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900"
      } transition-colors duration-300`}
    >
      {/* Top Navbar */}
      <nav className="flex justify-between items-center p-6 border-b border-amber-500/20 backdrop-blur-md sticky top-0 z-40 bg-opacity-80">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
          <img
            src="/images/Edusphere logo.png"
            alt="Logo"
            className="w-12 h-12 rounded-full shadow-lg border border-amber-400/40"
          />
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            Edusphere
          </h1>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-8">
            <Link to="/educatorhome" className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/createcourses" className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Create Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/create-test" className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Create Test
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/educator-marks" className="group relative text-lg font-semibold text-emerald-400">
              Student Marks
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-emerald-400"></span>
            </Link>
          </div>

          {/* Wallet Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
              walletConnected
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                : "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
            } transition-all`}
            onClick={walletConnected ? () => toast.info(`Connected: ${walletAddress}`) : () => connectWallet()}
          >
            {walletConnected ? (
              <>
                <span className="hidden sm:inline">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""}
                </span>
                <FiCopy className="hover:text-amber-300 transition-colors" onClick={() => copyToClipboard(walletAddress, "Wallet address copied!")} />
              </>
            ) : (
              <span>Connect Wallet</span>
            )}
          </motion.button>

          {/* Theme toggle */}
          <button
            className="text-2xl p-2 rounded-full hover:bg-amber-500/10 transition-colors"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate("/educatorhome")}
            className="flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Educator Dashboard</span>
          </button>

          <Link
            to="/create-test"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center gap-2 shadow-md shadow-amber-400/20"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create New Test</span>
          </Link>
        </div>

        {/* Role Access Restriction Screen */}
        {!isEducator ? (
          <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-center max-w-xl mx-auto my-16 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <FiLock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">Educator Portal Only</h3>
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Only educators are authorized to view students' overall assessment scores and mistake breakdowns.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  localStorage.setItem("role", "educator");
                  window.location.reload();
                }}
                className="px-6 py-3 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20"
              >
                Switch to Educator Role
              </button>
              <button
                onClick={() => navigate("/tests")}
                className="px-6 py-3 rounded-xl font-bold text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
              >
                Go to Student Tests
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header & Overview Stats */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 mb-3">
                <FiAward className="w-3.5 h-3.5" />
                {filterTest !== "All" ? `Educator Gradebook • ${filterTest}` : "Educator Gradebook & Marks Central"}
              </div>
              <h1 className="text-4xl font-black mb-2">
                {filterTest !== "All" ? `Assessment Marks: ${filterTest}` : "Student Test Results & Mistakes"}
              </h1>
              <p className={`text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {filterTest !== "All"
                  ? `Viewing student performance, scores, mistake breakdowns, and proctor recordings exclusively for "${filterTest}".`
                  : "Monitor student performance across all assessments. Review exact scores, passing percentages, and inspect questions where students made mistakes."}
              </p>
            </div>

            {/* Active Test Filter Banner */}
            {filterTest !== "All" && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold text-lg shadow-sm">
                    <FiFilter className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">
                      Specific Assessment Filter Active
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Showing records only for: <span className="text-amber-300 underline underline-offset-4">"{filterTest}"</span>
                    </h3>
                  </div>
                </div>

                <button
                  onClick={handleClearTestFilter}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <FiXCircle className="w-4 h-4 text-amber-400" />
                  <span>Show All Tests Marks</span>
                </button>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xs text-gray-400 block mb-1">Total Submissions</span>
                <span className="text-3xl font-black text-amber-400">{totalAttempts}</span>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xs text-gray-400 block mb-1">Pass Rate</span>
                <span className="text-3xl font-black text-emerald-400">{passRate}%</span>
              </div>
              <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-xs text-gray-400 block mb-1">Average Score</span>
                <span className="text-3xl font-black text-blue-400">{avgScore}%</span>
              </div>
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                <span className="text-xs text-gray-400 block mb-1">Passed Attempts</span>
                <span className="text-3xl font-black text-purple-400">
                  {passedAttempts} / {totalAttempts}
                </span>
              </div>
            </div>

            {/* Filters & Search Controls */}
            <div
              className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row gap-4 items-center justify-between ${
                isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-amber-200"
              }`}
            >
              <div className="relative w-full md:w-80">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student wallet (0x...) or candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-xs border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Test filter */}
                <select
                  value={filterTest}
                  onChange={(e) => handleTestFilterChange(e.target.value)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none ${
                    isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  {uniqueTestTitles.map((t, idx) => (
                    <option key={idx} value={t}>
                      {t === "All" ? "All Assessments" : t}
                    </option>
                  ))}
                </select>

                {/* Status filter */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-800/40 border border-gray-700">
                  {["All", "Passed", "Failed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterStatus === st
                          ? "bg-amber-400 text-black shadow-sm"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Educator Delete History button */}
                {filteredSubmissions.length > 0 && (
                  <button
                    onClick={filterTest !== "All" ? handleClearFilteredTestHistory : handleClearAllHistory}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 ml-auto"
                    title={
                      filterTest !== "All"
                        ? `Delete all student marks & recordings for "${filterTest}"`
                        : "Delete entire history of all students marks and video recordings"
                    }
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>{filterTest !== "All" ? `Clear "${filterTest}" History` : "Clear All History"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submissions Table / Cards */}
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-gray-800 bg-gray-900/40">
                <FiAward className="w-16 h-16 mx-auto text-gray-500 mb-3" />
                <h3 className="text-xl font-bold mb-1">
                  {filterTest !== "All"
                    ? `No Student Submissions Yet for "${filterTest}"`
                    : "No Student Submissions Found"}
                </h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto mb-5">
                  {filterTest !== "All"
                    ? `No students have taken or submitted "${filterTest}" yet. Once students take this assessment, their test marks, mistake reviews, and webcam recordings will appear here.`
                    : searchQuery || filterStatus !== "All"
                    ? "Try adjusting your search or filters."
                    : "When students take assessments, their marks and mistake breakdowns will appear here."}
                </p>
                {filterTest !== "All" && (
                  <button
                    onClick={handleClearTestFilter}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20"
                  >
                    View All Assessments Marks
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((sub, idx) => {
                  const dateStr = sub.submitted_at
                    ? new Date(sub.submitted_at).toLocaleString()
                    : "Recently";

                  return (
                    <motion.div
                      key={sub.submission_id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                        isDarkMode
                          ? "bg-gray-900/80 border-gray-800 hover:border-gray-700"
                          : "bg-white border-amber-200 hover:border-amber-300 shadow-sm"
                      }`}
                    >
                      {/* Left: Student Identity & Test Info */}
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                            sub.passed
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {sub.passed ? <FiCheckCircle className="w-6 h-6" /> : <FiXCircle className="w-6 h-6" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FiUser className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="font-bold text-base text-amber-400">
                              {sub.student_name && sub.student_name.trim() && !sub.student_name.startsWith("0x")
                                ? sub.student_name.trim()
                                : (localStorage.getItem("username") || localStorage.getItem("studentName") || "Student Candidate")}
                            </span>
                          </div>

                          <h4 className="font-bold text-base mb-1">{sub.test_title || "General Assessment"}</h4>

                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3 h-3" />
                              {dateStr}
                            </span>
                            <span>•</span>
                            <span>
                              Passing Required: <strong>{sub.passing_score || 60}%</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Score, Status & Review Button */}
                      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-none border-gray-800">
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block mb-0.5">Marks Scored</span>
                          <span className="text-lg font-black text-amber-400">
                            {sub.correct_answers} / {sub.total_questions} ({sub.score_percentage}%)
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            sub.passed
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                              : "bg-red-500/20 text-red-400 border-red-500/40"
                          }`}
                        >
                          {sub.passed ? "Passed" : "Failed"}
                        </span>

                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500/15 border border-amber-400/40 text-amber-400 hover:bg-amber-400 hover:text-black transition-all flex items-center gap-1.5"
                        >
                          <FiEye className="w-4 h-4" />
                          <span>Review Mistakes</span>
                        </button>

                        <button
                          onClick={() => handleOpenRecording(sub)}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-500/20 border border-purple-400/40 text-purple-300 hover:bg-purple-500 hover:text-black transition-all flex items-center gap-1.5 shadow-sm shadow-purple-500/20"
                          title="Watch candidate proctored webcam recording (Educator only)"
                        >
                          <FiVideo className="w-4 h-4" />
                          <span>Watch Recording</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSubmission(sub)}
                          className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
                          title="Delete this student's mark & recording from history"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* PROCTOR VIDEO RECORDING PLAYBACK MODAL (EDUCATOR ONLY)         */}
      {/* ============================================================== */}
      <AnimatePresence>
        {recordingModalSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-3xl w-full rounded-3xl p-6 md:p-8 border shadow-2xl max-h-[90vh] overflow-y-auto ${
                isDarkMode ? "bg-gray-900 border-purple-500/40 text-white" : "bg-white border-purple-300 text-gray-900"
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-gray-700/40">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-400/40 flex items-center gap-1.5">
                      <FiVideo className="w-3.5 h-3.5" />
                      Educator Proctoring Recording
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Confidential
                    </span>
                  </div>
                  <h3 className="text-2xl font-black">{recordingModalSub.test_title || "Assessment Recording"}</h3>
                  <p className="text-xs font-mono text-gray-400 mt-1">
                    Candidate: <strong className="text-amber-400">{recordingModalSub.student_name && recordingModalSub.student_name.trim() && !recordingModalSub.student_name.startsWith("0x") ? recordingModalSub.student_name.trim() : (localStorage.getItem("username") || "Student Candidate")}</strong>
                  </p>
                </div>

                <button
                  onClick={handleCloseRecording}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Video Player Section */}
              <div className="mb-6 rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl relative min-h-[260px] flex items-center justify-center">
                {recordingLoading ? (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-purple-400">Loading proctor video from secure storage...</p>
                  </div>
                ) : recordingBlobUrl ? (
                  <video
                    controls
                    autoPlay
                    src={recordingBlobUrl}
                    className="w-full max-h-[380px] object-contain rounded-2xl bg-black"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                      <FiVideo className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-base text-gray-200">Session Recording Stored</h4>
                    <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                      This assessment session was completed. If the candidate took the test in a separate private browser or mock mode, live video data was logged and verified on-chain.
                    </p>
                  </div>
                )}
              </div>

              {/* Integrity Timeline / Red Dot Alerts Log */}
              <div className="mb-6 p-5 rounded-2xl bg-black/30 border border-gray-800">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4" />
                  <span>Proctoring Integrity Timeline & Cheat Alerts</span>
                </h4>

                {recordingModalSub.proctor_logs && recordingModalSub.proctor_logs.length > 0 ? (
                  <div className="space-y-2">
                    {recordingModalSub.proctor_logs.map((log, lIdx) => (
                      <div
                        key={lIdx}
                        className="p-3 rounded-xl bg-red-950/25 border border-red-500/30 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="font-bold text-red-400">{log.reason || "Suspicious Activity Detected"}</span>
                        </div>
                        <span className="font-mono text-gray-400 font-bold bg-black/40 px-2 py-0.5 rounded">
                          ⏱ {log.time || "00:00"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2.5">
                    <FiCheckCircle className="w-4 h-4 shrink-0" />
                    <span><strong>Integrity Verified:</strong> Zero violations detected during test. Green dot maintained throughout session.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  {recordingBlobUrl && (
                    <a
                      href={recordingBlobUrl}
                      download={`proctor_recording_${recordingModalSub.test_id || "exam"}.webm`}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-black flex items-center gap-2 transition-all shadow-md shadow-purple-500/20"
                    >
                      <FiDownload className="w-4 h-4" />
                      <span>Download Recording</span>
                    </a>
                  )}

                  {recordingModalSub.recording_id && (
                    <button
                      onClick={() => handleDeleteRecordingOnly(recordingModalSub)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-1.5 transition-all"
                      title="Permanently delete this candidate's proctor webcam video recording"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete Recording</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleCloseRecording}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                >
                  Close Player
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* STUDENT MISTAKES & SOLUTIONS MODAL */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-3xl p-8 border shadow-2xl ${
                isDarkMode ? "bg-gray-900 border-amber-500/30 text-white" : "bg-white border-amber-300 text-gray-900"
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-6 mb-6 border-b border-gray-800">
                <div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/30">
                    Student Assessment Breakdown
                  </span>
                  <h3 className="text-2xl font-black mt-2">{selectedSubmission.test_title}</h3>
                  <p className="text-xs font-mono text-gray-400 mt-1">
                    Candidate: <strong className="text-amber-400">{selectedSubmission.student_name && selectedSubmission.student_name.trim() && !selectedSubmission.student_name.startsWith("0x") ? selectedSubmission.student_name.trim() : (localStorage.getItem("username") || "Student Candidate")}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-black px-3 py-1.5 rounded-xl border ${
                      selectedSubmission.passed
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-red-500/20 text-red-400 border-red-500/40"
                    }`}
                  >
                    Score: {selectedSubmission.score_percentage}% ({selectedSubmission.correct_answers}/
                    {selectedSubmission.total_questions})
                  </span>
                </div>
              </div>

              {/* Questions Breakdown */}
              <div className="space-y-6 mb-6">
                {selectedSubmission.detailed_review && selectedSubmission.detailed_review.length > 0 ? (
                  selectedSubmission.detailed_review.map((item, idx) => {
                    const optionLetters = ["A", "B", "C", "D"];
                    const isCorrect = item.is_correct;

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border ${
                          isCorrect
                            ? isDarkMode
                              ? "bg-emerald-950/20 border-emerald-500/30"
                              : "bg-emerald-50/60 border-emerald-200"
                            : isDarkMode
                            ? "bg-red-950/20 border-red-500/30"
                            : "bg-red-50/60 border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-400 uppercase">Question {idx + 1}</span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              isCorrect ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <FiCheckCircle /> Correct
                              </>
                            ) : (
                              <>
                                <FiXCircle /> Student Mistake
                              </>
                            )}
                          </span>
                        </div>

                        {/* Question Diagram / Image if present */}
                        {item.question_image && (
                          <div
                            onClick={() =>
                              setZoomImage({
                                src: item.question_image,
                                alt: `Question #${idx + 1} Diagram`
                              })
                            }
                            className="group relative mb-3 rounded-xl overflow-hidden border border-amber-400/30 bg-black/50 p-2 flex flex-col items-center justify-center cursor-zoom-in hover:border-amber-400 transition-all"
                            title="Click to zoom question diagram"
                          >
                            <img
                              src={item.question_image}
                              alt={`Question #${idx + 1} Diagram`}
                              className="max-h-56 object-contain rounded-lg group-hover:scale-[1.02] transition-transform"
                            />
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-amber-400 font-bold border border-amber-400/40 flex items-center gap-1 shadow-md opacity-90 group-hover:opacity-100">
                              <FiZoomIn className="w-3 h-3" /> Click to Zoom
                            </div>
                          </div>
                        )}

                        <h4 className="text-sm font-bold mb-3">{item.question}</h4>

                        {item.options && (
                          <div className="space-y-1.5 mb-3 text-xs">
                            {item.options.map((opt, optIdx) => {
                              const isStudentSelected = item.selected_option === optIdx;
                              const isCorrectOpt = item.correct_option === optIdx;
                              const optImg = item.option_images && item.option_images[optIdx];

                              let optClass = "border-gray-800 text-gray-400";
                              if (isCorrectOpt) {
                                optClass = "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold";
                              } else if (isStudentSelected && !isCorrectOpt) {
                                optClass = "border-red-500 bg-red-500/15 text-red-300 font-bold";
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${optClass}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>
                                      <strong>{optionLetters[optIdx]}:</strong> {opt}
                                    </span>
                                  </div>
                                  {optImg && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setZoomImage({
                                          src: optImg,
                                          alt: `Option ${optionLetters[optIdx]} diagram`
                                        });
                                      }}
                                      className="rounded-lg overflow-hidden border border-gray-700 bg-black/30 p-1 max-h-16 flex items-center cursor-zoom-in hover:border-amber-400 transition-colors"
                                      title="Click to zoom option diagram"
                                    >
                                      <img src={optImg} alt={`Option ${optionLetters[optIdx]}`} className="max-h-14 object-contain" />
                                      <span className="text-[9px] text-amber-400 ml-1 font-bold flex items-center gap-0.5">
                                        <FiZoomIn className="w-2.5 h-2.5" />
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    {isCorrectOpt && <span className="text-emerald-400">✓ Correct Solution</span>}
                                    {isStudentSelected && !isCorrectOpt && (
                                      <span className="text-red-400">✗ Student's Answer</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {item.explanation && (
                          <div className="p-3 rounded-xl bg-black/30 border border-gray-700/50 text-xs text-gray-300">
                            <strong className="text-amber-400 block mb-0.5">Explanation Provided:</strong>
                            {item.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-400 py-6 text-sm">
                    No detailed question breakdown recorded for this submission.
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              >
                Close Review
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        isOpen={Boolean(zoomImage)}
        src={zoomImage?.src}
        alt={zoomImage?.alt}
        onClose={() => setZoomImage(null)}
      />
    </div>
  );
};

export default EducatorMarks;

