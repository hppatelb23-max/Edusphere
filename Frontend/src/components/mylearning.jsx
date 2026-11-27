import ThreeLineMenu from "./ThreeLineMenu";
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiClock, FiBookOpen, FiUploadCloud, FiCopy, FiDollarSign, FiBook, FiGift, FiUser } from 'react-icons/fi';
import { useTheme } from "next-themes";
import { MdOutlineLibraryAdd, MdOutlineAccountBalance } from 'react-icons/md';
import { RiCoinsLine } from 'react-icons/ri';
import { BiBook, BiGift } from 'react-icons/bi';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useThemeStore } from '../store/themeStore';
import { useWallet } from "../context/WalletProvider";
import axios from 'axios';
import { toast } from "react-toastify";
import { API_BASE_URL, getCookie } from '../utils/api';



const MyLearningPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme } = useTheme();
  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const [account, setAccount] = useState(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [completed, completedCourse] = useState([])
  const [purchased, purchasedCourses] = useState([])
  const navigate = useNavigate();

  const menuRef = useRef(null);
  const dropdownRef = useRef(null);


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = getCookie("admin") || getCookie("user");
        const role = localStorage.getItem("role");
        const isEducator = role === "educator";
        const wallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem(isEducator ? "adminWallet" : "studentWallet") || localStorage.getItem("educatorWallet") || "";
        const studentName = isEducator
          ? (localStorage.getItem("educatorName") || localStorage.getItem("name") || (localStorage.getItem("role") === "educator" ? localStorage.getItem("username") : "") || "")
          : (localStorage.getItem("studentName") || localStorage.getItem("name") || (localStorage.getItem("role") === "student" ? localStorage.getItem("username") : "") || "");

        if (!token && !wallet && !studentName) {
          purchasedCourses([]);
          completedCourse([]);
          return;
        }

        let allCatalogCourses = [];
        try {
          const catRes = await axios.get(`${API_BASE_URL}/courses`);
          if (catRes.data && Array.isArray(catRes.data.courses)) {
            allCatalogCourses = catRes.data.courses;
          }
        } catch (e) {}

        const response = await axios.get(`${API_BASE_URL}/user/my-learning`, {
          params: {
            wallet: wallet || undefined,
            student_name: studentName || undefined
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        let enrolled = [];
        if (response.status === 200 && response.data) {
          enrolled = response.data.courses_enrolled || [];
          const done = response.data.courses_completed || [];
          completedCourse(done);

          // If backend returned empty for student, clean obsolete local keys
          if (!isEducator && enrolled.length === 0) {
            try {
              localStorage.removeItem("enrolled_courses");
              if (wallet) {
                Object.keys(localStorage).forEach(k => {
                  if (k.startsWith(`enrolled_${wallet.toLowerCase()}_`)) {
                    localStorage.removeItem(k);
                  }
                });
              }
            } catch (e) {}
          }
        }

        // Web3 Permanent Access: Also merge any locally preserved enrollments for educator
        if (isEducator) {
          try {
            const localEnrolledIds = JSON.parse(localStorage.getItem("enrolled_courses") || "[]");
            const existingIds = new Set(enrolled.map(c => String(c._id || c.title)));
            allCatalogCourses.forEach(c => {
              if (c && (localEnrolledIds.includes(c._id) || (wallet && localStorage.getItem(`enrolled_${wallet.toLowerCase()}_${c._id}`) === "true"))) {
                if (!existingIds.has(String(c._id)) && !existingIds.has(String(c.title))) {
                  enrolled.push(c);
                  existingIds.add(String(c._id));
                }
              }
            });
          } catch (e) {}
        }

        // Ensure student retains lifetime access to all purchased/enrolled courses even if deleted by author
        if (!isEducator) {
          enrolled = enrolled.filter(c =>
            c &&
            c._id !== '6af89d7ae927a30c7d237d38' &&
            !(c.title && c.title.toLowerCase().trim() === 'java') &&
            c._id !== '6af8a5116732461498652ae6' &&
            !(c.title && (c.title.toLowerCase().includes('c++') || c.title.toLowerCase().includes('cpp')))
          );
        }
        purchasedCourses(enrolled);
        if (wallet || studentName) {
          localStorage.setItem(`student_enrolled_courses_${(wallet || studentName).toLowerCase()}`, JSON.stringify(enrolled));
        }
      } catch (error) {
        console.warn('Failed to fetch courses:', error);
        if (wallet || studentName) {
          try {
            const cached = JSON.parse(localStorage.getItem(`student_enrolled_courses_${(wallet || studentName).toLowerCase()}`) || "[]");
            if (cached.length > 0) purchasedCourses(cached);
          } catch (e) {}
        }
      }
    };

    fetchCourses();
  }, [walletAddress]);

  const handleWalletClick = () => {
    console.log("Wallet Address:", walletAddress);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("Wallet address copied to clipboard!");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };


  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);


  const isEducator = localStorage.getItem("role") === "educator";

  const disconnectWallet = () => {
    setIsMenuOpen(false);
    window.location.href = "/";
  };
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const filteredCourses = purchased.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVisitCourse = (course) => {
    navigate(`/mylearning/${course.title}`, { state: { course } });
  };

  const DashboardDropdown = () => (
    <div className="relative group" ref={menuRef}>
      <button
        onClick={() => account && setIsMenuOpen(!isMenuOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${account
            ? 'hover:bg-opacity-20 hover:bg-white'
            : 'opacity-50 cursor-not-allowed'
          }`}
        disabled={!account}
      >
        <span>☰</span>
        <div className={`transform transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {isMenuOpen && (
        <div className={`absolute top-12 right-0 w-64 rounded-xl shadow-2xl p-2 ${darkMode ?
            'bg-gray-800 border border-gray-700' :
            'bg-white border border-gray-200'
          }`}>
          <Link to="/coins">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-10 hover:bg-white">
              <RiCoinsLine className="text-xl" />
              Transaction
            </button>
          </Link>
          <Link to="/mylearning">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-10 hover:bg-white">
              <BiBook className="text-xl" />
              My Learning
            </button>
          </Link>
          <Link to="/redeem">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-10 hover:bg-white">
              <BiGift className="text-xl" />
              Redeem
            </button>
          </Link>
        </div>
      )}
    </div>
  );

  const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", bounce: 0.4, duration: 0.8 }
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-br from-black via-gray-900 to-gray-800 text-gray-100"
          : "bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900"
      } transition-colors duration-300`}
    >
      {/* Navigation Header */}
      <nav
        className={`flex justify-between items-center p-6 border-b ${
          isDarkMode
            ? "border-amber-500/20 bg-black/40"
            : "border-slate-200/80 bg-white/85 shadow-sm"
        } backdrop-blur-md sticky top-0 z-40`}
      >
        <div className="flex items-center space-x-2">
          <img
            src="/images/Edusphere logo.png"
            alt="Logo"
            className="w-12 h-12 rounded-full shadow-lg"
          />

          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Edusphere</h1>
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex space-x-8">
            <Link
              to={isEducator ? "/educatorhome" : "/studenthome"}
              className={`group relative text-lg font-medium ${
                isDarkMode ? "hover:text-amber-400" : "text-slate-700 hover:text-amber-600 font-semibold"
              } transition-colors`}
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/courses"
              className={`group relative text-lg font-medium ${
                isDarkMode ? "hover:text-amber-400" : "text-slate-700 hover:text-amber-600 font-semibold"
              } transition-colors`}
            >
              Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {!isEducator && (
              <Link
                to="/my-test-marks"
                className={`group relative text-lg font-medium ${
                  isDarkMode ? "hover:text-amber-400" : "text-slate-700 hover:text-amber-600 font-semibold"
                } transition-colors`}
              >
                Test Review
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
            {!isEducator && (
              <Link
                to="/contest"
                className={`group relative text-lg font-medium ${
                  isDarkMode ? "hover:text-amber-400" : "text-slate-700 hover:text-amber-600 font-semibold"
                } transition-colors`}
              >
                Contest
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
          </div>

          {/* Wallet Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${walletConnected ?
                'bg-emerald-500/20 text-emerald-400' :
                'bg-amber-500 hover:bg-amber-600 text-white'
              } transition-colors`}
            onClick={walletConnected ? handleWalletClick : connectWallet}
          >
            {walletConnected ? (
              <>
                <span className="hidden sm:inline">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <FiCopy
                  className="hover:text-amber-400 transition-colors"
                  onClick={copyToClipboard}
                  data-tooltip-id="copy-tooltip"
                />
              </>
            ) : (
              <>
                <span>Connect Wallet</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1.323l3.954.99a1 1 0 01.686.828L15.667 8H17a1 1 0 110 2h-1.333l-.012.082a5 5 0 01-4.245 4.245L11 14.667V17a1 1 0 11-2 0v-2.333l-.082-.012a5 5 0 01-4.245-4.245L4.333 10H3a1 1 0 110-2h1.333l.027-.86a1 1 0 01.686-.827L9 4.323V3a1 1 0 011-1z" />
                </svg>
              </>
            )}
          </motion.button>

          {/* Theme toggle */}
          <button className="dark-mode-toggle text-3xl" onClick={toggleTheme}>
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <ThreeLineMenu isEducator={isEducator} isDarkMode={isDarkMode} />
        </div>
      </nav>

      <div className="pt-12 px-8 pb-16 max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-5xl font-black mb-4 ${
              isDarkMode
                ? "text-white"
                : "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent"
            }`}
          >
            My Learning
          </motion.h1>
          <p className={`text-base max-w-2xl mx-auto mb-8 ${isDarkMode ? "text-gray-300" : "text-slate-600"}`}>
            Track your ongoing progress, access enrolled course lectures, and review study materials with lifetime access.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search your courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-6 py-3.5 rounded-xl border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  : "bg-white/95 border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm focus:border-amber-400"
              } pr-12 transition-all focus:outline-none`}
            />
            <FiBookOpen className={`absolute right-4 top-4 text-xl ${isDarkMode ? "text-gray-400" : "text-amber-500"}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.2 }}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                isDarkMode
                  ? "bg-gray-800/90 border border-gray-700 shadow-lg"
                  : "bg-white/95 border border-slate-200/90 shadow-xl shadow-slate-200/50 hover:border-amber-300 hover:shadow-amber-100/60"
              }`}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={
                    course.course_image?.startsWith('http://') ||
                    course.course_image?.startsWith('https://') ||
                    course.course_image?.startsWith('/')
                      ? course.course_image
                      : "https://ipfs.io/ipfs/" + course.course_image
                  }
                  alt={course.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
                  }}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                {
                course.category.map((category, index) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isDarkMode ?
                  'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {category}
                </span>
                ))}
                  <div className="flex items-center gap-2 text-sm">
                    <FiClock className={isDarkMode ? 'text-gray-400' : 'text-slate-500'} />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-slate-600'}>{course.updatedAt.slice(0,10)}</span>
                  </div>
                </div>

                <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                  {course.title}
                </h3>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${course.course_price === 0 ? 'bg-emerald-500' : 'bg-blue-500'
                      }`} />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>
                      {course.course_price === 0 ? 'Completed' : 'In Progress'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleVisitCourse(course)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20'
                    }`}
                  >
                    Continue
                    <FiChevronRight className="text-lg" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${Math.random() * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-8 rounded-2xl bg-gradient-to-r from-purple-100 to-blue-100">
              <FiBookOpen className="text-6xl text-purple-600 mx-auto mb-6" />
              <h3 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                No courses found
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                Start your learning journey by exploring our courses
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`py-8 text-center ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'
        } backdrop-blur-lg border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'
        }`}>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
          © 2025 Edusphere. All rights reserved.<br />
          Empowering learners through blockchain technology
        </p>
      </footer>
    </div>
  );
};

export default MyLearningPage;
