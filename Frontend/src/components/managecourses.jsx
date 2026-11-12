import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { FaChevronDown } from "react-icons/fa";
import { FiUser, FiBook, FiCopy } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from "../store/themeStore";
import { useWallet } from "../context/WalletProvider";
import { useTheme } from "next-themes";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL, getCookie } from "../utils/api";

const ManageCourses = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const [courses, setCourses] = useState([]);

  const dropdownRef = useRef(null);

  const handleWalletClick = () => {
    console.log("Wallet Address:", walletAddress);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("Wallet address copied to clipboard!");
  };

  const [filterStatus, setFilterStatus] = useState("all");

  const [menuOpen, setMenuOpen] = useState(false);

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


  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = getCookie("admin");
        if (!token) {
          console.log("No educator session token found");
          setCourses([]);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/admin/get-courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200 && response.data?.courses) {
          const list = response.data.courses;
          const seenIds = new Set();
          const seenTitles = new Set();
          const unique = [];

          list.forEach((c) => {
            if (!c) return;
            const sid = c._id ? c._id.toString() : null;
            const normTitle = (c.title || "").toLowerCase().trim();
            if ((!sid || !seenIds.has(sid)) && (!normTitle || !seenTitles.has(normTitle))) {
              if (sid) seenIds.add(sid);
              if (normTitle) seenTitles.add(normTitle);
              unique.push(c);
            }
          });

          setCourses(unique);
        } else {
          setCourses([]);
        }

      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setCourses([]);
      }
    };

    fetchCourses();
  }, []);

  const handleDeleteCourse = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this course?");
    if (confirmDelete) {
      const token = getCookie("admin");
      if (!token) {
        toast.error("Educator is not logged in");
        return;
      }
      try {
        const response = await axios.post(`${API_BASE_URL}/admin/delete-course`, {
          courseid: id
        },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success(response.data.message || "Course deleted successfully");
          setCourses(response.data.courses || []);
        } else {
          toast.error(response.data.error || "Failed to delete course");
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        toast.error(error.response?.data?.error || "Error deleting course");
      }
    }
  };

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900"}`}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }
      `}</style>

      <nav className={`flex justify-between items-center p-5 px-8 ${isDarkMode ? "bg-gray-900/80 border-b border-gray-700/50" : "bg-white/90 backdrop-blur-sm border-b border-amber-200/70 shadow-sm"} sticky top-0 z-40`}>
        <div className="flex items-center space-x-2">
          <img
            src="/images/Edusphere logo.png"
            alt="Logo"
            className="w-12 h-12 rounded-full shadow-lg"
          />

          <h1 className="text-4xl font-bold ">Edusphere</h1>
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex space-x-8">
            <Link
              to="/educatorhome"
              className="group relative text-lg font-medium hover:text-amber-500 transition-colors"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/createcourses"
              className="group relative text-lg font-medium hover:text-amber-500 transition-colors"
            >
              Create Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
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

          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className={`text-lg bg-gradient-to-r from-amber-500 to-amber-300 text-black py-2 px-4 rounded-full ${walletAddress ? "" : "cursor-not-allowed opacity-50"
                }`}
              disabled={!walletAddress}
            >
              ☰
            </button>
            <AnimatePresence>
              {dropdownOpen && walletAddress && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-64 origin-top-right rounded-xl shadow-xl backdrop-blur-lg ${isDarkMode
                      ? "bg-gray-800/95 border border-gray-700"
                      : "bg-white/95 border border-amber-100"
                    } z-50`}
                >
                  <div className="p-2 space-y-1">
                    <Link
                      to="/signup"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiUser className="text-amber-500" />
                      <span>Add Details</span>
                    </Link>


                    <Link
                      to="/managecourses"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiBook className="text-amber-500" />
                      <span>Manage Courses</span>
                    </Link>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
      <div className={isDarkMode ? "border-b border-gray-700/50" : "border-b border-amber-200/60"}></div>

      <div className="container mx-auto p-6 pt-8">
        <div className="mb-7">
          <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>My Courses</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-amber-700/60'}`}>Manage and view all your published courses</p>
          <div className={`mt-3 h-1 w-20 rounded-full ${isDarkMode ? 'bg-amber-500' : 'bg-gradient-to-r from-amber-400 to-amber-300'}`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className={`col-span-3 text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-amber-700/70'}`}>
              <p className="text-xl font-semibold mb-2">No courses yet</p>
              <p className="text-sm">Create your first course to see it here.</p>
            </div>
          ) : courses.map((course, index) => (
            <div
              key={course._id}
              className={`animate-fade-in-up rounded-2xl transition-all duration-300 overflow-hidden ${isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white shadow-lg shadow-black/30"
                  : "bg-white hover:bg-amber-50/60 text-gray-900 shadow-lg shadow-amber-100/80 border border-amber-200/70 hover:border-amber-300 hover:shadow-amber-200/60"
                } transform hover:-translate-y-1`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={
                  course.course_image?.startsWith('http://') ||
                  course.course_image?.startsWith('https://') ||
                  course.course_image?.startsWith('/')
                    ? course.course_image
                    : "https://gateway.pinata.cloud/ipfs/" + course.course_image
                }
                alt={course.title}
                className="w-full h-44 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="p-5">
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{course.title}</h3>
                <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{(course.description || '').slice(0, 100) + "..."}</p>
                {/* Course content */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    onClick={() => navigate(`/course/${course._id || course.title}`, { state: { course } })}
                    className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300 transition-all shadow-md shadow-amber-200/50 active:scale-95 flex items-center gap-1.5"
                  >
                    <FiBook className="w-4 h-4" />
                    <span>View Course & Videos</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-300 ${isDarkMode
                        ? "bg-red-600/30 text-red-300 border border-red-500/40 hover:bg-red-600 hover:text-white"
                        : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white"
                      } transform hover:scale-105 active:scale-95`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageCourses;