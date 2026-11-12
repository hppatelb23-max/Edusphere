import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiFlag,
  FiChevronLeft,
  FiChevronRight,
  FiLock,
  FiRefreshCw,
  FiEye,
  FiArrowLeft,
  FiAward,
  FiHelpCircle,
  FiCamera,
  FiVideo,
  FiMonitor,
  FiSun,
  FiX,
  FiSmartphone,
  FiPlay
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useWallet } from "../../context/WalletProvider";
import { useThemeStore } from "../../store/themeStore";
import { fetchTestById, submitTestAnswers } from "../../utils/testsApi";
import { saveProctorRecording } from "../../utils/proctorRecordingDB";

const TestTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  // Role check
  const userRole = localStorage.getItem("role") || "student";
  const isEducator = userRole === "educator";

  // States
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("instructions"); // 'instructions' | 'camera' | 'test' | 'results'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [question_id]: option_index }
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // { [question_id]: boolean }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showCheatingWarning, setShowCheatingWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // ── Camera Proctoring State ──────────────────────────────────────
  const [cameraPermission, setCameraPermission] = useState("idle"); // 'idle'|'requesting'|'granted'|'denied'
  const [cameraStream, setCameraStream] = useState(null);
  const [brightness, setBrightness] = useState(255);       // 0-255
  const [isCheating, setIsCheating] = useState(false);     // true = red dot (too dark), false = green dot (proper light)
  const [cheatReason, setCheatReason] = useState("");
  const [showCamWidget, setShowCamWidget] = useState(false); // mini widget during test

  const videoRef = useRef(null);           // camera preview <video>
  const widgetVideoRef = useRef(null);     // small widget <video> during test
  const canvasRef = useRef(null);          // hidden canvas for sampling
  const brightnessIntervalRef = useRef(null);
  const timerRef = useRef(null);

  // Video recording refs (stored for Educator review)
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const proctorLogsRef = useRef([]);
  const lastWasCheatingRef = useRef(false);

  // Load test details
  const loadTest = async () => {
    setLoading(true);
    try {
      // randomize=true picks random questions from the bank
      const data = await fetchTestById(id, true);
      if (!data) {
        toast.error("Test not found");
        navigate("/tests");
        return;
      }
      setTest(data);
      setQuestions(data.questions || []);
      setTimeLeft((data.duration_minutes || 15) * 60);
    } catch (err) {
      console.error("Error loading test:", err);
      toast.error("Failed to load test details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTest();
  }, [id]);

  // Anti-cheating: tab switch / window blur detection during active test
  const lastSwitchTimeRef = useRef(0);

  useEffect(() => {
    if (phase !== "test") return;

    const onScreenSwitch = () => {
      const now = Date.now();
      // Debounce window blur + visibility change to prevent double counting
      if (now - lastSwitchTimeRef.current < 1500) return;
      lastSwitchTimeRef.current = now;

      setTabSwitchCount((prev) => {
        const next = prev + 1;
        if (next > 3) {
          toast.error(
            "Security Violation: Screen changed more than 3 times! Submitting assessment automatically...",
            { autoClose: 4000 }
          );
          setShowCheatingWarning(false);
          setTimeout(() => {
            handleSubmitTest();
          }, 600);
        } else {
          setShowCheatingWarning(true);
        }
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onScreenSwitch();
      }
    };

    const handleBlur = () => {
      onScreenSwitch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [phase]);

  // Timer countdown
  useEffect(() => {
    if (phase === "test" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timeLeft]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  // Anti-cheating handlers
  const handlePreventCopy = (e) => {
    e.preventDefault();
    toast.warning("Copying question text is prohibited to maintain test integrity.");
  };

  const handlePreventPaste = (e) => {
    e.preventDefault();
    toast.warning("Pasting is disabled during assessment.");
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    toast.info("Right-click context menu is disabled for security.");
  };

  // ── Camera: Attach stream to <video> elements when stream changes ─
  useEffect(() => {
    if (cameraStream) {
      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
      }
      if (widgetVideoRef.current) {
        widgetVideoRef.current.srcObject = cameraStream;
      }
    }
  }, [cameraStream, phase, showCamWidget]);

  // ── Camera: Start MediaRecorder session when test begins ─────────
  useEffect(() => {
    if (phase !== "test" || !cameraStream) return;

    recordedChunksRef.current = [];
    proctorLogsRef.current = [];
    lastWasCheatingRef.current = false;

    if (typeof MediaRecorder !== "undefined") {
      try {
        let mimeType = "video/webm";
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
          mimeType = "video/webm;codecs=vp8,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        }

        const recorder = new MediaRecorder(cameraStream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.start(1000); // chunk every second
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn("Failed to initialize MediaRecorder:", err);
      }
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) { }
      }
    };
  }, [phase, cameraStream]);

  // ── Camera: Fast Live Proctoring & Cheat Analysis (runs every 300ms for INSTANT detection) ──
  useEffect(() => {
    if (!cameraStream || (phase !== "camera" && phase !== "test")) return;

    const analyseFrame = () => {
      const video = (phase === "camera" ? videoRef.current : widgetVideoRef.current);
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      canvas.width = 96;
      canvas.height = 72;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, 96, 72);
      const imgData = ctx.getImageData(0, 0, 96, 72);
      const data = imgData.data;
      const w = 96;
      const h = 72;

      let totalLum = 0;
      let count = 0;

      // 1. Overall brightness calculation
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLum += lum;
        count++;
      }
      const avg = count > 0 ? totalLum / count : 128;
      const roundedBrightness = Math.round(avg);
      setBrightness(roundedBrightness);

      // Low brightness: area is too dark if average luminance < 65
      const lowBrightness = roundedBrightness < 65;

      // Pure Brightness Proctoring:
      // Red dot if in low brightness area (too dark); Green dot if in proper bright area
      // Pure Brightness Proctoring:
      // Turns RED dot immediately if student is in low brightness area; GREEN dot when proper light
      const isTooDark = lowBrightness;
      setIsCheating(isTooDark);

      if (isTooDark) {
        setCheatReason("Low Brightness Area Detected (Too Dark)");
      } else {
        setCheatReason("");
      }

      // Log violations into timeline when transition occurs
      if (isTooDark && !lastWasCheatingRef.current) {
        const testDuration = (test?.duration_minutes || 15) * 60;
        const elapsed = Math.max(0, testDuration - timeLeft);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

        proctorLogsRef.current.push({
          time: timeStr,
          reason: "Low Brightness Area (Too Dark)",
          alert: "red",
          timestamp: new Date().toISOString()
        });
      }
      lastWasCheatingRef.current = isTooDark;
    };

    // Fast 300ms polling for instant live green <-> red transitions
    brightnessIntervalRef.current = setInterval(analyseFrame, 300);
    return () => clearInterval(brightnessIntervalRef.current);
  }, [cameraStream, phase, test, timeLeft]);



  // ── Camera: Stop stream when results phase or on unmount ─────────
  useEffect(() => {
    if (phase === "results" && cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [phase]);

  // ── Camera: Request camera access ────────────────────────────────
  const requestCamera = async () => {
    setCameraPermission("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false
      });
      setCameraStream(stream);
      setCameraPermission("granted");
      toast.success("Camera access granted. You can now proceed.");
    } catch (err) {
      console.warn("Camera permission denied:", err);
      setCameraPermission("denied");
      toast.error("Camera access denied. Camera proctoring is required to start the test.");
    }
  };

  // ── Camera: Confirm ready, move to test phase ─────────────────────
  const handleCameraReady = () => {
    if (cameraPermission !== "granted") {
      toast.error("Please grant camera access before starting.");
      return;
    }
    setShowCamWidget(true);
    setPhase("test");
    toast.success("Proctoring active. Assessment started — Best of luck!");
  };

  // Start test → go to camera phase first
  const handleStartAssessment = () => {
    if (!walletConnected || !walletAddress) {
      toast.error("Please connect your MetaMask wallet before starting the assessment.");
      connectWallet();
      return;
    }
    setPhase("camera");
  };

  // Select an option for current question
  const handleOptionSelect = (optionIndex) => {
    const currentQ = questions[currentIndex];
    const qKey = currentQ._id || currentQ.question;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qKey]: optionIndex
    }));
  };

  // Clear current question selection
  const handleClearSelection = () => {
    const currentQ = questions[currentIndex];
    const qKey = currentQ._id || currentQ.question;
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qKey];
      return copy;
    });
  };

  // Toggle flag for review
  const handleToggleFlag = () => {
    const currentQ = questions[currentIndex];
    const qKey = currentQ._id || currentQ.question;
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qKey]: !prev[qKey]
    }));
  };

  // Navigation
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Auto-submit when time expires
  const handleAutoSubmit = () => {
    toast.info("Time is up! Submitting your answers automatically...");
    handleSubmitTest();
  };

  // Submit test
  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitConfirm(false);

    try {
      // 1. Stop recorder and assemble video blob
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Error stopping recorder:", e);
        }
      }

      // 2. Save video recording to IndexedDB (accessible only by educators)
      let recordingId = "";
      if (recordedChunksRef.current && recordedChunksRef.current.length > 0) {
        try {
          const videoBlob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          recordingId = `rec_${test._id}_${walletAddress ? walletAddress.slice(0, 8) : "stu"}_${Date.now()}`;
          await saveProctorRecording(recordingId, videoBlob, {
            test_id: test._id,
            test_title: test.title,
            student_wallet_id: walletAddress || "guest_student",
            logs: proctorLogsRef.current || [],
            violations_count: proctorLogsRef.current.length,
            duration_seconds: (test.duration_minutes || 15) * 60 - timeLeft
          });
        } catch (err) {
          console.warn("Failed to persist proctor recording:", err);
        }
      }

      const answersPayload = questions.map((q) => {
        const qKey = q._id || q.question;
        return {
          question_id: q._id || q.question,
          selected_option: selectedAnswers[qKey] !== undefined ? selectedAnswers[qKey] : -1
        };
      });

      const studentName =
        localStorage.getItem("username") ||
        localStorage.getItem("studentName") ||
        localStorage.getItem("name") ||
        (walletAddress ? localStorage.getItem(`student_name_${walletAddress.toLowerCase()}`) : "") ||
        "";
      const res = await submitTestAnswers({
        test_id: test._id,
        student_wallet_id: walletAddress || "guest_student",
        student_name: studentName,
        answers: answersPayload,
        recording_id: recordingId,
        proctor_logs: proctorLogsRef.current || []
      });

      if (res.success && res.result) {
        setTestResult(res.result);
        setPhase("results");
        toast.success("Assessment submitted successfully! Proctor recording stored.");
      } else {
        toast.error("Error submitting test. Please try again.");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error("Submission failed. Please check network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retake test (re-pulls random questions from bank)
  const handleRetakeTest = async () => {
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setTabSwitchCount(0);
    setShowCheatingWarning(false);
    setTestResult(null);
    setCurrentIndex(0);
    await loadTest();
    setPhase("instructions");
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-900 text-white" : "bg-amber-50 text-gray-900"
          }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold text-amber-400">Loading Question Bank & Assessment...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  // Answer count calculation
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const currentQ = questions[currentIndex] || {};
  const currentQKey = currentQ._id || currentQ.question;
  const currentSelectedOption = selectedAnswers[currentQKey];
  const isCurrentFlagged = Boolean(flaggedQuestions[currentQKey]);

  // Timer warning status
  const isTimeCritical = timeLeft < 120; // < 2 mins

  return (
    <div
      onCopy={phase === "test" ? handlePreventCopy : undefined}
      onPaste={phase === "test" ? handlePreventPaste : undefined}
      onContextMenu={phase === "test" ? handleContextMenu : undefined}
      className={`min-h-screen ${isDarkMode
          ? "bg-gradient-to-br from-black via-gray-900 to-gray-800 text-gray-100"
          : "bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900"
        } ${phase === "test" ? "select-none" : ""} transition-colors duration-300`}
    >
      {/* Hidden canvas for brightness analysis */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* ============================================================== */}
      {/* PHASE 1: INSTRUCTIONS & WALLET VERIFICATION */}
      {/* ============================================================== */}
      {phase === "instructions" && (
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Back button */}
          <button
            onClick={() => navigate("/tests")}
            className="flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 mb-8 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to All Assessments</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-8 md:p-12 border shadow-2xl ${isDarkMode ? "bg-gray-900/90 border-amber-500/30" : "bg-white border-amber-300"
              }`}
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-700/40">
              <div>
                <span className="text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/30">
                  {test.difficulty || "Intermediate"} Assessment
                </span>
                <h1 className="text-3xl md:text-4xl font-black mt-2">{test.title}</h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Created by</span>
                <span className="font-semibold text-amber-400">{test.author_name || "Faculty"}</span>
              </div>
            </div>

            {/* Description */}
            <p className={`text-base leading-relaxed mb-8 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              {test.description}
            </p>

            {/* Test Metadata Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <FiClock className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <span className="text-xs text-gray-400 block">Duration</span>
                <span className="text-lg font-bold">{test.duration_minutes || 15} Minutes</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <FiHelpCircle className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <span className="text-xs text-gray-400 block">Questions</span>
                <span className="text-lg font-bold">{questions.length} MCQs</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <FiAward className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <span className="text-xs text-gray-400 block">Passing Mark</span>
                <span className="text-lg font-bold">{test.passing_score || 60}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <FiShield className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs text-gray-400 block">Gas Fee</span>
                <span className="text-lg font-bold text-emerald-400">Zero (Free)</span>
              </div>
            </div>

            {/* Wallet Verification Card */}
            <div
              className={`p-5 rounded-2xl border mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 ${walletConnected
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-amber-500/10 border-amber-500/30"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${walletConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    }`}
                >
                  <FiShield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {walletConnected ? "MetaMask Wallet Connected" : "Wallet Connection Required"}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {walletConnected
                      ? `Candidate Identity: ${walletAddress}`
                      : "Connect your MetaMask wallet to authenticate your student assessment."}
                  </p>
                </div>
              </div>

              {!walletConnected ? (
                <button
                  onClick={connectWallet}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 whitespace-nowrap"
                >
                  Connect MetaMask
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                  <FiCheckCircle className="w-4 h-4" />
                  Verified
                </span>
              )}
            </div>

            {/* Instructions list */}
            <div className="rounded-2xl p-6 bg-black/20 border border-gray-700/40 mb-8 space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-amber-400">
                <FiAlertTriangle className="w-5 h-5" />
                <span>Test Instructions & Academic Integrity Rules</span>
              </h3>
              <ul className="text-sm space-y-2 text-gray-300 list-disc list-inside">
                <li>
                  <strong>Multiple Choice Only:</strong> Each question has 4 options with exactly 1 correct solution.
                </li>
                <li>
                  <strong>Random Question Pool:</strong> Questions and options are sampled dynamically from our verified
                  question bank for each attempt.
                </li>
                <li>
                  <strong className="text-red-400">Strict Anti-Copy Protection:</strong> Copying question text, pasting,
                  and right-clicking are strictly disabled.
                </li>
                <li>
                  <strong className="text-red-400">⚠️ Screen-Switch Auto-Submit Rule:</strong> Changing screens, switching browser tabs, or minimizing the window <strong>more than 3 times</strong> will trigger an <strong>immediate automatic submission</strong> of your test.
                </li>
                <li>
                  <strong className="text-cyan-400">📷 Camera Proctoring:</strong> You will be asked to enable your
                  camera before starting. The system checks room brightness in real-time.
                </li>
                <li>
                  <strong>Timer Auto-Submission:</strong> When the countdown reaches 00:00, your test will automatically
                  be graded.
                </li>
                <li>
                  <strong>Verified Review:</strong> After submitting, you will immediately see your score, pass/fail status,
                  and full educator explanations for every question.
                </li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartAssessment}
              disabled={!walletConnected}
              className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-xl ${walletConnected
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-amber-500/25 active:scale-98 cursor-pointer"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
            >
              <FiCamera className="w-5 h-5" />
              <span>{walletConnected ? "Continue to Camera Setup →" : "Connect Wallet to Begin"}</span>
            </button>
          </motion.div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PHASE 1.5: CAMERA PROCTORING SETUP */}
      {/* ============================================================== */}
      {phase === "camera" && (
        <div className="max-w-2xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-8 md:p-10 border shadow-2xl ${isDarkMode ? "bg-gray-900/90 border-amber-500/30" : "bg-white border-amber-300"
              }`}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <FiCamera className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-2">Camera Proctoring Required</h2>
              <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                To maintain academic integrity, you must enable your camera before starting. The proctoring system monitors:
              </p>
            </div>

            {/* What is monitored */}
            <div className={`rounded-2xl p-5 border mb-6 space-y-2.5 text-sm ${isDarkMode ? "bg-gray-800/60 border-gray-700" : "bg-amber-50 border-amber-200"
              }`}>
              <div className="flex items-start gap-3">
                <FiSun className="text-amber-400 w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Room Brightness:</strong> Ensure you are in a well-lit area. Low-light environments trigger a red warning dot.</span>
              </div>
              <div className="flex items-start gap-3">
                <FiMonitor className="text-purple-400 w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>External Device Detection:</strong> Multiple screens or additional cameras are flagged automatically.</span>
              </div>
              <div className="flex items-start gap-3">
                <FiVideo className="text-cyan-400 w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Live Feed:</strong> A small camera widget stays visible in the corner while you test. 🟢 = all clear, 🔴 = issue detected.</span>
              </div>
            </div>

            {/* Camera Preview Area */}
            <div className="relative mb-6 rounded-2xl overflow-hidden bg-black border border-gray-700 aspect-video flex items-center justify-center">
              {cameraPermission === "granted" ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  {/* Status overlay badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm bg-black/70 border border-white/10">
                    <span
                      className={`w-3.5 h-3.5 rounded-full animate-pulse ${isCheating ? "bg-red-500 shadow-red-500/80 shadow-md" : "bg-emerald-400 shadow-emerald-400/80 shadow-md"
                        }`}
                    />
                    <span className={isCheating ? "text-red-400 font-extrabold" : "text-emerald-400 font-bold"}>
                      {isCheating ? `🔴 ${cheatReason || "Cheating Detected"}` : "🟢 Proper Brightness • Clear"}
                    </span>
                  </div>
                  {/* Brightness indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm bg-black/70 border border-white/10">
                    <FiSun className={`w-3.5 h-3.5 ${brightness < 65 ? "text-red-400" : brightness < 100 ? "text-amber-400" : "text-emerald-400"}`} />
                    <span className={brightness < 65 ? "text-red-400" : brightness < 100 ? "text-amber-400" : "text-emerald-400"}>
                      {brightness < 65 ? "Low Light" : brightness < 100 ? "Adequate" : "Optimal"}
                    </span>
                  </div>
                  {/* Brightness status bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2 justify-center">
                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg ${brightness < 65
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-emerald-500 text-black"
                      }`}>
                      {brightness < 65 ? "⚠️ Low Brightness (Too Dark)" : "☀️ Proper Brightness Area"} • {Math.round((brightness / 255) * 100)}%
                    </span>
                  </div>
                </>
              ) : cameraPermission === "denied" ? (
                <div className="flex flex-col items-center gap-3 text-center p-6">
                  <FiXCircle className="w-12 h-12 text-red-400" />
                  <p className="text-red-400 font-bold">Camera Access Denied</p>
                  <p className="text-xs text-gray-400">Please allow camera access in your browser settings and reload the page.</p>
                </div>
              ) : cameraPermission === "requesting" ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-amber-400 font-semibold text-sm">Requesting camera access…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-6">
                  <FiCamera className="w-14 h-14 text-gray-500" />
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Your camera is not yet active.<br />Click the button below to enable it.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {cameraPermission !== "granted" ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={requestCamera}
                  disabled={cameraPermission === "requesting"}
                  className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-xl shadow-amber-400/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <FiCamera className="w-5 h-5" />
                  <span>{cameraPermission === "requesting" ? "Requesting Access…" : "Enable Camera & Start Proctoring"}</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCameraReady}
                  disabled={isCheating}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${isCheating
                      ? "bg-red-700/60 text-red-300 cursor-not-allowed border border-red-500/40"
                      : "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-emerald-400/25"
                    }`}
                >
                  <FiCheckCircle className="w-5 h-5" />
                  <span>
                    {isCheating
                      ? "⚠️ Low Brightness Area — Please improve room lighting to proceed"
                      : "✅ Brightness & Camera OK — Proceed to Assessment"}
                  </span>
                </motion.button>
              )}

              <button
                onClick={() => setPhase("instructions")}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                  }`}
              >
                ← Back to Instructions
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PHASE 2: ACTIVE ASSESSMENT ENGINE */}
      {/* ============================================================== */}
      {phase === "test" && (
        <div className="min-h-screen flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 px-6 py-4 border-b border-amber-500/20 backdrop-blur-md bg-opacity-90 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="font-extrabold text-xl text-amber-400 tracking-tight">Edusphere Exam</span>
              <span className="hidden sm:inline text-xs px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                {test.title}
              </span>
            </div>

            {/* Center: Timer & Screen Switch Monitor */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-base font-bold border transition-all ${isTimeCritical
                    ? "bg-red-500/20 text-red-400 border-red-500 animate-pulse shadow-lg shadow-red-500/20"
                    : "bg-amber-500/15 text-amber-400 border-amber-400/40"
                  }`}
              >
                <FiClock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Screen Switches Counter */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${tabSwitchCount === 0
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : tabSwitchCount >= 3
                      ? "bg-red-500/25 text-red-300 border-red-500 animate-pulse shadow-md shadow-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  }`}
                title="Screen switches allowed: maximum 3 before automatic submission"
              >
                <FiMonitor className="w-3.5 h-3.5" />
                <span>Switches: {tabSwitchCount}/3</span>
              </div>
            </div>

            {/* Right: Progress and Submit */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:inline">
                Answered: <strong className="text-amber-400">{answeredCount}</strong> / {totalQuestions}
              </span>
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 shadow-md shadow-amber-400/20 transition-all cursor-pointer"
              >
                Submit Test
              </button>
            </div>
          </header>

          {/* ── Floating Camera Proctoring Widget (Live Detection & Recording) ── */}
          {showCamWidget && cameraStream && (
            <div className="fixed bottom-5 right-5 z-50">
              <div
                className={`relative rounded-2xl overflow-hidden border-2 shadow-2xl transition-all duration-200 ${isCheating
                    ? "border-red-500 shadow-red-500/50 ring-4 ring-red-500/25"
                    : "border-emerald-500 shadow-emerald-400/30 ring-4 ring-emerald-500/20"
                  }`}
                style={{ width: 195, height: 155 }}
              >
                <video
                  ref={widgetVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Top Bar: Live Status Dot & REC indicator */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  {/* Real-time Status Dot: Green (all clear) <-> Red (cheating detected) */}
                  <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full backdrop-blur-md border ${isCheating
                        ? "bg-red-950/80 border-red-500/50 text-red-300"
                        : "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                      }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full animate-pulse ${isCheating
                          ? "bg-red-500 shadow-lg shadow-red-500"
                          : "bg-emerald-400 shadow-lg shadow-emerald-400"
                        }`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {isCheating ? "RED • ALERT" : "GREEN • OK"}
                    </span>
                  </div>

                  {/* Recording Indicator */}
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-red-500/40 text-[9px] font-bold text-red-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>REC</span>
                  </div>
                </div>

                {/* Cheat Notification Banner Overlay */}
                {isCheating ? (
                  <div className="absolute bottom-7 left-1 right-1 bg-red-600/95 text-white text-[10px] font-black px-1.5 py-0.5 rounded text-center leading-tight shadow-md animate-bounce">
                    ⚠️ {cheatReason || "Low Brightness Detected!"}
                  </div>
                ) : (
                  <div className="absolute bottom-7 left-1 right-1 bg-black/60 backdrop-blur-sm text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded text-center">
                    🟢 Proper Brightness • Clear
                  </div>
                )}

                {/* Live Brightness Indicator */}
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center text-[9px]">
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono font-bold shadow-sm ${brightness < 65
                        ? "bg-red-500/90 text-white animate-pulse"
                        : "bg-black/75 text-emerald-300 border border-emerald-400/40"
                      }`}
                  >
                    {brightness < 65 ? "🌙 Too Dark" : `☀️ Brightness: ${Math.round((brightness / 255) * 100)}%`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Main Assessment Body */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left 3 cols: Question & Options & Directly Visible Navigation */}
            <div className="lg:col-span-3 flex flex-col">
              <div
                className={`p-6 sm:p-8 rounded-3xl border shadow-2xl mb-6 ${isDarkMode
                    ? "bg-gray-900/90 border-amber-500/20 text-white"
                    : "bg-white border-amber-300 text-gray-900"
                  }`}
              >
                {/* Question meta bar */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 shadow-sm">
                      Question {currentIndex + 1} of {totalQuestions}
                    </span>
                    {isCurrentFlagged && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold flex items-center gap-1">
                        <FiFlag className="w-3.5 h-3.5" /> Flagged for Review
                      </span>
                    )}
                    {currentSelectedOption !== undefined && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <FiCheckCircle className="w-3.5 h-3.5" /> Answered
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleToggleFlag}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${isCurrentFlagged
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-gray-800/60 hover:bg-gray-700 text-gray-300 border-gray-700 cursor-pointer"
                      }`}
                  >
                    <FiFlag className="w-3.5 h-3.5" />
                    <span>{isCurrentFlagged ? "Unflag Question" : "Flag for Review"}</span>
                  </button>
                </div>

                {/* Question Statement */}
                <div
                  className={`p-6 rounded-2xl border mb-6 text-lg sm:text-xl font-bold leading-relaxed ${isDarkMode
                      ? "bg-black/40 border-gray-800 text-white"
                      : "bg-amber-50/60 border-amber-200 text-gray-900"
                    }`}
                >
                  {currentQ.question}
                </div>

                {/* Options List */}
                <div className="space-y-3 mb-8">
                  {currentQ.options &&
                    currentQ.options.map((option, optIdx) => {
                      const isSelected = currentSelectedOption === optIdx;
                      const optionLetters = ["A", "B", "C", "D"];

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleOptionSelect(optIdx)}
                          className={`p-4 sm:p-5 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all ${isSelected
                              ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-400/15 scale-[1.01]"
                              : isDarkMode
                                ? "bg-gray-800/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/80 text-gray-300"
                                : "bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 text-gray-800"
                            }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${isSelected
                                ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                                : isDarkMode
                                  ? "bg-gray-800 text-gray-400 border border-gray-700"
                                  : "bg-gray-100 text-gray-600 border border-gray-200"
                              }`}
                          >
                            {optionLetters[optIdx] || optIdx + 1}
                          </div>
                          <span className="text-base sm:text-lg font-medium flex-1">{option}</span>
                          {isSelected && (
                            <FiCheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* ── HIGHLY VISIBLE NAVIGATION BAR DIRECTLY BELOW EVERY MCQ ── */}
                <div className="pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Left: Clear Selection */}
                  <button
                    onClick={handleClearSelection}
                    disabled={currentSelectedOption === undefined}
                    className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all ${currentSelectedOption !== undefined
                        ? "text-gray-300 hover:text-amber-400 hover:bg-amber-500/10 border-gray-700 cursor-pointer"
                        : "text-gray-600 border-gray-800 cursor-not-allowed opacity-50"
                      }`}
                  >
                    Clear Selection
                  </button>

                  {/* Center / Right: BACK and NEXT Buttons */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {/* BACK BUTTON */}
                    <button
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm border shadow-md transition-all ${currentIndex > 0
                          ? "bg-gray-800 hover:bg-gray-700 text-white border-gray-700 hover:scale-105 active:scale-95 cursor-pointer"
                          : "bg-gray-800/20 text-gray-600 border-gray-800/40 cursor-not-allowed opacity-50"
                        }`}
                      title={currentIndex === 0 ? "You are on the first question" : "Go to previous question"}
                    >
                      <FiChevronLeft className="w-5 h-5" />
                      <span>Back</span>
                    </button>

                    {/* NEXT or FINAL CONFIRMATION BUTTON */}
                    {currentIndex < totalQuestions - 1 ? (
                      <button
                        onClick={handleNext}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        title="Go to next question"
                      >
                        <span>Next</span>
                        <FiChevronRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSubmitConfirm(true)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
                        title="Final question: review and submit test"
                      >
                        <FiCheckCircle className="w-5 h-5" />
                        <span>Final Confirmation & Submit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 col: Question Palette & Overview */}
            <div
              className={`rounded-2xl p-6 border h-fit ${isDarkMode ? "bg-gray-900/80 border-gray-800" : "bg-white border-amber-200"
                }`}
            >
              <h4 className="font-bold text-base mb-4 flex items-center justify-between">
                <span>Question Palette</span>
                <span className="text-xs text-amber-400 font-mono">
                  {answeredCount}/{totalQuestions} Answered
                </span>
              </h4>

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 gap-2.5 mb-6">
                {questions.map((q, idx) => {
                  const qKey = q._id || q.question;
                  const isAnswered = selectedAnswers[qKey] !== undefined;
                  const isFlagged = Boolean(flaggedQuestions[qKey]);
                  const isCurrent = currentIndex === idx;

                  let btnStyle = isDarkMode
                    ? "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600"
                    : "bg-gray-100 text-gray-600 border-gray-300 hover:border-gray-400";

                  if (isCurrent) {
                    btnStyle = "ring-2 ring-amber-400 font-black text-amber-400 bg-amber-500/20 border-amber-400";
                  } else if (isFlagged) {
                    btnStyle = "bg-purple-500/20 text-purple-400 border-purple-500/40 font-bold";
                  } else if (isAnswered) {
                    btnStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs text-gray-400 pt-4 border-t border-gray-700/40">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-emerald-500/20 border border-emerald-500/40"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-purple-500/20 border border-purple-500/40"></div>
                  <span>Flagged for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-gray-800 border border-gray-700"></div>
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md ring-2 ring-amber-400 bg-amber-500/20"></div>
                  <span>Current Question</span>
                </div>
              </div>

              {/* Security info reminder */}
              <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-gray-400 flex items-start gap-2">
                <FiLock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Anti-cheat active: copy/paste disabled. Tab switches are logged.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PHASE 3: RESULTS & EDUCATOR SOLUTIONS */}
      {/* ============================================================== */}
      {phase === "results" && testResult && (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-3xl p-8 md:p-12 border shadow-2xl mb-8 ${isDarkMode ? "bg-gray-900 border-amber-500/30" : "bg-white border-amber-300"
              }`}
          >
            {/* Score Header */}
            <div className="text-center mb-8 pb-8 border-b border-gray-700/40">
              <div
                className={`w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-xl ${testResult.passed
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-emerald-500/20"
                    : "bg-red-500/20 border border-red-500/40 text-red-400 shadow-red-500/20"
                  }`}
              >
                {testResult.passed ? <FiCheckCircle className="w-10 h-10" /> : <FiXCircle className="w-10 h-10" />}
              </div>

              <h2 className="text-3xl md:text-4xl font-black mb-2">
                {testResult.passed ? "Assessment Passed! 🎉" : "Assessment Completed"}
              </h2>

              <p className={`text-base ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                {testResult.passed
                  ? `Outstanding performance! You exceeded the ${testResult.passing_score}% requirement.`
                  : `You scored ${testResult.score_percentage}%. The passing mark is ${testResult.passing_score}%. Review solutions below and retake for a new set of questions.`}
              </p>
            </div>

            {/* Results Score Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xs text-gray-400 block mb-1">Final Score</span>
                <span className="text-3xl font-black text-amber-400">{testResult.score_percentage}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xs text-gray-400 block mb-1">Correct</span>
                <span className="text-3xl font-black text-emerald-400">
                  {testResult.correct_answers} / {testResult.total_questions}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                <span className="text-xs text-gray-400 block mb-1">Incorrect</span>
                <span className="text-3xl font-black text-red-400">{testResult.wrong_answers}</span>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-xs text-gray-400 block mb-1">Candidate</span>
                <span className="text-xs font-mono font-bold text-blue-400 block truncate">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Verified"}
                </span>
              </div>
            </div>

            {/* Actions: Retake or Browse More */}
            <div className="flex flex-wrap gap-4 items-center justify-center mb-12">
              <button
                onClick={handleRetakeTest}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-400/20 flex items-center gap-2 transition-all"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Retake Test (New Random Questions)</span>
              </button>
              <button
                onClick={() => navigate(isEducator ? "/educator-marks" : "/my-test-marks")}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
              >
                <FiAward className="w-4 h-4" />
                <span>{isEducator ? "View All Students' Marks" : "View My Test History"}</span>
              </button>
              <button
                onClick={() => navigate("/tests")}
                className={`px-6 py-3 rounded-xl font-bold text-sm border transition-colors ${isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                  }`}
              >
                Back to All Tests
              </button>
            </div>

            {/* Comprehensive Solution Review */}
            <div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-amber-400">
                <FiEye className="w-6 h-6" />
                <span>Verified Solutions & Educator Explanations</span>
              </h3>

              <div className="space-y-6">
                {testResult.detailed_review &&
                  testResult.detailed_review.map((item, idx) => {
                    const optionLetters = ["A", "B", "C", "D"];
                    const isCorrect = item.is_correct;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl p-6 border transition-all ${isCorrect
                            ? isDarkMode
                              ? "bg-emerald-950/20 border-emerald-500/30"
                              : "bg-emerald-50/60 border-emerald-300"
                            : isDarkMode
                              ? "bg-red-950/20 border-red-500/30"
                              : "bg-red-50/60 border-red-300"
                          }`}
                      >
                        {/* Status bar */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Question {idx + 1}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${isCorrect
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-red-500/20 text-red-400 border border-red-500/40"
                              }`}
                          >
                            {isCorrect ? (
                              <>
                                <FiCheckCircle className="w-3.5 h-3.5" /> Correct
                              </>
                            ) : (
                              <>
                                <FiXCircle className="w-3.5 h-3.5" /> Incorrect
                              </>
                            )}
                          </span>
                        </div>

                        {/* Question text */}
                        <h4 className="text-base font-bold mb-4">{item.question}</h4>

                        {/* Options breakdown */}
                        <div className="space-y-2 mb-4">
                          {item.options &&
                            item.options.map((opt, optIdx) => {
                              const isStudentSelected = item.selected_option === optIdx;
                              const isCorrectOpt = item.correct_option === optIdx;

                              let optBorder = isDarkMode ? "border-gray-800 bg-gray-900/40" : "border-gray-200 bg-white";
                              let badgeColor = "bg-gray-800 text-gray-400";

                              if (isCorrectOpt) {
                                optBorder = "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold";
                                badgeColor = "bg-emerald-500 text-black";
                              } else if (isStudentSelected && !isCorrectOpt) {
                                optBorder = "border-red-500 bg-red-500/15 text-red-300 font-semibold";
                                badgeColor = "bg-red-500 text-white";
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-3 rounded-xl border text-sm flex items-center justify-between gap-3 ${optBorder}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${badgeColor}`}
                                    >
                                      {optionLetters[optIdx]}
                                    </span>
                                    <span>{opt}</span>
                                  </div>
                                  <div className="text-xs font-semibold">
                                    {isCorrectOpt && <span className="text-emerald-400">✓ Correct Solution</span>}
                                    {isStudentSelected && !isCorrectOpt && (
                                      <span className="text-red-400">✗ Your Answer</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Educator Explanation */}
                        {item.explanation && (
                          <div className="p-4 rounded-xl bg-black/30 border border-gray-700/50 text-xs leading-relaxed">
                            <strong className="text-amber-400 block mb-1">Educator's Solution & Explanation:</strong>
                            <p className="text-gray-300">{item.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBMISSION CONFIRMATION MODAL */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full rounded-3xl p-8 border shadow-2xl ${isDarkMode ? "bg-gray-900 border-emerald-400/40 text-white" : "bg-white border-emerald-300 text-gray-900"
                }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <FiCheckCircle className="w-9 h-9" />
              </div>

              <h3 className="text-2xl font-black text-center mb-1">Final Submission Confirmation</h3>
              <p className="text-xs text-center text-gray-400 mb-6">
                Please review your assessment summary before submitting.
              </p>

              {/* Status metrics card */}
              <div className="p-4 rounded-2xl bg-black/40 border border-gray-800 mb-6 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Questions:</span>
                  <span className="font-bold text-white">{totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Answered Questions:</span>
                  <span className="font-bold text-emerald-400">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Unanswered Questions:</span>
                  <span className={`font-bold ${totalQuestions - answeredCount > 0 ? "text-red-400" : "text-gray-400"}`}>
                    {totalQuestions - answeredCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Screen Switches:</span>
                  <span className="font-bold text-amber-400">{tabSwitchCount} / 3</span>
                </div>
              </div>

              {answeredCount < totalQuestions && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 mb-6 flex items-start gap-2">
                  <FiAlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Warning: You still have <strong>{totalQuestions - answeredCount} unanswered</strong> question(s). Unanswered questions are graded as incorrect.
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleSubmitTest}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-lg shadow-emerald-400/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Confirm & Final Submit Assessment</span>
                  )}
                </button>

                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                    }`}
                >
                  Cancel & Review Questions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* ANTI-CHEATING WARNING OVERLAY MODAL */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showCheatingWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full rounded-3xl p-8 border border-red-500/50 bg-gray-900 text-white shadow-2xl shadow-red-500/30 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/40">
                <FiAlertTriangle className="w-8 h-8 animate-pulse" />
              </div>

              <span className="text-xs uppercase font-mono tracking-wider font-bold text-red-400 block mb-1">
                Security Alert • Warning #{tabSwitchCount} of 3
              </span>
              <h3 className="text-2xl font-black mb-3">
                {tabSwitchCount >= 3 ? "Final Warning: 3/3 Screen Switches!" : "Screen Switch Detected"}
              </h3>

              <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 mb-4 text-xs font-bold text-red-300 leading-relaxed text-left">
                ⚠️ WARNING: Changing screens or switching browser tabs more than 3 times will result in immediate automatic submission of your assessment!
              </div>

              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                {tabSwitchCount === 1 && (
                  <span>
                    You switched screens <strong>1 time</strong>. You have <strong>2 screen changes remaining</strong> before your test is automatically submitted.
                  </span>
                )}
                {tabSwitchCount === 2 && (
                  <span>
                    You switched screens <strong>2 times</strong>. You have only <strong>1 screen change remaining</strong> before your test is automatically submitted!
                  </span>
                )}
                {tabSwitchCount >= 3 && (
                  <span className="text-amber-300 font-bold">
                    You have reached <strong>3 screen changes</strong>. Any further switch or tab change will trigger immediate auto-submission!
                  </span>
                )}
              </p>

              <button
                onClick={() => setShowCheatingWarning(false)}
                className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-black shadow-lg shadow-red-500/25 transition-all cursor-pointer"
              >
                I Understand, Resume Assessment
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestTaking;

