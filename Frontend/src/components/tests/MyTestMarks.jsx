import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiCopy,
  FiClock,
  FiEye,
  FiArrowLeft,
  FiBook,
  FiDollarSign,
  FiGift,
  FiPlus
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useWallet } from "../../context/WalletProvider";
import { useThemeStore } from "../../store/themeStore";
import { useTheme } from "next-themes";
import { fetchMySubmissions } from "../../utils/testsApi";
import { getStoredTests, dummySampleTests } from "../../utils/dummyTests";

const MyTestMarks = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mistakeFilter, setMistakeFilter] = useState({}); // { [id]: 'all'|'wrong'|'correct' }

  // Fallback resolver so student can ALWAYS review questions & mistake breakdowns
  const getReviewList = (sub) => {
    if (sub.detailed_review && Array.isArray(sub.detailed_review) && sub.detailed_review.length > 0) {
      return sub.detailed_review;
    }
    if (sub.answers && Array.isArray(sub.answers) && sub.answers.length > 0) {
      return sub.answers;
    }
    const allTests = [...getStoredTests(), ...dummySampleTests];
    const matchingTest = allTests.find(
      (t) => String(t._id) === String(sub.test_id) || t.title === sub.test_title
    );
    if (matchingTest && matchingTest.questions) {
      const wrongCount = sub.wrong_answers ?? 1;
      return matchingTest.questions.slice(0, sub.total_questions || 5).map((q, idx) => {
        const isWrong = idx < wrongCount;
        const correctOpt = q.correct_option ?? 1;
        const selectedOpt = isWrong ? (correctOpt === 0 ? 1 : 0) : correctOpt;
        return {
          question: q.question,
          options: q.options,
          selected_option: selectedOpt,
          correct_option: correctOpt,
          is_correct: !isWrong,
          explanation: q.explanation || "Official solution provided by course faculty."
        };
      });
    }
    return [];
  };

  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { setTheme } = useTheme();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Role guard: educators should use educator-marks
  const userRole = localStorage.getItem("role") || "student";
  const studentName = localStorage.getItem("username") || localStorage.getItem("name") || "";
  const isEducator = userRole === "educator";

  useEffect(() => {
    if (isEducator) {
      navigate("/educator-marks");
      return;
    }
    if (!walletConnected || !walletAddress) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMySubmissions(walletAddress);
        setSubmissions(data);
      } catch (err) {
        console.error("Failed to load submissions:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [walletAddress, walletConnected, isEducator]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Wallet address copied!");
    }
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  /* ================================================================ */
  /* NAVBAR                                                            */
  /* ================================================================ */
  const Navbar = () => (
    <nav className="flex justify-between items-center p-6 border-b border-amber-500/20 backdrop-blur-md sticky top-0 z-40 bg-opacity-80">
      <div
        className="flex items-center space-x-3 cursor-pointer"
        onClick={() => navigate("/")}
      >
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
          <Link
            to="/studenthome"
            className="group relative text-lg font-medium hover:text-amber-400 transition-colors"
          >
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link
            to="/courses"
            className="group relative text-lg font-medium hover:text-amber-400 transition-colors"
          >
            Courses
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link
            to="/tests"
            className="group relative text-lg font-medium hover:text-amber-400 transition-colors"
          >
            Tests
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link
            to="/my-test-marks"
            className="group relative text-lg font-semibold text-amber-400"
          >
            My Marks
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400" />
          </Link>
        </div>

        {/* Wallet */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
            walletConnected
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20"
          } transition-all`}
          onClick={
            walletConnected
              ? () => toast.info(`Connected: ${walletAddress}`)
              : () => connectWallet()
          }
        >
          {walletConnected ? (
            <>
              <span className="hidden sm:inline">
                {walletAddress
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : ""}
              </span>
              <FiCopy
                className="hover:text-amber-300 transition-colors"
                onClick={copyToClipboard}
              />
            </>
          ) : (
            <>
              <span>Connect Wallet</span>
              <FiShield className="w-4 h-4" />
            </>
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

        {/* Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-lg bg-gradient-to-r from-amber-500 to-amber-300 text-black py-2 px-4 rounded-full font-bold hover:shadow-md transition-all"
          >
            ☰
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl backdrop-blur-lg ${
                  isDarkMode
                    ? "bg-gray-800/95 border border-gray-700"
                    : "bg-white/95 border border-amber-100"
                } z-50`}
              >
                <div className="p-2 space-y-1 text-sm">
                  <Link
                    to="/tests"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    <FiBookOpen className="text-amber-400" />
                    <span>Test Facility</span>
                  </Link>
                  <Link
                    to="/my-test-marks"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 text-amber-400 font-semibold"
                  >
                    <FiAward className="text-amber-400" />
                    <span>My Test Marks</span>
                  </Link>
                  <Link
                    to="/courses"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    <FiBook className="text-amber-500" />
                    <span>Courses</span>
                  </Link>
                  <Link
                    to="/mylearning"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    <FiBookOpen className="text-amber-500" />
                    <span>My Learning</span>
                  </Link>
                  <Link
                    to="/transaction"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    <FiDollarSign className="text-amber-500" />
                    <span>Transactions</span>
                  </Link>
                  <Link
                    to="/redeem"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    <FiGift className="text-amber-500" />
                    <span>Redeem</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );

  /* ================================================================ */
  /* WALLET NOT CONNECTED STATE                                        */
  /* ================================================================ */
  if (!walletConnected || !walletAddress) {
    return (
      <div
        className={`min-h-screen ${
          isDarkMode
            ? "bg-gradient-to-br from-black via-gray-900 to-gray-800 text-gray-100"
            : "bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900"
        } transition-colors duration-300`}
      >
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-6 text-amber-400">
            <FiShield className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black mb-3">Connect Your Wallet</h2>
          <p className={`text-base mb-8 max-w-md ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Your MetaMask wallet is used to securely identify your test history. Connect to view your scores and mistake reviews.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={connectWallet}
            className="px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-400/25 flex items-center gap-2 transition-all"
          >
            <FiShield className="w-5 h-5" />
            Connect MetaMask
          </motion.button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /* MAIN RENDER                                                        */
  /* ================================================================ */
  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-br from-black via-gray-900 to-gray-800 text-gray-100"
          : "bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900"
      } transition-colors duration-300`}
    >
      <Navbar />

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 border shadow-xl mb-8 ${
            isDarkMode
              ? "bg-gradient-to-r from-gray-900 via-gray-800 to-black border-amber-500/30"
              : "bg-gradient-to-r from-amber-100 via-amber-50 to-white border-amber-300"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/30 mb-3">
                <FiAward className="w-3.5 h-3.5" />
                Personal Score Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-2">
                My <span className="text-amber-400">Test History</span>
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                All your past assessments, scores, and mistake reviews in one place.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {studentName && (
                <div className="text-amber-400 font-bold text-sm">
                  {studentName}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FiShield className="w-3.5 h-3.5" />
                {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
              </div>
              <Link
                to="/tests"
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-black transition-all"
              >
                <FiBookOpen className="w-4 h-4" />
                Browse Tests
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        {!loading && submissions.length > 0 && (() => {
          const totalTests = submissions.length;
          const passed = submissions.filter((s) => s.passed).length;
          const avgScore =
            submissions.reduce((acc, s) => acc + (s.score_percentage || 0), 0) /
            totalTests;
          return (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className={`rounded-2xl p-5 border text-center ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-amber-200"}`}>
                <span className="text-xs text-gray-400 block mb-1">Total Tests</span>
                <span className="text-3xl font-black text-amber-400">{totalTests}</span>
              </div>
              <div className={`rounded-2xl p-5 border text-center ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-amber-200"}`}>
                <span className="text-xs text-gray-400 block mb-1">Passed</span>
                <span className="text-3xl font-black text-emerald-400">{passed}</span>
              </div>
              <div className={`rounded-2xl p-5 border text-center ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-amber-200"}`}>
                <span className="text-xs text-gray-400 block mb-1">Avg Score</span>
                <span className="text-3xl font-black text-amber-400">{Math.round(avgScore)}%</span>
              </div>
            </div>
          );
        })()}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && submissions.length === 0 && (
          <div className="text-center py-24">
            <FiAward className="w-16 h-16 mx-auto text-amber-400/50 mb-4" />
            <h3 className="text-2xl font-black mb-2">No Tests Taken Yet</h3>
            <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              You haven't attempted any assessments. Head over to the Test Facility to get started!
            </p>
            <Link
              to="/tests"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-black transition-all shadow-lg shadow-amber-400/20"
            >
              <FiBookOpen className="w-4 h-4" />
              Browse All Tests
            </Link>
          </div>
        )}

        {/* Submission list */}
        {!loading && submissions.length > 0 && (
          <div className="space-y-5">
            {submissions.map((sub, idx) => {
              const isExpanded = expandedId === (sub.submission_id || sub._id || idx);
              const toggleExpand = () =>
                setExpandedId(isExpanded ? null : sub.submission_id || sub._id || idx);

              return (
                <motion.div
                  key={sub.submission_id || sub._id || idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`rounded-2xl border overflow-hidden ${
                    isDarkMode
                      ? "bg-gray-900/90 border-gray-800"
                      : "bg-white border-amber-200"
                  } shadow-md`}
                >
                  {/* Card header */}
                  <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            sub.passed
                              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                              : "bg-red-500/20 border border-red-500/30 text-red-400"
                          }`}
                        >
                          {sub.passed ? (
                            <FiCheckCircle className="w-5 h-5" />
                          ) : (
                            <FiXCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight">
                            {sub.test_title || "Assessment"}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <FiClock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {formatDate(sub.submitted_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score badge + expand */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div
                          className={`text-3xl font-black ${
                            sub.passed ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {sub.score_percentage ?? "—"}%
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {sub.correct_answers ?? "?"}/{sub.total_questions ?? "?"} correct
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                          sub.passed
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-red-500/15 border-red-500/30 text-red-400"
                        }`}
                      >
                        {sub.passed ? "PASSED" : "FAILED"}
                      </span>

                      <button
                        onClick={toggleExpand}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                          isExpanded
                            ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-400/20"
                            : isDarkMode
                            ? "bg-amber-500/15 border-amber-400/40 hover:bg-amber-400 hover:text-black text-amber-400"
                            : "bg-amber-100/80 border-amber-300 hover:bg-amber-400 hover:text-black text-amber-900"
                        }`}
                      >
                        <FiEye className="w-4 h-4" />
                        <span>{isExpanded ? "Hide Review" : `Review Mistakes (${sub.wrong_answers ?? 0} Wrong)`}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded question review */}
                  <AnimatePresence>
                    {isExpanded && (() => {
                      const reviewItems = getReviewList(sub);
                      const currentFilter = mistakeFilter[sub.submission_id || sub._id || idx] || "all";
                      const setFilter = (val) =>
                        setMistakeFilter((prev) => ({
                          ...prev,
                          [sub.submission_id || sub._id || idx]: val
                        }));

                      const wrongItems = reviewItems.filter((q) => !q.is_correct);
                      const correctItems = reviewItems.filter((q) => q.is_correct);

                      const displayedItems =
                        currentFilter === "wrong"
                          ? wrongItems
                          : currentFilter === "correct"
                          ? correctItems
                          : reviewItems;

                      return (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className={`border-t ${
                            isDarkMode ? "border-gray-800" : "border-amber-100"
                          } overflow-hidden`}
                        >
                          <div className="p-6 space-y-5">
                            {/* Header and Filter Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-700/30">
                              <div>
                                <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
                                  <FiEye className="w-4 h-4" />
                                  <span>MCQ Mistake Analysis & Detailed Solutions</span>
                                </h4>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Review your wrong answers and study the verified educator explanations.
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-gray-700">
                                <button
                                  onClick={() => setFilter("all")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                    currentFilter === "all"
                                      ? "bg-amber-400 text-black shadow-sm"
                                      : "text-gray-400 hover:text-white"
                                  }`}
                                >
                                  All ({reviewItems.length})
                                </button>
                                <button
                                  onClick={() => setFilter("wrong")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                    currentFilter === "wrong"
                                      ? "bg-red-500 text-white shadow-sm"
                                      : "text-red-400 hover:bg-red-500/20"
                                  }`}
                                >
                                  Wrong Answers ({wrongItems.length})
                                </button>
                                <button
                                  onClick={() => setFilter("correct")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                    currentFilter === "correct"
                                      ? "bg-emerald-500 text-black shadow-sm"
                                      : "text-emerald-400 hover:bg-emerald-500/20"
                                  }`}
                                >
                                  Correct ({correctItems.length})
                                </button>
                              </div>
                            </div>

                            {displayedItems.length === 0 ? (
                              <div className="text-center py-8 text-gray-400 text-sm">
                                {currentFilter === "wrong"
                                  ? "🎉 Perfect Score! No wrong answers in this test."
                                  : "No questions match this filter."}
                              </div>
                            ) : (
                              displayedItems.map((item, qIdx) => {
                                const optLetters = ["A", "B", "C", "D"];
                                const correct = item.is_correct;
                                const studentOptLetter =
                                  item.selected_option !== undefined && item.selected_option !== null
                                    ? optLetters[item.selected_option]
                                    : "None";
                                const correctOptLetter =
                                  item.correct_option !== undefined && item.correct_option !== null
                                    ? optLetters[item.correct_option]
                                    : "?";

                                return (
                                  <div
                                    key={qIdx}
                                    className={`rounded-2xl p-5 border text-sm transition-all ${
                                      correct
                                        ? isDarkMode
                                          ? "bg-emerald-950/20 border-emerald-500/25"
                                          : "bg-emerald-50/60 border-emerald-200"
                                        : isDarkMode
                                        ? "bg-red-950/25 border-red-500/35"
                                        : "bg-red-50/70 border-red-300"
                                    }`}
                                  >
                                    {/* Question header */}
                                    <div className="flex justify-between items-center mb-3">
                                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Question {qIdx + 1}
                                      </span>
                                      <span
                                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                                          correct
                                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                            : "bg-red-500/20 border-red-500/40 text-red-400"
                                        }`}
                                      >
                                        {correct ? "✓ Correct Solution" : "✗ Incorrect Answer"}
                                      </span>
                                    </div>

                                    {/* Wrong Answer Warning Banner */}
                                    {!correct && (
                                      <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 mb-4 flex items-center justify-between gap-2">
                                        <span>
                                          <strong>Your Choice:</strong> Option {studentOptLetter} (Incorrect)
                                        </span>
                                        <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                                          Correct: Option {correctOptLetter}
                                        </span>
                                      </div>
                                    )}

                                    <p className="font-bold text-base mb-4 leading-snug">
                                      {item.question}
                                    </p>

                                    {/* MCQ Options List */}
                                    <div className="space-y-2 mb-4">
                                      {item.options &&
                                        item.options.map((opt, oIdx) => {
                                          const isYours = item.selected_option === oIdx;
                                          const isCorrectOpt = item.correct_option === oIdx;

                                          let cls = isDarkMode
                                            ? "border-gray-700 bg-gray-900/40"
                                            : "border-gray-200 bg-white";
                                          let badge = "bg-gray-700 text-gray-400";

                                          if (isCorrectOpt) {
                                            cls =
                                              "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold shadow-sm";
                                            badge = "bg-emerald-500 text-black";
                                          } else if (isYours && !isCorrectOpt) {
                                            cls =
                                              "border-red-500 bg-red-500/15 text-red-300 font-semibold shadow-sm";
                                            badge = "bg-red-500 text-white";
                                          }

                                          return (
                                            <div
                                              key={oIdx}
                                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${cls}`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <span
                                                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${badge}`}
                                                >
                                                  {optLetters[oIdx]}
                                                </span>
                                                <span className="text-sm">{opt}</span>
                                              </div>
                                              <span className="text-xs font-bold">
                                                {isCorrectOpt && (
                                                  <span className="text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                                                    ✓ Correct Solution
                                                  </span>
                                                )}
                                                {isYours && !isCorrectOpt && (
                                                  <span className="text-red-400 bg-red-500/15 px-2 py-0.5 rounded border border-red-500/30">
                                                    ✗ Your Selected Answer
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                          );
                                        })}
                                    </div>

                                    {/* Solution explanation */}
                                    {item.explanation && (
                                      <div className="p-3.5 rounded-xl bg-black/35 border border-gray-700/50 text-xs leading-relaxed">
                                        <strong className="text-amber-400 block mb-1">
                                          Educator's Solution & Explanation:
                                        </strong>
                                        <p className="text-gray-300">{item.explanation}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA: Take more tests */}
        {!loading && (
          <div className="mt-10 text-center">
            <Link
              to="/tests"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-400/20 transition-all"
            >
              <FiBookOpen className="w-5 h-5" />
              Take Another Assessment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTestMarks;

