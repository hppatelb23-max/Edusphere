import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiDollarSign,
  FiBook,
  FiGift,
  FiCopy,
  FiPlay,
  FiVideo,
  FiShield,
  FiArrowLeft,
  FiAlertTriangle
} from "react-icons/fi";
import { useTheme } from "next-themes";
import { useThemeStore } from "../store/themeStore";
import { useWallet } from "../context/WalletProvider";
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../utils/api';

const CourseDetails1 = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const initialCourse = state?.course || null;

  const [course, setCourse] = useState(initialCourse);
  const [loadingCourse, setLoadingCourse] = useState(!initialCourse);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoErrorFallback, setVideoErrorFallback] = useState(false);

  // Navbar / Theme / Wallet
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { setTheme } = useTheme();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Toggle Theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.info("Wallet address copied to clipboard!");
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch course if not in state
  useEffect(() => {
    const courseLookupId = id || course?._id || course?.title;
    if (!courseLookupId) return;

    const fetchCourse = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/courses/${encodeURIComponent(courseLookupId)}`);
        if (res.status === 200 && res.data?.course) {
          setCourse(res.data.course);
          return;
        }
      } catch (e) {
        try {
          const allRes = await axios.get(`${API_BASE_URL}/courses`);
          if (allRes.data?.courses) {
            const found = allRes.data.courses.find(
              (c) =>
                c._id === courseLookupId ||
                (c.title && c.title.toLowerCase().trim() === decodeURIComponent(courseLookupId).toLowerCase().trim())
            );
            if (found) setCourse(found);
          }
        } catch (err) {}
      } finally {
        setLoadingCourse(false);
      }
    };

    fetchCourse();
  }, [id]);

  // Video list
  const rawVideos = course?.course_video;
  const videosList = Array.isArray(rawVideos)
    ? rawVideos
    : rawVideos
    ? [rawVideos]
    : [];

  const resolveVideoUrl = (item) => {
    if (!item) return "";
    const urlStr = typeof item === "string" ? item : item.url || item.video_url || "";
    if (
      urlStr.startsWith("http://") ||
      urlStr.startsWith("https://") ||
      urlStr.startsWith("blob:") ||
      urlStr.startsWith("/")
    ) {
      return urlStr;
    }
    return `https://ipfs.io/ipfs/${urlStr}`;
  };

  const currentVideoItem = videosList[activeVideoIndex] || null;
  const currentVideoUrl = resolveVideoUrl(currentVideoItem);

  const fallbackSampleVideo =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const activeVideoUrl =
    videoErrorFallback || !currentVideoUrl
      ? currentVideoUrl || fallbackSampleVideo
      : currentVideoUrl;

  const currentVideoTitle =
    (typeof currentVideoItem === "object" && currentVideoItem?.title) ||
    `Lesson ${activeVideoIndex + 1}: ${course?.title || "Lecture Video"}`;

  const currentVideoDescription =
    (typeof currentVideoItem === "object" && currentVideoItem?.description) ||
    course?.description ||
    "Watch the complete lesson video above.";

  const thumbnailUrl =
    course?.course_image?.startsWith("http://") ||
    course?.course_image?.startsWith("https://") ||
    course?.course_image?.startsWith("/")
      ? course.course_image
      : course?.course_image
      ? `https://ipfs.io/ipfs/${course.course_image}`
      : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";

  if (loadingCourse) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-950 text-white" : "bg-amber-50 text-gray-900"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-400 font-bold text-lg">Loading Course Video Lesson...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-6 ${
          isDarkMode ? "bg-gray-950 text-white" : "bg-amber-50 text-gray-900"
        }`}
      >
        <FiAlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
        <Link
          to="/mylearning"
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all"
        >
          Back to My Learning
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-950 text-white" : "bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900"
      } transition-colors duration-300`}
    >
      {/* ── Top Navbar ──────────────────────────────────────────────── */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <img src="/images/Edusphere logo.png" alt="Logo" className="w-10 h-10 rounded-full shadow-lg" />
          <span className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Edusphere
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-6 text-sm font-medium">
            <Link to="/courses" className="hover:text-amber-400 transition-colors">
              Courses
            </Link>
            <Link to="/tests" className="hover:text-amber-400 transition-colors">
              Assessments
            </Link>
            <Link to="/mylearning" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
              My Learning
            </Link>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs bg-emerald-500/15 border border-emerald-400/40 text-emerald-400 shadow-md transition-all"
            onClick={copyToClipboard}
          >
            <FiShield className="w-3.5 h-3.5" />
            <span>{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connected"}</span>
            <FiCopy className="w-3.5 h-3.5 text-gray-400 hover:text-emerald-300 ml-1" />
          </motion.button>

          <button
            className="p-2 text-xl rounded-full hover:bg-amber-500/10 transition-colors"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </nav>

      {/* ── Distinct Dividing Line ──────────────────────────────────── */}
      <div className="w-full border-b border-amber-500/30 shadow-sm" />

      {/* ── 2-Column Layout ─────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link
            to="/mylearning"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors font-medium"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to My Learning</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800 lg:pr-8 pb-8 lg:pb-0">
            {/* Thumbnail in Box Shape with Border */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-amber-400/50 p-2 shadow-2xl bg-black/40 relative group">
              <img
                src={thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
                }}
              />
            </div>

            {/* Title in BOLD */}
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-5 mb-2 leading-tight text-white tracking-tight">
              {course.title}
            </h1>

            {/* Short Description in normal font */}
            <p className="text-sm font-normal text-gray-300 leading-relaxed mb-5">
              {course.description}
            </p>

            <div className="space-y-3 pt-4 border-t border-gray-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Instructor:</span>
                <span className="font-semibold text-amber-400">{course.author_name || "Faculty"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Lessons:</span>
                <span className="font-bold text-white bg-gray-800 px-2 py-0.5 rounded">
                  {videosList.length} Lessons
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="w-full rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl relative">
              {videosList.length > 0 ? (
                <video
                  key={activeVideoUrl}
                  controls
                  playsInline
                  poster={thumbnailUrl}
                  className="w-full aspect-video object-contain bg-black rounded-2xl"
                  src={activeVideoUrl}
                  onError={() => setVideoErrorFallback(true)}
                >
                  <source src={activeVideoUrl} type="video/mp4" />
                  <source src={fallbackSampleVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full aspect-video flex flex-col items-center justify-center p-8 text-center bg-gray-900/80">
                  <FiVideo className="w-16 h-16 text-gray-600 mb-3" />
                  <h3 className="text-xl font-bold mb-1">No Video Available</h3>
                  <p className="text-xs text-gray-400">Lesson videos will appear here once published.</p>
                </div>
              )}
            </div>

            {/* Video Title and Description */}
            <div className="mt-5 p-5 rounded-2xl bg-gray-900/60 border border-gray-800">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                {currentVideoTitle}
              </h2>
              <p className="text-sm font-normal text-gray-300 leading-relaxed">
                {currentVideoDescription}
              </p>

              {videosList.length > 1 && (
                <div className="mt-6 pt-4 border-t border-gray-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-3">
                    Course Lessons ({videosList.length})
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {videosList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveVideoIndex(idx);
                          setVideoErrorFallback(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                          activeVideoIndex === idx
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25 scale-[1.02]"
                            : "bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700"
                        }`}
                      >
                        <FiPlay className="w-3.5 h-3.5" />
                        <span>Lesson {idx + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 mt-16 border-t border-gray-800">
        <p>&copy; 2026 Edusphere | Blockchain E-Learning Platform</p>
      </footer>
    </div>
  );
};

export default CourseDetails1;
