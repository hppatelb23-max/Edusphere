import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiLock,
  FiPlus,
  FiSearch,
  FiShield,
  FiShuffle,
  FiCopy,
  FiUser,
  FiDollarSign,
  FiBook,
  FiGift,
  FiTrash2,
  FiEye,
  FiZoomIn,
  FiRefreshCw
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useWallet } from "../../context/WalletProvider";
import { useThemeStore } from "../../store/themeStore";
import { useTheme } from "next-themes";
import { fetchAllTests, deleteTest, fetchMySubmissions } from "../../utils/testsApi";
import ImageZoomModal from "./ImageZoomModal";

const TestList = () => {
  const [tests, setTests] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { setTheme } = useTheme();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Role check: Only educator can create tests
  const userRole = localStorage.getItem("role") || "student";
  const isEducator = userRole === "educator";

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await fetchAllTests();
      setTests(data);
    } catch (err) {
      console.error("Failed to fetch tests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  // Fetch student past test submissions for history review badges
  useEffect(() => {
    if (!isEducator) {
      const loadSubmissions = async () => {
        try {
          const subs = await fetchMySubmissions(walletAddress);
          setStudentSubmissions(subs || []);
        } catch (e) {
          console.warn("Failed to load student submissions:", e);
        }
      };
      loadSubmissions();
    }
  }, [walletAddress, isEducator]);

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

  // Filter tests based on category and search query
  const categories = ["All", "Web3", "Frontend", "DeFi", "Security", "AI & ML"];

  const filteredTests = tests.filter((test) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (Array.isArray(test.category) && test.category.some((c) => c.toLowerCase().includes(selectedCategory.toLowerCase())));
    const matchesSearch =
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStartTest = (testId) => {
    if (!walletConnected || !walletAddress) {
      setShowConnectModal(true);
      return;
    }
    navigate(`/tests/${testId}`);
  };

  return (
    <div
      className={`min-h-screen w-full overflow-y-auto overflow-x-hidden ${
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
            <Link to={isEducator ? "/educatorhome" : "/studenthome"} className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/courses" className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/tests" className="group relative text-lg font-semibold text-amber-400">
              Tests
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400"></span>
            </Link>
            <Link to="/contest" className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Contest
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          {/* Wallet Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
              walletConnected
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20"
            } transition-all`}
            onClick={walletConnected ? () => toast.info(`Connected: ${walletAddress}`) : () => connectWallet()}
          >
            {walletConnected ? (
              <>
                <span className="hidden sm:inline">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""}
                </span>
                <FiCopy className="hover:text-amber-300 transition-colors" onClick={copyToClipboard} />
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

          {/* Educator shortcuts (Only visible to Educators) */}
          {isEducator && (
            <div className="hidden lg:flex items-center gap-2">
              <Link
                to="/create-test"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-400 hover:bg-amber-500 hover:text-black font-semibold text-sm transition-all"
              >
                <FiPlus className="w-4 h-4" />
                <span>Create Test</span>
              </Link>
              <Link
                to="/educator-marks"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-400 hover:bg-emerald-500 hover:text-black font-semibold text-sm transition-all"
              >
                <FiAward className="w-4 h-4" />
                <span>Student Marks</span>
              </Link>
            </div>
          )}

          {/* Student shortcuts */}
          {!isEducator && (
            <div className="hidden lg:flex items-center gap-2">
              <Link
                to="/my-test-marks"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-400 hover:bg-emerald-500 hover:text-black font-semibold text-sm transition-all"
              >
                <FiAward className="w-4 h-4" />
                <span>My Test History & Review</span>
              </Link>
            </div>
          )}

          {/* Dropdown Menu */}
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
                    isDarkMode ? "bg-gray-800/95 border border-gray-700" : "bg-white/95 border border-amber-100"
                  } z-50`}
                >
                  <div className="p-2 space-y-1 text-sm">
                    <Link
                      to="/tests"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 text-amber-400 font-semibold"
                    >
                      <FiBookOpen className="text-amber-400" />
                      <span>Test Facility</span>
                    </Link>
                    {isEducator ? (
                      <>
                        <Link
                          to="/create-test"
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                        >
                          <FiPlus className="text-amber-500" />
                          <span>Create Assessment</span>
                        </Link>
                        <Link
                          to="/educator-marks"
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                        >
                          <FiAward className="text-emerald-400" />
                          <span>All Student Marks</span>
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/my-test-marks"
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                      >
                        <FiAward className="text-amber-400" />
                        <span>My Test Marks</span>
                      </Link>
                    )}
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

      {/* Hero Banner Section */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-3xl p-8 md:p-12 overflow-hidden border ${
            isDarkMode
              ? "bg-gradient-to-r from-gray-900 via-gray-800 to-black border-amber-500/30"
              : "bg-gradient-to-r from-amber-100 via-amber-50 to-white border-amber-300"
          } shadow-2xl`}
        >
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/30 mb-4">
              <FiShield className="w-3.5 h-3.5" />
              MetaMask Verified • Anti-Cheat Integrity • Zero Gas
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              Edusphere <span className="text-amber-400">Test Facility</span>
            </h1>
            <p className={`text-base md:text-lg mb-6 leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Challenge your mastery in Web3, Smart Contracts, DeFi, Frontend, and AI through proctored,
              randomized MCQ assessments. Built with strict anti-copy security, automated grading, and
              instant educator solutions.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <FiShuffle className="text-amber-400" />
                <span>Random Question Sampling</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <FiLock className="text-amber-400" />
                <span>Protected Anti-Copy Platform</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <FiAward className="text-amber-400" />
                <span>Instant Verified Solutions</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter and Search Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-amber-400 text-black shadow-md shadow-amber-400/30 scale-105"
                    : isDarkMode
                    ? "bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700"
                    : "bg-white hover:bg-amber-100 text-gray-700 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-all ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-white focus:border-amber-400"
                  : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Test Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-20">
            <FiBookOpen className="w-16 h-16 mx-auto text-amber-400/60 mb-4" />
            <h3 className="text-2xl font-bold mb-2">No tests found</h3>
            <p className="text-gray-400 mb-6">No assessments match your selected filter or search query.</p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test, index) => {
              const questionCount = test.questions?.length || 0;
              const pickCount = Math.min(test.pick_random_count || 5, questionCount);

              return (
                <motion.div
                  key={test._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -6 }}
                  className={`rounded-2xl p-6 border flex flex-col justify-between transition-all ${
                    isDarkMode
                      ? "bg-gray-900/90 border-gray-800 hover:border-amber-400/50 shadow-lg"
                      : "bg-white border-amber-200/80 hover:border-amber-400 shadow-md"
                  }`}
                >
                  <div>
                    {/* Top Tag & Difficulty */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(test.category) &&
                          test.category.slice(0, 2).map((cat, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-500/15 text-amber-400 border border-amber-400/30"
                            >
                              {cat}
                            </span>
                          ))}
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${
                          test.difficulty === "Advanced"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : test.difficulty === "Intermediate"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {test.difficulty || "Intermediate"}
                      </span>
                    </div>

                    {/* Test Title */}
                    <h3 className="text-xl font-bold mb-2.5 line-clamp-2 hover:text-amber-400 transition-colors">
                      {test.title}
                    </h3>

                    {/* Test Description */}
                    <p className={`text-sm mb-6 line-clamp-3 leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {test.description}
                    </p>

                    {/* Test Metadata stats */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl mb-6 bg-amber-500/5 border border-amber-500/10 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-1">
                          <FiClock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Time</span>
                        </div>
                        <span className="font-bold text-sm">{test.duration_minutes || 15}m</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-1">
                          <FiShuffle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Picks</span>
                        </div>
                        <span className="font-bold text-sm">{pickCount} Qs</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-1">
                          <FiAward className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pass</span>
                        </div>
                        <span className="font-bold text-sm">{test.passing_score || 60}%</span>
                      </div>
                    </div>
                  </div>

                    {/* Card Footer */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-3 border-b border-gray-700/30">
                      <span>By: {test.author_name || "Faculty"}</span>
                      <span className="font-mono">
                        {test.author_wallet_id ? `${test.author_wallet_id.slice(0, 6)}...` : ""}
                      </span>
                    </div>

                    {/* Educators see "View Student Marks" instead of "Take Assessment" */}
                    {isEducator ? (
                      <Link
                        to={`/educator-marks?testId=${encodeURIComponent(test._id || "")}&testTitle=${encodeURIComponent(test.title || "")}`}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <FiAward className="w-4 h-4" />
                        <span>View Student Marks</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleStartTest(test._id)}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Give Test</span>
                      </button>
                    )}

                    {isEducator && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${test.title}"? This cannot be undone.`)) {
                            setTests((prev) => prev.filter((t) => String(t._id) !== String(test._id)));
                            const result = await deleteTest(test._id, walletAddress);
                            if (result.success) {
                              toast.success("Test deleted successfully!");
                              loadTests();
                            } else {
                              toast.error("Failed to delete test.");
                              loadTests();
                            }
                          }
                        }}
                        className="w-full py-2.5 rounded-xl font-bold text-sm bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span>Delete Test</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Educator CTA Banner (Only for Educators) */}
      {isEducator && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div
            className={`rounded-2xl p-8 border flex flex-col md:flex-row items-center justify-between gap-6 ${
              isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-amber-200"
            }`}
          >
            <div>
              <h3 className="text-2xl font-bold mb-2">Educator Portal & Gradebook</h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Create custom MCQ tests, build question banks with solutions, and track every student's assessment marks
                and mistakes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/create-test"
                className="whitespace-nowrap px-6 py-3 rounded-xl font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20"
              >
                <FiPlus className="w-4 h-4" />
                <span>Create Test</span>
              </Link>
              <Link
                to="/educator-marks"
                className="whitespace-nowrap px-6 py-3 rounded-xl font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <FiAward className="w-4 h-4" />
                <span>View Student Marks</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Required Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full rounded-3xl p-8 border shadow-2xl ${
                isDarkMode ? "bg-gray-900 border-amber-400/30 text-white" : "bg-white border-amber-300 text-gray-900"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-6 text-amber-400">
                <FiLock className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black text-center mb-3">Wallet Connection Required</h3>
              <p className="text-sm text-center text-gray-400 mb-6 leading-relaxed">
                To guarantee academic integrity and verify student test attempts, students must connect their MetaMask
                wallet before taking an assessment. No blockchain gas fees or transactions are charged.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    connectWallet();
                  }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <FiShield className="w-4 h-4" />
                  <span>Connect MetaMask Wallet</span>
                </button>

                <button
                  onClick={() => setShowConnectModal(false)}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${
                    isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestList;

