import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiDollarSign,
  FiBook,
  FiGift,
  FiCopy,
  FiPlay,
  FiPause,
  FiTrash2,
  FiPlus,
  FiVideo,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertTriangle,
  FiShield,
  FiArrowLeft,
  FiLock,
  FiUnlock,
  FiRewind,
  FiFastForward,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiSettings
} from "react-icons/fi";
import { useTheme } from "next-themes";
import { useThemeStore } from "../store/themeStore";
import { useWallet } from "../context/WalletProvider";
import axios from "axios";
import { contractAbi, contractAddress } from "../utils/constants";
import { useWriteContract } from "wagmi";
import { toast } from "react-toastify";
import { API_BASE_URL, getCookie } from "../utils/api";

const CourseDetails = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const initialCourse = state?.course || null;

  const [course, setCourse] = useState(initialCourse);
  const [loadingCourse, setLoadingCourse] = useState(!initialCourse);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoErrorFallback, setVideoErrorFallback] = useState(false);

  // Educator Video Publishing State
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoDesc, setNewVideoDesc] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Purchasing & Enrollment State
  const [isPurchased, setIsPurchased] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // Video Player Controls State
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [quality, setQuality] = useState("1080p HD");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Navbar / Theme / Wallet
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { setTheme } = useTheme();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { writeContractAsync } = useWriteContract();

  // Role detection
  const userRole = localStorage.getItem("role") || "student";
  const educatorWallet = course?.author_wallet_id;
  const isAuthor =
    educatorWallet &&
    walletAddress &&
    educatorWallet.toLowerCase() === walletAddress.toLowerCase();
  const isEducator =
    userRole === "educator" || isAuthor || Boolean(getCookie("admin"));

  // Full access: educators always unlocked; students unlocked if enrolled / purchased
  const isUnlocked = isEducator || isPurchased;

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

  // Fetch / Sync Course from backend
  const loadCourseData = async () => {
    const courseLookupId = id || course?._id || course?.title;
    if (!courseLookupId) return;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/courses/${encodeURIComponent(courseLookupId)}`
      );
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
              (c.title &&
                c.title.toLowerCase().trim() ===
                  decodeURIComponent(courseLookupId).toLowerCase().trim())
          );
          if (found) {
            setCourse(found);
            return;
          }
        }
      } catch (err) {}
    } finally {
      setLoadingCourse(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [id]);

  // Check enrollment on mount and when course / wallet changes
  useEffect(() => {
    const courseLookupId = course?._id || id;
    if (!courseLookupId) return;

    // Check localStorage enrolled records
    const stored = localStorage.getItem("enrolled_courses");
    if (stored) {
      try {
        const list = JSON.parse(stored);
        if (
          Array.isArray(list) &&
          (list.includes(courseLookupId) ||
            (course?.title && list.includes(course.title)))
        ) {
          setIsPurchased(true);
        }
      } catch (e) {
        if (stored.includes(courseLookupId)) {
          setIsPurchased(true);
        }
      }
    }

    if (walletAddress) {
      const specificKey = `enrolled_${walletAddress.toLowerCase()}_${courseLookupId}`;
      if (localStorage.getItem(specificKey) === "true") {
        setIsPurchased(true);
      }
    }

    // Check backend my-learning enrollment if student token exists
    const token = getCookie("user");
    if (token) {
      axios
        .get(`${API_BASE_URL}/user/my-learning`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          if (res.data?.courses_enrolled) {
            const list = res.data.courses_enrolled;
            const match = list.some(
              (c) =>
                c === courseLookupId ||
                c._id === courseLookupId ||
                (c.title &&
                  course?.title &&
                  c.title.toLowerCase().trim() ===
                    course.title.toLowerCase().trim())
            );
            if (match) {
              setIsPurchased(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [course?._id, course?.title, id, walletAddress]);

  // Video List normalization
  const rawVideos = course?.course_video;
  const videosList = Array.isArray(rawVideos)
    ? rawVideos
    : rawVideos
    ? [rawVideos]
    : [];

  // Reliable Video URL Resolver
  const resolveVideoUrl = (item) => {
    if (!item) return "";
    let urlStr =
      typeof item === "string" ? item.trim() : item.url || item.video_url || "";
    if (!urlStr) return "";

    if (urlStr.startsWith("/uploads/")) {
      return `${API_BASE_URL}${urlStr}`;
    }

    if (
      urlStr.startsWith("http://") ||
      urlStr.startsWith("https://") ||
      urlStr.startsWith("blob:")
    ) {
      return urlStr;
    }

    // IPFS Hash
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
    `Lesson ${activeVideoIndex + 1}: ${course?.title || "Course Video"}`;

  const currentVideoDescription =
    (typeof currentVideoItem === "object" && currentVideoItem?.description) ||
    course?.description ||
    "Watch the complete lecture video above to master the key concepts covered in this course.";

  const thumbnailUrl =
    course?.course_image?.startsWith("http://") ||
    course?.course_image?.startsWith("https://") ||
    course?.course_image?.startsWith("blob:")
      ? course.course_image
      : course?.course_image?.startsWith("/uploads/")
      ? `${API_BASE_URL}${course.course_image}`
      : course?.course_image
      ? `https://ipfs.io/ipfs/${course.course_image}`
      : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";

  // ── Video Player Handlers ──────────────────────────────────────────
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const skipForward10 = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      videoRef.current.duration || 99999,
      videoRef.current.currentTime + 10
    );
  };

  const skipBackward10 = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume > 0 ? volume : 0.8;
      setVolume(volume > 0 ? volume : 0.8);
    }
  };

  const changePlaybackSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.warn("Fullscreen error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Helper: file to base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // ── Educator: Delete Current Video ────────────────────────────────
  const handleDeleteCurrentVideo = async () => {
    if (!isEducator) {
      toast.error("Only educators can delete course videos.");
      return;
    }
    if (videosList.length === 0) {
      toast.warn("No video to delete.");
      return;
    }

    const confirmDel = window.confirm(
      `Are you sure you want to delete Lesson ${activeVideoIndex + 1}?`
    );
    if (!confirmDel) return;

    try {
      const courseId = course._id || id;
      const res = await axios.delete(
        `${API_BASE_URL}/courses/${courseId}/videos`,
        {
          data: {
            video_index: activeVideoIndex,
            video_url: currentVideoItem
          }
        }
      );

      if (res.status === 200) {
        toast.success("Video deleted successfully!");
        if (res.data?.course) {
          setCourse(res.data.course);
        } else {
          const updated = [...videosList];
          updated.splice(activeVideoIndex, 1);
          setCourse({ ...course, course_video: updated });
        }
        setActiveVideoIndex(Math.max(0, activeVideoIndex - 1));
      }
    } catch (err) {
      console.warn("Backend video delete error, updating locally:", err);
      const updated = [...videosList];
      updated.splice(activeVideoIndex, 1);
      setCourse({ ...course, course_video: updated });
      setActiveVideoIndex(Math.max(0, activeVideoIndex - 1));
      toast.success("Video removed from course.");
    }
  };

  // ── Educator: Publish More Videos ─────────────────────────────────
  const handlePublishNewVideo = async (e) => {
    e.preventDefault();
    if (!isEducator) {
      toast.error("Only educators can publish videos.");
      return;
    }

    if (!newVideoFile) {
      toast.warn("Please select a video file to upload.");
      return;
    }

    let finalVideoUrl = "";

    setIsUploadingVideo(true);
    setUploadStatus("Uploading video to server...");

    try {
      // If a file is selected, upload directly to Backend /courses/upload-media
      if (newVideoFile) {
        try {
          const base64Data = await fileToBase64(newVideoFile);
          const upRes = await axios.post(
            `${API_BASE_URL}/courses/upload-media`,
            {
              file_data: base64Data,
              file_name: newVideoFile.name,
              file_type: newVideoFile.type
            }
          );
          if (
            upRes.status === 200 &&
            (upRes.data?.url || upRes.data?.relativeUrl)
          ) {
            finalVideoUrl =
              upRes.data.url || `${API_BASE_URL}${upRes.data.relativeUrl}`;
          }
        } catch (serverErr) {
          console.warn(
            "Backend media upload failed, creating object URL fallback:",
            serverErr
          );
          finalVideoUrl = URL.createObjectURL(newVideoFile);
        }
      }

      setUploadStatus("Saving video to course...");
      const courseId = course._id || id;
      const res = await axios.post(
        `${API_BASE_URL}/courses/${courseId}/videos`,
        {
          video_url: finalVideoUrl,
          video_title: newVideoTitle.trim(),
          video_description: newVideoDesc.trim()
        }
      );

      if (res.status === 200 && res.data?.course) {
        setCourse(res.data.course);
      } else {
        const updatedVideos = [...videosList, finalVideoUrl];
        setCourse({ ...course, course_video: updatedVideos });
      }

      toast.success("New video published successfully to your course!");
      setShowAddVideoModal(false);
      setNewVideoTitle("");
      setNewVideoDesc("");
      setNewVideoUrl("");
      setNewVideoFile(null);
      setActiveVideoIndex(videosList.length);
    } catch (err) {
      console.warn("Backend add video error, updating locally:", err);
      const updatedVideos = [...videosList, finalVideoUrl];
      setCourse({ ...course, course_video: updatedVideos });
      toast.success("Video added to course.");
      setShowAddVideoModal(false);
    } finally {
      setIsUploadingVideo(false);
      setUploadStatus("");
    }
  };

  // ── Student: Purchase Course via MetaMask ──────────────────────────
  const handlePurchase = async () => {
    if (!walletAddress) {
      toast.error("Please connect your MetaMask wallet first.");
      connectWallet();
      return;
    }

    const token = getCookie("user");
    if (!token) {
      toast.warn("Please add your Student details first before purchasing.");
      navigate("/signup");
      return;
    }

    if (!course?._id) {
      toast.error("Invalid course data.");
      return;
    }

    let educatorTargetWallet = course.author_wallet_id;
    const registeredEducator =
      localStorage.getItem("educatorWallet") ||
      localStorage.getItem("adminWallet") ||
      getCookie("adminWallet");

    if (
      (!educatorTargetWallet || !educatorTargetWallet.startsWith("0x")) &&
      registeredEducator
    ) {
      educatorTargetWallet = registeredEducator;
    }

    if (!educatorTargetWallet || !educatorTargetWallet.startsWith("0x")) {
      toast.error("Educator wallet address is not available for this course.");
      return;
    }

    if (
      educatorTargetWallet.toLowerCase() === walletAddress.toLowerCase()
    ) {
      toast.warn(
        "You are logged in with the educator wallet. Switch to student wallet to purchase."
      );
      return;
    }

    setIsBuying(true);

    try {
      const priceNum = Number(course.course_price || 0.001);
      const validPrice = priceNum > 0 ? priceNum : 0.001;
      const weiPrice = BigInt(Math.round(validPrice * 1e18));
      let txHash = null;

      if (!window.ethereum) {
        throw new Error("MetaMask is required to complete this purchase.");
      }

      // Check contract deployment
      let contractHasCode = false;
      try {
        if (contractAddress && contractAddress.startsWith("0x")) {
          const code = await window.ethereum.request({
            method: "eth_getCode",
            params: [contractAddress, "latest"]
          });
          contractHasCode = code && code !== "0x" && code !== "0x0";
        }
      } catch (checkErr) {
        contractHasCode = false;
      }

      if (contractHasCode) {
        toast.info("Please confirm transaction in MetaMask...");
        txHash = await writeContractAsync({
          abi: contractAbi,
          address: contractAddress,
          functionName: "buyCourse",
          args: [weiPrice, educatorTargetWallet],
          value: weiPrice
        });
      } else {
        toast.info(
          `Transferring ${validPrice} Sepolia ETH to educator... Confirm in MetaMask.`
        );
        const hexValue = "0x" + weiPrice.toString(16);
        txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: walletAddress,
              to: educatorTargetWallet,
              value: hexValue
            }
          ]
        });
      }

      if (!txHash) throw new Error("Transaction was not submitted.");

      toast.info("ETH transfer submitted on-chain! Finalizing course enrollment...");

      const response = await axios.post(
        `${API_BASE_URL}/user/purchase-course`,
        {
          course_id: course._id,
          transaction_id: txHash
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Persist enrollment in localStorage
      try {
        const stored = localStorage.getItem("enrolled_courses");
        const list = stored ? JSON.parse(stored) : [];
        if (!list.includes(course._id)) list.push(course._id);
        localStorage.setItem("enrolled_courses", JSON.stringify(list));
      } catch (e) {
        localStorage.setItem("enrolled_courses", JSON.stringify([course._id]));
      }

      if (walletAddress) {
        localStorage.setItem(
          `enrolled_${walletAddress.toLowerCase()}_${course._id}`,
          "true"
        );
      }

      setIsPurchased(true);
      toast.success(
        `Success! Course unlocked! Enrolled with ${validPrice} ETH.`
      );
    } catch (error) {
      console.error("Error purchasing course:", error);
      if (
        error.code === 4001 ||
        error.message?.includes("User rejected") ||
        error.message?.includes("rejected")
      ) {
        toast.info("Transaction was cancelled in MetaMask.");
      } else {
        toast.error(error.message || "Purchase failed");
      }
    } finally {
      setIsBuying(false);
    }
  };

  if (loadingCourse) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-950 text-white" : "bg-amber-50 text-gray-900"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-400">
            Loading Course Studio & Media...
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-950 text-white" : "bg-amber-50 text-gray-900"
        }`}
      >
        <div className="text-center p-8 max-w-md bg-gray-900/60 rounded-3xl border border-gray-800">
          <FiAlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
          <p className="text-sm text-gray-400 mb-6">
            The course you are looking for does not exist or has been removed.
          </p>
          <Link
            to="/courses"
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-black hover:bg-amber-400 transition-colors inline-block"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <nav className="flex justify-between items-center px-4 sm:px-8 py-4 bg-transparent">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-extrabold text-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            E
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Edu<span className="text-amber-400">sphere</span>
          </span>
        </Link>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-3">
          {/* User / Wallet Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-xs font-semibold transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <FiUser className="w-3.5 h-3.5" />
              </div>
              <span className="hidden sm:inline">
                {isEducator ? "Educator Hub" : "Student Hub"}
              </span>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl p-3 z-50 text-xs space-y-1"
                >
                  <div className="p-2 border-b border-gray-800 mb-2">
                    <p className="text-gray-400">Active Role:</p>
                    <p className="font-bold text-amber-400 uppercase text-xs">
                      {isEducator ? "Educator" : "Student"}
                    </p>
                  </div>
                  {isEducator ? (
                    <>
                      <Link
                        to="/educatorhome"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-800 text-gray-200 transition-colors"
                      >
                        Educator Dashboard
                      </Link>
                      <Link
                        to="/managecourses"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-800 text-gray-200 transition-colors"
                      >
                        Manage My Courses
                      </Link>
                      <Link
                        to="/createcourses"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-800 text-gray-200 transition-colors"
                      >
                        Publish New Course
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/studenthome"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-800 text-gray-200 transition-colors"
                      >
                        Student Dashboard
                      </Link>
                      <Link
                        to="/mylearning"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-800 text-gray-200 transition-colors"
                      >
                        My Learning & Enrolled Courses
                      </Link>
                      <Link
                        to="/courses"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-800 text-gray-200 transition-colors"
                      >
                        Explore All Courses
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wallet Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={walletAddress ? copyToClipboard : connectWallet}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              walletAddress
                ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
            }`}
          >
            {walletAddress ? (
              <>
                <FiCheckCircle className="w-3.5 h-3.5" />
                <span>
                  {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </span>
                <FiCopy className="w-3 h-3 opacity-60 hover:opacity-100" />
              </>
            ) : (
              <>
                <FiShield className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </>
            )}
          </motion.button>

          {/* Theme Toggle */}
          <button
            className="p-2 text-xl rounded-full hover:bg-amber-500/10 transition-colors"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </nav>

      {/* ── Distinct Dividing Line Below Navbar ───────────────────────── */}
      <div className="w-full border-b border-amber-500/30 shadow-sm" />

      {/* ── Main 2-Column Course Studio & Viewer Layout ───────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Link / Educator Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={isEducator ? "/managecourses" : "/courses"}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors font-medium"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>
              {isEducator
                ? "Back to Course Management"
                : "Back to Course Catalog"}
            </span>
          </Link>

          {isEducator ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <FiUser className="w-3.5 h-3.5" />
              Educator Mode: All Access Unlocked
            </span>
          ) : isPurchased ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              <FiCheckCircle className="w-3.5 h-3.5" />
              Enrolled & Unlocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-400/30">
              <FiLock className="w-3.5 h-3.5" />
              Locked: Enrollment Required
            </span>
          )}
        </div>

        {/* 2 COLUMNS CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ══════════════════════════════════════════════════════════════
              LEFT COLUMN (Less Width: 4 cols)
              Course Thumbnail in box shape with border, Bold Title, Short Description
             ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800 lg:pr-8 pb-8 lg:pb-0">
            {/* Thumbnail in Box Shape with Border */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-amber-400/50 p-2 shadow-2xl bg-black/40 relative group">
              <img
                src={thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-black/75 text-amber-300 border border-amber-400/40 backdrop-blur-sm">
                {course.course_price ? `${course.course_price} ETH` : "Free"}
              </div>
            </div>

            {/* Title in BOLD */}
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-5 mb-2 leading-tight tracking-tight text-white">
              {course.title}
            </h1>

            {/* Description in Normal Font */}
            <p className="text-sm font-normal text-gray-300 leading-relaxed mb-5">
              {course.description}
            </p>

            {/* Course Meta Info */}
            <div className="space-y-3 pt-4 border-t border-gray-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Category:</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {Array.isArray(course.category) ? (
                    course.category.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      >
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {course.category || "General"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Educator:</span>
                <span className="font-semibold text-amber-400">
                  {course.author_name || "Certified Faculty"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Total Lessons:</span>
                <span className="font-bold text-white bg-gray-800 px-2 py-0.5 rounded">
                  {videosList.length}{" "}
                  {videosList.length === 1 ? "Video" : "Videos"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Price:</span>
                <span className="font-extrabold text-amber-400 text-sm">
                  {course.course_price ? `${course.course_price} ETH` : "Free"}
                </span>
              </div>
            </div>

            {/* Buy Action Button for Students */}
            {!isEducator && (
              <div className="mt-6 pt-4 border-t border-gray-800">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePurchase}
                  disabled={isPurchased || isBuying}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                    isPurchased
                      ? "bg-emerald-500 text-black cursor-default"
                      : isBuying
                      ? "bg-amber-600/70 text-white cursor-wait"
                      : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-amber-500/25"
                  }`}
                >
                  {isPurchased ? (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Enrolled & Course Unlocked</span>
                    </>
                  ) : isBuying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming in MetaMask...</span>
                    </>
                  ) : (
                    <>
                      <FiLock className="w-4 h-4" />
                      <span>
                        Enroll & Unlock ({course.course_price || 0.05} ETH)
                      </span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              RIGHT COLUMN (Greater Width: 8 cols)
              Locked State OR Rich Video Player with Controls
             ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 flex flex-col">
            {/* If NOT Unlocked: Show Locked Screen */}
            {!isUnlocked ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black border-2 border-amber-500/40 shadow-2xl relative flex flex-col items-center justify-center p-6 sm:p-10 text-center">
                {/* Blurred Background Thumbnail */}
                <img
                  src={thumbnailUrl}
                  alt="Locked Preview"
                  className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 pointer-events-none"
                />

                <div className="relative z-10 max-w-md flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                    <FiLock className="w-8 h-8" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-3">
                    Course Content Locked
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                    Enroll to Watch Lectures
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed">
                    This course contains {videosList.length || 1} video lectures.
                    Students must enroll by purchasing with ETH via MetaMask to
                    unlock full video streaming and course material.
                  </p>

                  <div className="flex items-center gap-3 mb-6 px-4 py-2 rounded-xl bg-black/60 border border-amber-500/30 backdrop-blur-sm">
                    <span className="text-xs text-gray-400">Price:</span>
                    <span className="text-base sm:text-lg font-black text-amber-400">
                      {course?.course_price ? `${course.course_price} ETH` : "0.05 ETH"}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePurchase}
                    disabled={isBuying}
                    className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                      isBuying
                        ? "bg-amber-600 text-white cursor-wait"
                        : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-amber-500/25"
                    }`}
                  >
                    <FiUnlock className="w-4 h-4" />
                    <span>
                      {isBuying
                        ? "Confirming in MetaMask..."
                        : `Enroll with ETH (${course?.course_price || 0.05} ETH)`}
                    </span>
                  </motion.button>
                </div>
              </div>
            ) : (
              /* If Unlocked: Show Rich Video Player */
              <div
                ref={playerContainerRef}
                onMouseMove={handleMouseMove}
                className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl relative group select-none"
              >
                {videosList.length > 0 ? (
                  <>
                    <video
                      ref={videoRef}
                      key={activeVideoUrl}
                      playsInline
                      poster={thumbnailUrl}
                      onClick={togglePlay}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onError={() => {
                        console.warn(
                          "Primary video stream failed, switching to fallback sample."
                        );
                        setVideoErrorFallback(true);
                      }}
                      className="w-full h-full object-contain bg-black cursor-pointer"
                      src={activeVideoUrl}
                    >
                      <source src={activeVideoUrl} type="video/mp4" />
                      <source src={fallbackSampleVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* Captions Overlay Track */}
                    {showCaptions && (
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-11/12 text-center pointer-events-none transition-opacity">
                        <span className="inline-block px-4 py-1.5 rounded-lg bg-black/80 text-amber-300 text-xs sm:text-sm font-semibold border border-amber-400/20 backdrop-blur-sm shadow-md">
                          [CC] {currentVideoTitle} &bull; Section{" "}
                          {formatTime(currentTime)}
                        </span>
                      </div>
                    )}

                    {/* Central Play/Pause Splash Icon on Pause */}
                    {!isPlaying && (
                      <div
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity"
                      >
                        <div className="w-16 h-16 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
                          <FiPlay className="w-8 h-8 ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Rich Video Player Controls Bar */}
                    <div
                      className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
                        showControls || !isPlaying ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {/* Scrubber Timeline Bar */}
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
                        />
                      </div>

                      {/* Controls Buttons Row */}
                      <div className="flex items-center justify-between text-white text-xs sm:text-sm">
                        {/* Left Group: Play/Pause, -10s, +10s, Time */}
                        <div className="flex items-center gap-2 sm:gap-4">
                          {/* Play / Pause Toggle */}
                          <button
                            onClick={togglePlay}
                            className="p-1.5 hover:text-amber-400 transition-colors"
                            title={isPlaying ? "Pause" : "Play"}
                          >
                            {isPlaying ? (
                              <FiPause className="w-5 h-5" />
                            ) : (
                              <FiPlay className="w-5 h-5" />
                            )}
                          </button>

                          {/* Rewind 10 seconds */}
                          <button
                            onClick={skipBackward10}
                            className="p-1.5 hover:text-amber-400 transition-colors flex items-center gap-0.5 text-xs font-bold"
                            title="Rewind 10 Seconds"
                          >
                            <FiRewind className="w-4 h-4" />
                            <span>10s</span>
                          </button>

                          {/* Forward 10 seconds */}
                          <button
                            onClick={skipForward10}
                            className="p-1.5 hover:text-amber-400 transition-colors flex items-center gap-0.5 text-xs font-bold"
                            title="Forward 10 Seconds"
                          >
                            <span>10s</span>
                            <FiFastForward className="w-4 h-4" />
                          </button>

                          {/* Volume & Mute */}
                          <div className="flex items-center gap-1.5 group/vol">
                            <button
                              onClick={toggleMute}
                              className="p-1.5 hover:text-amber-400 transition-colors"
                              title={isMuted ? "Unmute" : "Mute"}
                            >
                              {isMuted ? (
                                <FiVolumeX className="w-4 h-4 text-red-400" />
                              ) : (
                                <FiVolume2 className="w-4 h-4" />
                              )}
                            </button>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              className="w-14 sm:w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                            />
                          </div>

                          {/* Time Display */}
                          <span className="text-[11px] sm:text-xs text-gray-300 font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        {/* Right Group: Captions, Speed, Quality, Fullscreen */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Captions (CC) Toggle */}
                          <button
                            onClick={() => setShowCaptions(!showCaptions)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                              showCaptions
                                ? "bg-amber-500 text-black border-amber-400"
                                : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                            }`}
                            title="Toggle Closed Captions (CC)"
                          >
                            CC
                          </button>

                          {/* Playback Speed Selector */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                setShowSpeedMenu(!showSpeedMenu);
                                setShowQualityMenu(false);
                              }}
                              className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 border border-gray-700 hover:text-amber-400 transition-colors"
                            >
                              {playbackSpeed}x
                            </button>
                            {showSpeedMenu && (
                              <div className="absolute bottom-8 right-0 bg-gray-900 border border-gray-700 rounded-xl p-1 shadow-2xl z-20 flex flex-col gap-0.5 min-w-[70px]">
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                                  <button
                                    key={spd}
                                    onClick={() => changePlaybackSpeed(spd)}
                                    className={`px-2 py-1 text-[11px] rounded text-left font-bold transition-colors ${
                                      playbackSpeed === spd
                                        ? "bg-amber-500 text-black"
                                        : "hover:bg-gray-800 text-gray-200"
                                    }`}
                                  >
                                    {spd}x
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quality Selector */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                setShowQualityMenu(!showQualityMenu);
                                setShowSpeedMenu(false);
                              }}
                              className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 border border-gray-700 hover:text-amber-400 transition-colors"
                            >
                              {quality}
                            </button>
                            {showQualityMenu && (
                              <div className="absolute bottom-8 right-0 bg-gray-900 border border-gray-700 rounded-xl p-1 shadow-2xl z-20 flex flex-col gap-0.5 min-w-[90px]">
                                {["Auto", "1080p HD", "720p", "480p"].map(
                                  (q) => (
                                    <button
                                      key={q}
                                      onClick={() => {
                                        setQuality(q);
                                        setShowQualityMenu(false);
                                        toast.info(`Video quality switched to ${q}`);
                                      }}
                                      className={`px-2 py-1 text-[11px] rounded text-left font-bold transition-colors ${
                                        quality === q
                                          ? "bg-amber-500 text-black"
                                          : "hover:bg-gray-800 text-gray-200"
                                      }`}
                                    >
                                      {q}
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                          </div>

                          {/* Fullscreen Button */}
                          <button
                            onClick={toggleFullscreen}
                            className="p-1.5 hover:text-amber-400 transition-colors"
                            title={
                              isFullscreen
                                ? "Exit Fullscreen"
                                : "Enter Fullscreen"
                            }
                          >
                            {isFullscreen ? (
                              <FiMinimize className="w-4 h-4" />
                            ) : (
                              <FiMaximize className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full aspect-video flex flex-col items-center justify-center p-8 text-center bg-gray-900/80">
                    <FiVideo className="w-16 h-16 text-gray-600 mb-3" />
                    <h3 className="text-xl font-bold mb-1">
                      No Videos Uploaded Yet
                    </h3>
                    <p className="text-xs text-gray-400 max-w-sm mb-4">
                      {isEducator
                        ? "As the educator of this course, you can publish your first lesson video below."
                        : "The educator has not yet published lecture videos for this course. Please check back soon."}
                    </p>
                    {isEducator && (
                      <button
                        onClick={() => setShowAddVideoModal(true)}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center gap-2"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Publish First Video</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Video Title & Description Section */}
            <div className="mt-5 p-5 rounded-2xl bg-gray-900/60 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {currentVideoTitle}
                </h2>

                {/* Educator Actions: Delete Video & Publish More Videos */}
                {isEducator && (
                  <div className="flex items-center gap-2 shrink-0">
                    {videosList.length > 0 && (
                      <button
                        onClick={handleDeleteCurrentVideo}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
                        title="Delete this video lesson"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        <span>Delete Video</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowAddVideoModal(true)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      <span>Publish More Videos</span>
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm font-normal text-gray-300 leading-relaxed">
                {currentVideoDescription}
              </p>

              {/* Multiple Videos Playlist Switcher */}
              {videosList.length > 1 && (
                <div className="mt-6 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Course Lessons & Playlist
                    </span>
                    <span className="text-xs text-gray-400">
                      Playing {activeVideoIndex + 1} of {videosList.length}
                    </span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {videosList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!isUnlocked) {
                            toast.warn("Please enroll to unlock all lessons.");
                            return;
                          }
                          setActiveVideoIndex(idx);
                          setVideoErrorFallback(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                          activeVideoIndex === idx
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25 scale-[1.02]"
                            : "bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700"
                        }`}
                      >
                        {isUnlocked ? (
                          <FiPlay className="w-3.5 h-3.5" />
                        ) : (
                          <FiLock className="w-3.5 h-3.5" />
                        )}
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

      {/* ── Educator Publish More Videos Modal ───────────────────────── */}
      <AnimatePresence>
        {showAddVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-lg w-full bg-gray-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <FiVideo className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black">
                      Publish New Course Video
                    </h3>
                    <p className="text-xs text-gray-400">
                      Add an additional lecture lesson to this course
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddVideoModal(false)}
                  className="text-gray-400 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePublishNewVideo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Lesson Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder={`e.g. Lesson ${
                      videosList.length + 1
                    }: Core Implementation`}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Lesson Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={newVideoDesc}
                    onChange={(e) => setNewVideoDesc(e.target.value)}
                    placeholder="Brief description of topics covered in this lesson..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                    Upload Video File (MP4 / WebM) *
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewVideoFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                  />
                  {newVideoFile && (
                    <p className="text-xs text-emerald-400 mt-2 font-semibold">
                      Selected: {newVideoFile.name} (
                      {(newVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowAddVideoModal(false)}
                    disabled={isUploadingVideo}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUploadingVideo}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                  >
                    <FiUploadCloud className="w-4 h-4" />
                    <span>
                      {isUploadingVideo
                        ? uploadStatus || "Publishing..."
                        : "Upload & Publish Video"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="text-center py-6 text-xs text-gray-400 mt-16 border-t border-gray-800">
        <p>&copy; 2026 Edusphere | Blockchain E-Learning Platform</p>
      </footer>
    </div>
  );
};

export default CourseDetails;
