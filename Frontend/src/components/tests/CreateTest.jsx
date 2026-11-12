import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiLock,
  FiShield,
  FiArrowLeft,
  FiHelpCircle,
  FiBookOpen,
  FiClock,
  FiAward,
  FiShuffle,
  FiCopy,
  FiDollarSign,
  FiBook,
  FiGift,
  FiImage,
  FiUpload,
  FiX,
  FiZoomIn
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useWallet } from "../../context/WalletProvider";
import { useThemeStore } from "../../store/themeStore";
import { useTheme } from "next-themes";
import { createNewTest } from "../../utils/testsApi";
import ImageZoomModal from "./ImageZoomModal";

const CreateTest = () => {
  const navigate = useNavigate();
  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { setTheme } = useTheme();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Strict role check: Only educator can create tests
  const userRole = localStorage.getItem("role") || "student";
  const isEducator = userRole === "educator";

  // Test form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web3");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passingScore, setPassingScore] = useState(60);
  const [pickRandomCount, setPickRandomCount] = useState(2);
  const [authorName, setAuthorName] = useState("Educator");
  const [isPublishing, setIsPublishing] = useState(false);
  const [zoomImage, setZoomImage] = useState(null); // { src, alt }

  // Question bank state (default with 2 initial question templates)
  const [questions, setQuestions] = useState([
    {
      question: "Which EVM opcode consumes the least gas for temporary computation variables?",
      question_image: "",
      options: [
        "SSTORE (Storage Store)",
        "MLOAD (Memory Load)",
        "SLOAD (Storage Load)",
        "CREATE2 (Deterministic Deploy)"
      ],
      option_images: ["", "", "", ""],
      correct_option: 1,
      explanation: "MLOAD interacts with temporary volatile memory which costs only 3 gas plus memory expansion, whereas SLOAD costs 100-2100 gas."
    },
    {
      question: "What is the primary role of a modifier in Solidity contracts?",
      question_image: "",
      options: [
        "To compile contract bytecode into WebAssembly",
        "To change the behavior of functions declaratively, such as enforcing access control",
        "To store encrypted private keys inside the transaction log",
        "To execute off-chain Chainlink automation crons"
      ],
      option_images: ["", "", "", ""],
      correct_option: 1,
      explanation: "Function modifiers are used to easily check conditions prior to executing the function code (such as onlyOwner)."
    }
  ]);

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

  // Helper: Compress uploaded images to crisp high-definition web size (~50-100KB)
  // Prevents localStorage quota exceeded errors and network upload timeouts
  const compressImageFile = (file, maxDimension = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith("image/")) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(e.target.result); // Fallback to raw if load fails
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Question manipulation
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        question_image: "",
        options: ["", "", "", ""],
        option_images: ["", "", "", ""],
        correct_option: 0,
        explanation: ""
      }
    ]);
    setPickRandomCount((prev) => prev + 1);
  };

  const handleRemoveQuestion = (qIndex) => {
    if (questions.length <= 1) {
      toast.warn("A test question bank must have at least 1 question.");
      return;
    }
    setQuestions((prev) => {
      const updated = prev.filter((_, idx) => idx !== qIndex);
      setPickRandomCount((p) => Math.min(p, updated.length));
      return updated;
    });
  };

  const handleQuestionTextChange = (qIndex, text) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], question: text };
      return copy;
    });
  };

  // Upload or set image diagram for question
  const handleQuestionImageUpload = async (qIndex, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WEBP, SVG).");
      return;
    }
    const compressed = await compressImageFile(file, 1200, 0.82);
    if (!compressed) {
      toast.error("Failed to process image file.");
      return;
    }
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], question_image: compressed };
      return copy;
    });
    toast.success("Question diagram/image uploaded & optimized!");
  };

  const handleRemoveQuestionImage = (qIndex) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], question_image: "" };
      return copy;
    });
  };

  // Upload or set image for option
  const handleOptionImageUpload = async (qIndex, optIndex, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }
    const compressed = await compressImageFile(file, 800, 0.8);
    if (!compressed) {
      toast.error("Failed to process option image.");
      return;
    }
    setQuestions((prev) => {
      const copy = [...prev];
      const newImages = copy[qIndex].option_images ? [...copy[qIndex].option_images] : ["", "", "", ""];
      newImages[optIndex] = compressed;
      copy[qIndex] = { ...copy[qIndex], option_images: newImages };
      return copy;
    });
    toast.success(`Option ${String.fromCharCode(65 + optIndex)} diagram uploaded!`);
  };

  const handleRemoveOptionImage = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const newImages = copy[qIndex].option_images ? [...copy[qIndex].option_images] : ["", "", "", ""];
      newImages[optIndex] = "";
      copy[qIndex] = { ...copy[qIndex], option_images: newImages };
      return copy;
    });
  };

  const handleOptionChange = (qIndex, optIndex, text) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const newOptions = [...copy[qIndex].options];
      newOptions[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: newOptions };
      return copy;
    });
  };

  const handleCorrectOptionChange = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correct_option: optIndex };
      return copy;
    });
  };

  const handleExplanationChange = (qIndex, text) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], explanation: text };
      return copy;
    });
  };

  // Pre-fill sample question
  const handleAddSampleQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "What is an ERC-20 'allowance' mapping utilized for?",
        question_image: "",
        options: [
          "Tracking how much ETH the contract can spend on gas fees",
          "Permitting a third-party spender to withdraw up to a specified token amount on behalf of an owner",
          "Encrypting the owner's seed phrase in contract memory",
          "Determining validator rewards in proof-of-stake consensus"
        ],
        option_images: ["", "", "", ""],
        correct_option: 1,
        explanation: "The allowance(owner, spender) mechanism allows decentralized exchanges and contracts to transfer tokens on behalf of the user after approval."
      }
    ]);
    setPickRandomCount((prev) => prev + 1);
    toast.success("Sample question added to bank!");
  };

  // Submit and Publish test
  const handlePublishTest = async (e) => {
    e.preventDefault();
    if (isPublishing) return;

    if (!walletConnected || !walletAddress) {
      toast.error("Please connect your MetaMask educator wallet to publish a test.");
      connectWallet();
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error("Please provide a test title and description.");
      return;
    }

    // Validate that every question has at least question text OR diagram image
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const hasQText = q.question && q.question.trim();
      const hasQImg = Boolean(q.question_image);
      if (!hasQText && !hasQImg) {
        toast.error(`Question #${i + 1} has neither text statement nor diagram image. Please upload a diagram or enter question text.`);
        return;
      }
    }

    // Package every question safely with fallbacks so no question or option is ever dropped
    const processedQuestions = questions.map((q, qIdx) => {
      const optionLetters = ["A", "B", "C", "D"];
      const rawOptions = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["", "", "", ""];
      
      const optionsWithFallbacks = rawOptions.map((opt, oIdx) => {
        const trimmed = (opt || "").trim();
        if (trimmed) return trimmed;
        if (q.option_images && q.option_images[oIdx]) {
          return `Option ${optionLetters[oIdx] || oIdx + 1} (Diagram)`;
        }
        return `Option ${optionLetters[oIdx] || oIdx + 1}`;
      });

      // Ensure at least 4 options exist
      while (optionsWithFallbacks.length < 4) {
        optionsWithFallbacks.push(`Option ${optionLetters[optionsWithFallbacks.length] || optionsWithFallbacks.length + 1}`);
      }

      const qText = (q.question || "").trim();
      const finalQuestionText = qText || (q.question_image ? `Question #${qIdx + 1} (Refer to diagram below)` : `Question #${qIdx + 1}`);

      return {
        ...q,
        question: finalQuestionText,
        question_image: q.question_image || "",
        options: optionsWithFallbacks,
        option_images: Array.isArray(q.option_images) ? q.option_images : ["", "", "", ""],
        correct_option: typeof q.correct_option === "number" && q.correct_option >= 0 && q.correct_option < optionsWithFallbacks.length ? q.correct_option : 0,
        explanation: (q.explanation || "").trim() || "See correct solution marked above."
      };
    });

    setIsPublishing(true);

    try {
      const totalQs = processedQuestions.length;
      const testPayload = {
        title: title.trim(),
        description: description.trim(),
        category: [category],
        difficulty: difficulty,
        duration_minutes: Number(durationMinutes) || 15,
        passing_score: Number(passingScore) || 60,
        pick_random_count: Math.min(Math.max(Number(pickRandomCount) || totalQs, 1), totalQs),
        author_name: authorName.trim() || "Educator",
        author_wallet_id: walletAddress,
        questions: processedQuestions
      };

      const res = await createNewTest(testPayload);

      if (res.success) {
        toast.success(res.message || "Test published successfully!");
        navigate("/tests");
      } else {
        toast.error("Failed to publish test.");
      }
    } catch (err) {
      console.error("Error creating test:", err);
      toast.error("An error occurred while publishing the test.");
    } finally {
      setIsPublishing(false);
    }
  };

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
            <Link to="/tests" className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Test Facility
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/create-test" className="group relative text-lg font-semibold text-amber-400">
              Create Test
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400"></span>
            </Link>
          </div>

          {/* Wallet Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
              walletConnected
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
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
                      to="/create-test"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 text-amber-400 font-semibold"
                    >
                      <FiPlus className="text-amber-400" />
                      <span>Create Test</span>
                    </Link>
                    <Link
                      to="/tests"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiBookOpen className="text-amber-500" />
                      <span>Test Facility</span>
                    </Link>
                    <Link
                      to="/createcourses"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiBook className="text-amber-500" />
                      <span>Create Courses</span>
                    </Link>
                    <Link
                      to="/managecourses"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiBookOpen className="text-amber-500" />
                      <span>Manage Courses</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Main Creation Container */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate("/tests")}
            className="flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Test Facility</span>
          </button>

          {isEducator && (
            <Link
              to="/educator-marks"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-400/40 text-amber-400 hover:bg-amber-400 hover:text-black transition-all flex items-center gap-2"
            >
              <FiAward className="w-4 h-4" />
              <span>View All Students' Marks & Mistakes</span>
            </Link>
          )}
        </div>

        {!isEducator ? (
          <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-center max-w-xl mx-auto my-12 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <FiLock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">Educator Access Only</h3>
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Only verified educators are authorized to create and publish test question banks.
              Students can attempt assessments and review test scores & mistakes.
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
                Browse Student Assessments
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Security / Wallet Status banner */}
            {!walletConnected && (
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <FiLock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-amber-400">Educator MetaMask Authentication Required</h4>
                    <p className="text-xs text-gray-300">
                      Educators must connect their wallet to author and publish tests. No blockchain transaction fees or gas
                      are charged.
                    </p>
                  </div>
                </div>
                <button
                  onClick={connectWallet}
                  className="px-6 py-3 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 whitespace-nowrap"
                >
                  Connect MetaMask
                </button>
              </div>
            )}

            <form onSubmit={handlePublishTest}>
          {/* Card 1: Test Metadata */}
          <div
            className={`rounded-3xl p-8 border shadow-xl mb-8 ${
              isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-amber-200"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
              <FiBookOpen className="w-4 h-4" />
              <span>Step 1: Test Details & Criteria</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-6">Create New Assessment</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">
                  Assessment Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Solidity & EVM Architecture Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-4 rounded-xl text-base border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800/80 border-gray-700 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">
                  Description & Student Instructions *
                </label>
                <textarea
                  rows="3"
                  placeholder="Explain what skills will be tested and guidelines for candidates..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800/80 border-gray-700 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800/80 border-gray-700 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                >
                  <option value="Web3">Web3 & Smart Contracts</option>
                  <option value="Frontend">Frontend & React</option>
                  <option value="DeFi">DeFi Architecture</option>
                  <option value="Security">Blockchain Security & Auditing</option>
                  <option value="AI & ML">Artificial Intelligence & ML</option>
                  <option value="General">General Computer Science</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800/80 border-gray-700 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Duration Minutes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800/80 border-gray-700 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                />
              </div>

              {/* Passing Score % */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">
                  Passing Score Percentage (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800/80 border-gray-700 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                />
              </div>

              {/* Questions Picked Randomly */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">
                  Random Questions per Attempt
                </label>
                <input
                  type="number"
                  min="1"
                  max={questions.length}
                  value={pickRandomCount}
                  onChange={(e) => setPickRandomCount(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800/80 border-gray-700 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                />
                <span className="text-xs text-amber-400/90 mt-1 block font-medium">
                  Currently set to deliver {Math.min(Number(pickRandomCount) || questions.length, questions.length)} of {questions.length} questions per student attempt.
                </span>
              </div>

              {/* Educator Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">
                  Author / Educator Display Name
                </label>
                <input
                  type="text"
                  placeholder="Prof. John Doe"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-gray-800/80 border-gray-700 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Question Bank Builder */}
          <div
            className={`rounded-3xl p-8 border shadow-xl mb-8 ${
              isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-amber-200"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                  <FiShuffle className="w-4 h-4" />
                  <span>Step 2: MCQ Question Bank ({questions.length} Questions)</span>
                </div>
                <h3 className="text-2xl font-black">Type Questions & Solutions</h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddSampleQuestion}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 transition-colors"
                >
                  + Add Sample Question
                </button>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 shadow-md shadow-amber-400/20 transition-all flex items-center gap-1.5"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-8">
              {questions.map((q, qIndex) => {
                const optionLetters = ["A", "B", "C", "D"];

                return (
                  <motion.div
                    key={qIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 border relative ${
                      isDarkMode ? "bg-gray-800/60 border-gray-700" : "bg-amber-50/50 border-amber-200"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/30">
                        Question #{qIndex + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-xs flex items-center gap-1 font-semibold"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span>Delete Question</span>
                        </button>
                      )}
                    </div>

                    {/* Question text & diagram */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Question Statement & Diagram (Text & Image supported) *
                        </label>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-400/40 text-amber-400 hover:bg-amber-400 hover:text-black transition-all">
                          <FiImage className="w-3.5 h-3.5" />
                          <span>{q.question_image ? "Change Diagram/Image" : "+ Upload Diagram/Image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleQuestionImageUpload(qIndex, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Diagram Image Preview if uploaded */}
                      {q.question_image && (
                        <div className="relative mb-3 rounded-2xl overflow-hidden border-2 border-amber-400/40 bg-black/40 p-2 flex flex-col items-center justify-center">
                          <img
                            src={q.question_image}
                            alt={`Question #${qIndex + 1} Diagram`}
                            onClick={() =>
                              setZoomImage({
                                src: q.question_image,
                                alt: `Question #${qIndex + 1} Diagram`
                              })
                            }
                            className="max-h-56 object-contain rounded-xl cursor-zoom-in hover:scale-[1.02] transition-transform"
                            title="Click to zoom diagram"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setZoomImage({
                                src: q.question_image,
                                alt: `Question #${qIndex + 1} Diagram`
                              })
                            }
                            className="mt-2 text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-full border border-amber-400/30"
                          >
                            <FiZoomIn className="w-3.5 h-3.5" /> Click to Zoom Diagram
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionImage(qIndex)}
                            className="absolute top-3 right-3 bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1 z-10"
                            title="Remove this diagram image"
                          >
                            <FiX className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}

                      {/* Text writing space for question statement */}
                      <textarea
                        rows="2"
                        placeholder={
                          q.question_image
                            ? "Type your question text referencing this diagram/image (e.g. 'Look at the diagram above and identify...')"
                            : "Type question text or statement here..."
                        }
                        value={q.question}
                        onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                        className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                          isDarkMode
                            ? "bg-gray-900 border-gray-700 text-white focus:border-amber-400"
                            : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                        }`}
                      />
                    </div>

                    {/* 4 Options */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Options (Select Correct Solution radio) • Text & Image supported *
                        </label>
                        <span className="text-xs text-gray-400">
                          Click letter [A, B, C, D] to mark correct solution
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correct_option === optIdx;
                          const optImg = q.option_images && q.option_images[optIdx];

                          return (
                            <div
                              key={optIdx}
                              className={`p-3.5 rounded-2xl border flex flex-col gap-2 transition-all ${
                                isCorrect
                                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10"
                                  : isDarkMode
                                  ? "bg-gray-900 border-gray-700 text-gray-200"
                                  : "bg-white border-gray-300 text-gray-800"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Option Letter button that sets as correct */}
                                <button
                                  type="button"
                                  onClick={() => handleCorrectOptionChange(qIndex, optIdx)}
                                  title="Click to set as correct solution"
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-colors ${
                                    isCorrect
                                      ? "bg-emerald-500 text-black shadow-md"
                                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                  }`}
                                >
                                  {optionLetters[optIdx]}
                                </button>

                                <input
                                  type="text"
                                  placeholder={`Option ${optionLetters[optIdx]} text or caption...`}
                                  value={opt}
                                  onChange={(e) => handleOptionChange(qIndex, optIdx, e.target.value)}
                                  className={`flex-1 bg-transparent border-none focus:outline-none text-sm ${
                                    isCorrect ? "font-semibold" : ""
                                  }`}
                                />

                                {/* Option image upload button */}
                                <label
                                  className={`cursor-pointer p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all shrink-0 ${
                                    optImg
                                      ? "bg-purple-500/20 border-purple-400/40 text-purple-300"
                                      : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                                  }`}
                                  title={`Upload image for Option ${optionLetters[optIdx]}`}
                                >
                                  <FiImage className="w-3.5 h-3.5" />
                                  <span className="text-[10px] hidden sm:inline">{optImg ? "Change" : "+ Image"}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleOptionImageUpload(qIndex, optIdx, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>

                                {isCorrect && (
                                  <span className="text-xs font-bold text-emerald-400 shrink-0">
                                    ✓ Solution
                                  </span>
                                )}
                              </div>

                              {/* If Option has an image, render preview */}
                              {optImg && (
                                <div className="relative mt-1 rounded-xl overflow-hidden border border-purple-500/30 bg-black/40 p-1 flex items-center justify-between">
                                  <div
                                    onClick={() =>
                                      setZoomImage({
                                        src: optImg,
                                        alt: `Option ${optionLetters[optIdx]} image`
                                      })
                                    }
                                    className="flex items-center gap-2 cursor-zoom-in group"
                                    title="Click to zoom option diagram"
                                  >
                                    <img
                                      src={optImg}
                                      alt={`Option ${optionLetters[optIdx]} image`}
                                      className="max-h-24 max-w-[80%] object-contain rounded-lg group-hover:scale-105 transition-transform"
                                    />
                                    <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1 group-hover:underline">
                                      <FiZoomIn className="w-3 h-3" /> Zoom
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionImage(qIndex, optIdx)}
                                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-1 rounded-md text-xs font-bold mr-1 shrink-0"
                                    title="Remove this option image"
                                  >
                                    <FiX className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Solution & Explanation */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">
                        Solution Explanation (Revealed to student after submission)
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Provide detailed explanation and why the correct answer is right..."
                        value={q.explanation}
                        onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                        className={`w-full p-3 rounded-xl text-xs border focus:outline-none transition-all ${
                          isDarkMode
                            ? "bg-gray-900 border-gray-700 text-white focus:border-amber-400"
                            : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                        }`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Add question bottom shortcut */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-amber-500/15 border border-amber-400/40 text-amber-400 hover:bg-amber-400 hover:text-black transition-all inline-flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add Another Question to Bank</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20">
            <div>
              <h4 className="font-bold text-base">Ready to Publish Assessment?</h4>
              <p className="text-xs text-gray-400">
                Zero Gas: Saving and publishing this test requires no smart contract transactions or ETH fees.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPublishing || !walletConnected}
              className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                walletConnected
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-amber-500/25 active:scale-98 cursor-pointer"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isPublishing ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Publish Test to Question Bank</span>
                </>
              )}
            </button>
          </div>
        </form>
        </>
        )}
      </div>

      {/* Interactive Image Zoom Modal */}
      <ImageZoomModal
        isOpen={Boolean(zoomImage)}
        src={zoomImage?.src}
        alt={zoomImage?.alt}
        onClose={() => setZoomImage(null)}
      />
    </div>
  );
};

export default CreateTest;

