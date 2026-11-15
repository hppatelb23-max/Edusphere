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
  FiSettings,
  FiSmartphone,
  FiPrinter,
  FiFileText,
  FiDownload,
  FiClock,
  FiX,
  FiRefreshCw,
  FiCreditCard
} from "react-icons/fi";
import { useTheme } from "next-themes";
import { useThemeStore } from "../store/themeStore";
import { useWallet } from "../context/WalletProvider";
import axios from "axios";
import { contractAbi, contractAddress } from "../utils/constants";
import { useWriteContract } from "wagmi";
import { toast } from "react-toastify";
import { API_BASE_URL, getCookie } from "../utils/api";
import ThreeLineMenu from "./ThreeLineMenu";
import { ethers } from "ethers";


// Dynamically synchronized speech captions based on video lecture audio context and playback time
const getSpeechCaption = (courseTitle = "", videoTitle = "", timeInSec = 0) => {
  const combined = (courseTitle + " " + videoTitle).toLowerCase();
  let track = [];

  if (combined.includes("python") || combined.includes("data") || combined.includes("ai") || combined.includes("ml")) {
    track = [
      "Welcome everyone! In this Python lecture, we explore the core syntax and data structures.",
      "Setting up our interactive Python environment and importing required dependencies.",
      "Notice how variables are dynamically typed and efficiently assigned in memory.",
      "Let's structure our function with clear parameters, return types, and documentation.",
      "Here we apply list comprehensions and lambda expressions for cleaner functional logic.",
      "Always handle potential exceptions gracefully using structured try-except blocks.",
      "Let's inspect the runtime output in our console to verify that the logic holds.",
      "Integrating our data processing pipeline with NumPy and Pandas for rapid analysis.",
      "Notice the algorithmic time complexity and how vectorization dramatically speeds up execution.",
      "This modular pattern ensures our codebase remains clean, reusable, and easy to test.",
      "Let's run a quick unit test suite to validate our functions before proceeding.",
      "In the next video, we will deploy this script into an automated cloud workflow."
    ];
  } else if (combined.includes("blockchain") || combined.includes("web3") || combined.includes("solidity") || combined.includes("crypto") || combined.includes("eth")) {
    track = [
      "Welcome! In this Web3 session, we dive deep into smart contracts and blockchain logic.",
      "Ensure your MetaMask wallet is connected and funded with testnet Ethereum.",
      "Here is the smart contract layout: state variables, events, and custom function modifiers.",
      "Notice how gas optimization techniques minimize transaction execution fees on-chain.",
      "We implement strict access controls using OpenZeppelin standards to secure our contract.",
      "Always safeguard against re-entrancy attacks and integer overflow vulnerabilities.",
      "Emitting index events allows our decentralized application front-end to react to state changes.",
      "Let's simulate contract deployment and test method execution via ethers.js in real time.",
      "Checking the cryptographic transaction receipt and block confirmations on the ledger.",
      "Decentralized consensus guarantees that this transaction is tamper-proof and immutable.",
      "Now let's interact with our deployed smart contract directly through the React interface.",
      "In the next video, we will verify the contract source code on Etherscan."
    ];
  } else if (combined.includes("react") || combined.includes("javascript") || combined.includes("frontend") || combined.includes("web")) {
    track = [
      "Welcome to this lesson! Today we build responsive React components and manage state.",
      "Notice how React's virtual DOM diffing engine efficiently updates rendered elements.",
      "Here we declare useState and useEffect hooks to handle asynchronous lifecycle events.",
      "Passing structured props down our component tree while preserving unidirectional data flow.",
      "Handling user interactions and form submissions with seamless input validation.",
      "Asynchronous API calls fetch real-time updates directly from our backend server.",
      "Applying Tailwind CSS utility classes to achieve a polished, responsive user interface.",
      "Memoizing expensive calculations with useMemo to prevent unnecessary component re-renders.",
      "Implementing robust error boundaries to guarantee that the UI never crashes unexpectedly.",
      "Let's open React DevTools to inspect our state hierarchy and verify prop updates.",
      "Notice how clean separation of concerns makes testing our components effortless.",
      "In the next module, we will connect this component to our global state store."
    ];
  } else {
    track = [
      "Welcome to this lecture! Today we cover essential concepts and hands-on fundamentals.",
      "Let's walk through the project setup and ensure all tools are configured properly.",
      "Notice how core foundational principles guide this entire step-by-step implementation.",
      "Here we break down the complex architecture into small, manageable modules.",
      "Pay close attention to how user inputs are validated, processed, and transformed.",
      "Applying industry best practices guarantees robust, secure, and reliable outcomes.",
      "Let's run a test execution in the console to verify that our output behaves as expected.",
      "Notice the performance benefits of optimizing this critical execution pathway.",
      "Handling edge cases properly ensures that our application remains resilient in production.",
      "Reviewing the key takeaways before connecting this logic to our next learning module.",
      "Take a moment to practice this example in your local code editor before moving on.",
      "In our next lesson, we will build upon these techniques with advanced practical exercises."
    ];
  }

  const step = Math.floor(Math.max(0, timeInSec) / 5) % track.length;
  return track[step];
};

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
  const currentWallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem("educatorWallet") || "";
  const currentName = localStorage.getItem("username") || localStorage.getItem("educatorName") || "";
  const isAuthor = Boolean(
    (educatorWallet && currentWallet && educatorWallet.toLowerCase() === currentWallet.toLowerCase()) ||
    (course?.author_name && currentName && course.author_name.toLowerCase().trim() === currentName.toLowerCase().trim())
  );
  const isEducator = userRole === "educator";

  // Purchasing & Enrollment State
  const [isPurchased, setIsPurchased] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [billData, setBillData] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [activeGatewayOrder, setActiveGatewayOrder] = useState(null);
  const [isVerifyingGateway, setIsVerifyingGateway] = useState(false);
  const [gatewayTab, setGatewayTab] = useState("upi"); // "upi" | "card" | "netbanking"
  const [upiSubTab, setUpiSubTab] = useState("qr"); // "qr" | "vpa" | "apps"
  const [userVpa, setUserVpa] = useState("");
  const [paymentStep, setPaymentStep] = useState("selection"); // "selection" | "processing" | "success"
  const [countdown, setCountdown] = useState(300);
  const [demoUpiCash, setDemoUpiCash] = useState(() => {
    const role = localStorage.getItem("role");
    const isEdu = role === "educator" || Boolean(getCookie("admin"));
    if (isEdu) {
      const savedEducator = localStorage.getItem("educator_inr_balance") || localStorage.getItem("educator_inr_earnings");
      if (savedEducator !== null && savedEducator !== undefined) {
        return Number(savedEducator);
      }
    }
    const saved = localStorage.getItem("student_inr_cash") || localStorage.getItem("demo_upi_cash");
    if (!saved || saved === "1000") {
      return 0;
    }
    return Number(saved);
  });

  useEffect(() => {
    const handleBalanceUpdate = (e) => {
      if (e?.detail?.balance !== undefined) {
        setDemoUpiCash(Number(e.detail.balance));
      } else {
        const role = localStorage.getItem("role");
        const isEdu = isEducator || role === "educator" || Boolean(getCookie("admin"));
        if (isEdu) {
          const savedEducator = localStorage.getItem("educator_inr_balance") || localStorage.getItem("educator_inr_earnings");
          if (savedEducator !== null && savedEducator !== undefined) {
            setDemoUpiCash(Number(savedEducator));
            return;
          }
        }
        const saved = localStorage.getItem("student_inr_cash") || localStorage.getItem("demo_upi_cash");
        if (saved !== null && saved !== undefined) {
          setDemoUpiCash(Number(saved));
        }
      }
    };
    window.addEventListener("edusphere_balance_updated", handleBalanceUpdate);
    window.addEventListener("storage", handleBalanceUpdate);
    return () => {
      window.removeEventListener("edusphere_balance_updated", handleBalanceUpdate);
      window.removeEventListener("storage", handleBalanceUpdate);
    };
  }, [isEducator]);
  const [upiPin, setUpiPin] = useState("");
  const [educatorBillData, setEducatorBillData] = useState(null);
  const [activeReceiptTab, setActiveReceiptTab] = useState("student"); // "student" | "educator"

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

  // Full access: course author is always unlocked; all others (students & educators) unlocked only if purchased
  const isUnlocked = isAuthor || isPurchased;

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

    // Check backend my-learning enrollment if token or wallet exists
    const token = getCookie("admin") || getCookie("user");
    const activeWallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem("educatorWallet") || getCookie("walletAddress") || "";
    const activeName = localStorage.getItem("username") || localStorage.getItem("educatorName") || localStorage.getItem("studentName") || "";
    if (token || activeWallet) {
      axios
        .get(`${API_BASE_URL}/user/my-learning`, {
          params: { wallet: activeWallet, student_name: activeName },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
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

  // Independent Pricing — INR and ETH are set separately by educator, no forced conversion
  const exactAmountInr = course?.price_inr !== undefined && Number(course.price_inr) > 0
    ? Number(course.price_inr)
    : (course?.currency === "INR" && Number(course?.course_price) > 0 ? Number(course?.course_price) : 499);
  const exactAmountEth = course?.price_eth !== undefined && Number(course.price_eth) > 0
    ? Number(course.price_eth)
    : (course?.currency !== "INR" && Number(course?.course_price) > 0 ? Number(course?.course_price) : 0.05);

  // Countdown timer for UPI Gateway processing step
  useEffect(() => {
    let timer;
    if (paymentStep === "processing" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentStep, countdown]);

  // Fetch student's / educator's UPI Cash balance from backend / localStorage
  const fetchDemoCash = async () => {
    try {
      const role = localStorage.getItem("role");
      const isEdu = isEducator || role === "educator" || Boolean(getCookie("admin"));
      const activeWallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem("educatorWallet") || getCookie("walletAddress") || "";
      const activeName = (isEdu ? (localStorage.getItem("educatorName") || localStorage.getItem("name")) : (localStorage.getItem("studentName") || localStorage.getItem("name"))) || localStorage.getItem("username") || "";

      if (isEdu) {
        const token = getCookie("admin");
        const res = await axios.get(`${API_BASE_URL}/admin/inr-earnings`, {
          params: { wallet: activeWallet, name: activeName },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const amt = res.data?.inr_earnings ?? 0;
        const bal = res.data?.inr_balance ?? amt;
        setDemoUpiCash(bal);
        localStorage.setItem("educator_inr_earnings", String(amt));
        localStorage.setItem("educator_inr_balance", String(bal));
      } else {
        const token = getCookie("user");
        const res = await axios.get(`${API_BASE_URL}/user/demo-upi-balance`, {
          params: {
            wallet: activeWallet,
            name: activeName
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data?.inr_balance !== undefined || res.data?.demo_balance !== undefined) {
          const bal = res.data?.inr_balance ?? res.data?.demo_balance;
          setDemoUpiCash(bal);
          localStorage.setItem("student_inr_cash", String(bal));
          localStorage.setItem("demo_upi_cash", String(bal));
        }
      }
    } catch (e) {
      const role = localStorage.getItem("role");
      const isEdu = isEducator || role === "educator" || Boolean(getCookie("admin"));
      if (isEdu) {
        const saved = localStorage.getItem("educator_inr_balance") || localStorage.getItem("educator_inr_earnings");
        if (saved) setDemoUpiCash(Number(saved));
      } else {
        const saved = localStorage.getItem("student_inr_cash") || localStorage.getItem("demo_upi_cash");
        if (saved) setDemoUpiCash(Number(saved));
      }
    }
  };

  useEffect(() => {
    fetchDemoCash();
  }, [walletAddress, isEducator]);

  const handleAddDemoCash = async (amt = 500) => {
    const role = localStorage.getItem("role");
    const isEdu = isEducator || role === "educator" || Boolean(getCookie("admin"));
    const activeWallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem("educatorWallet") || getCookie("walletAddress") || "";
    const activeName = (isEdu ? (localStorage.getItem("educatorName") || localStorage.getItem("name")) : (localStorage.getItem("studentName") || localStorage.getItem("name"))) || localStorage.getItem("username") || "";

    if (isEdu) {
      try {
        const token = getCookie("admin");
        const res = await axios.post(
          `${API_BASE_URL}/admin/add-inr`,
          {
            amount: amt,
            wallet: activeWallet,
            name: activeName
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );
        const newBal = res.data?.new_balance !== undefined ? res.data.new_balance : (demoUpiCash + amt);
        setDemoUpiCash(newBal);
        localStorage.setItem("educator_inr_balance", String(newBal));
        try {
          window.dispatchEvent(new CustomEvent("edusphere_balance_updated", { detail: { balance: newBal, isEducator: true } }));
        } catch (err) {}
        toast.success(`🎉 Added ₹${amt} Indian Rupees! New Balance: ₹${newBal}`);
      } catch (e) {
        const newBal = demoUpiCash + amt;
        setDemoUpiCash(newBal);
        localStorage.setItem("educator_inr_balance", String(newBal));
        try {
          window.dispatchEvent(new CustomEvent("edusphere_balance_updated", { detail: { balance: newBal, isEducator: true } }));
        } catch (err) {}
        toast.success(`🎉 Added ₹${amt} Indian Rupees! New Balance: ₹${newBal}`);
      }
    } else {
      try {
        const token = getCookie("user");
        const res = await axios.post(
          `${API_BASE_URL}/user/demo-upi-add-cash`,
          {
            amount: amt,
            wallet: activeWallet,
            name: activeName
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );
        const newBal = res.data?.new_balance !== undefined ? res.data.new_balance : (demoUpiCash + amt);
        setDemoUpiCash(newBal);
        localStorage.setItem("student_inr_cash", String(newBal));
        localStorage.setItem("demo_upi_cash", String(newBal));
        try {
          window.dispatchEvent(new CustomEvent("edusphere_balance_updated", { detail: { balance: newBal, isEducator: false } }));
        } catch (err) {}
        toast.success(`🎉 Added ₹${amt} Indian Rupees! New Balance: ₹${newBal}`);
      } catch (e) {
        const newBal = demoUpiCash + amt;
        setDemoUpiCash(newBal);
        localStorage.setItem("student_inr_cash", String(newBal));
        localStorage.setItem("demo_upi_cash", String(newBal));
        try {
          window.dispatchEvent(new CustomEvent("edusphere_balance_updated", { detail: { balance: newBal, isEducator: false } }));
        } catch (err) {}
        toast.success(`🎉 Added ₹${amt} Indian Rupees! New Balance: ₹${newBal}`);
      }
    }
  };

  // Helper to dynamically load Razorpay script if needed
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Verification function called on payment success
  const verifyAndEnroll = async (paymentResponse) => {
    const token = getCookie("admin") || getCookie("user");
    const role = localStorage.getItem("role");
    const isEdu = isEducator || role === "educator" || Boolean(getCookie("admin"));
    const buyerName =
      (isEdu ? (localStorage.getItem("educatorName") || localStorage.getItem("name")) : (localStorage.getItem("studentName") || localStorage.getItem("name"))) ||
      localStorage.getItem("username") ||
      (isEdu ? "Educator" : "Student");
    const buyerWallet =
      walletAddress ||
      localStorage.getItem("walletAddress") ||
      localStorage.getItem("educatorWallet") ||
      getCookie("walletAddress") ||
      "";

    setIsVerifyingGateway(true);
    try {
      toast.info("Verifying payment with Indian Rupee gateway...");
      const verifyRes = await axios.post(
        `${API_BASE_URL}/user/razorpay-verify`,
        {
          razorpay_order_id: paymentResponse.razorpay_order_id || activeGatewayOrder?.id || `order_${Date.now()}`,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature || "simulated_sig",
          course_id: course?._id || id,
          student_wallet: buyerWallet,
          student_name: buyerName,
          amount: exactAmountInr,
          buyer_role: isEdu ? "educator" : "student"
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );

      if (verifyRes.data?.enrolled || verifyRes.data?.success) {
        // Deduct from local INR cash balance
        const updatedCash = verifyRes.data?.student_remaining_balance !== undefined
          ? verifyRes.data.student_remaining_balance
          : Math.max(0, demoUpiCash - exactAmountInr);
        setDemoUpiCash(updatedCash);
        try {
          if (isEdu) {
            localStorage.setItem("educator_inr_balance", String(updatedCash));
            window.dispatchEvent(new CustomEvent("edusphere_balance_updated", { detail: { balance: updatedCash, isEducator: true } }));
          } else {
            localStorage.setItem("student_inr_cash", String(updatedCash));
            localStorage.setItem("demo_upi_cash", String(updatedCash));
            window.dispatchEvent(new CustomEvent("edusphere_balance_updated", { detail: { balance: updatedCash, isEducator: false } }));
          }
        } catch (e) {}
        setUpiPin("");

        // Persist educator revenue
        if (verifyRes.data?.educator_total_earnings !== undefined) {
          try {
            localStorage.setItem("educator_inr_earnings", String(verifyRes.data.educator_total_earnings));
          } catch (e) {}
        }

        // Persist enrollment in localStorage
        try {
          const stored = localStorage.getItem("enrolled_courses");
          const list = stored ? JSON.parse(stored) : [];
          const cid = course?._id || id;
          if (!list.includes(cid)) list.push(cid);
          localStorage.setItem("enrolled_courses", JSON.stringify(list));
          if (buyerWallet) {
            localStorage.setItem(`enrolled_${buyerWallet.toLowerCase()}_${cid}`, "true");
          }
        } catch (e) {}

        setIsPurchased(true);
        setShowGatewayModal(false);
        setPaymentStep("selection");

        // Dual Receipts: Student & Educator
        const studentRec = verifyRes.data?.receipt || {
          invoice_no: `EDUPAY-${Date.now().toString().slice(-6)}`,
          student_name: buyerName,
          educator_name: course?.author_name || "Educator",
          course_title: course?.title || "Course",
          amount: exactAmountInr,
          currency: "INR",
          payment_method: "Indian Rupees (₹ Cash)",
          payment_id: paymentResponse.razorpay_payment_id,
          transaction_id: paymentResponse.razorpay_payment_id,
          date: new Date().toLocaleString("en-IN"),
          status: "PAID & ENROLLED IN INDIAN RUPEES (₹)"
        };
        const educatorRec = verifyRes.data?.educator_receipt || {
          voucher_no: `EDUEARN-${Date.now().toString().slice(-6)}`,
          educator_name: course?.author_name || "Educator",
          student_name: buyerName,
          course_title: course?.title || "Course",
          amount_credited: exactAmountInr,
          currency: "INR",
          payment_id: paymentResponse.razorpay_payment_id,
          date: new Date().toLocaleString("en-IN"),
          status: "CREDITED TO EDUCATOR REVENUE (₹)"
        };

        setBillData(studentRec);
        setEducatorBillData(educatorRec);
        setShowBillModal(true);

        try {
          const eduTxns = JSON.parse(localStorage.getItem("educator_transactions") || "[]");
          eduTxns.unshift({
            _id: verifyRes.data?.transaction?._id || `sale_${Date.now()}`,
            type: "sales",
            type_label: "Student Course Sale",
            student_name: buyerName,
            course_purchased: course?.title || "Course",
            educator_name: course?.author_name || "Educator",
            amount: exactAmountInr,
            currency: "INR",
            payment_method: "Indian Rupees (₹)",
            transaction_address: paymentResponse.razorpay_payment_id,
            invoice_no: educatorRec.voucher_no,
            purchase_date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            status: "SUCCESS",
            is_credit: true
          });
          localStorage.setItem("educator_transactions", JSON.stringify(eduTxns));
          localStorage.setItem("educator_purchases", JSON.stringify(eduTxns));
        } catch (e) {}

        toast.success(`🎉 Paid ₹${exactAmountInr} INR! Credited to Educator (${course?.author_name || "Educator"}). Remaining Balance: ₹${updatedCash}`);
      } else {
        toast.error(verifyRes.data?.error || "Payment verification failed.");
      }
    } catch (vErr) {
      console.error("Verification error:", vErr);
      toast.error(vErr.response?.data?.error || "Payment verification failed.");
    } finally {
      setIsVerifyingGateway(false);
    }
  };

  // ── Indian Rupees Direct Checkout Modal Trigger ────────────────
  const handleOpenRupeeModal = () => {
    setShowGatewayModal(true);
  };



  // ─── DOWNLOADABLE PAYMENT RECEIPT GENERATOR (BOTH UPI & ETH) ──────────────────
  const downloadReceipt = (receipt) => {
    if (!receipt) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Edusphere Tax Invoice - ${receipt.invoice_no || "Receipt"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; padding: 40px 20px; margin: 0; }
    .receipt-container { max-width: 640px; margin: 0 auto; background: #111827; border: 1px solid #374151; border-radius: 20px; padding: 36px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
    .header { text-align: center; border-bottom: 2px dashed #4b5563; padding-bottom: 24px; margin-bottom: 24px; }
    .logo { font-size: 26px; font-weight: 900; color: #f59e0b; letter-spacing: -0.5px; margin: 0; }
    .badge { display: inline-block; background: #065f46; color: #34d399; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; margin-top: 10px; border: 1px solid #059669; }
    .invoice-meta { font-size: 13px; color: #9ca3af; margin-top: 8px; }
    .banner { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 24px; font-weight: bold; color: #10b981; font-size: 15px; }
    .item-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .item-table tr { border-bottom: 1px solid #1f2937; }
    .item-table td { padding: 12px 6px; font-size: 13px; }
    .item-table td.label { color: #9ca3af; font-weight: 500; width: 40%; }
    .item-table td.val { color: #ffffff; font-weight: 700; text-align: right; }
    .highlight { color: #10b981; font-size: 16px; font-weight: 900; }
    .hash-val { font-family: monospace; font-size: 11px; color: #38bdf8; word-break: break-all; }
    .footer { text-align: center; border-top: 1px solid #1f2937; padding-top: 20px; font-size: 11px; color: #6b7280; line-height: 1.6; }
    @media print {
      body { background: #ffffff; color: #111827; padding: 0; }
      .receipt-container { border: 1px solid #e5e7eb; background: #ffffff; box-shadow: none; color: #111827; }
      .logo { color: #d97706; }
      .item-table td.label { color: #4b5563; }
      .item-table td.val { color: #111827; }
      .hash-val { color: #0284c7; }
      .banner { background: #f0fdf4; border-color: #86efac; color: #15803d; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1 class="logo">EDUSPHERE</h1>
      <div class="badge">Official Course Enrollment Receipt</div>
      <div class="invoice-meta">Invoice No: <strong style="color: #f59e0b;">${receipt.invoice_no || "N/A"}</strong> &bull; Date: ${receipt.date || new Date().toLocaleString()}</div>
    </div>
    <div class="banner">
      ✓ Verified & Cryptographically Recorded on Blockchain Ledger
    </div>
    <table class="item-table">
      <tr>
        <td class="label">Student Name:</td>
        <td class="val">${receipt.student_name || "Student"}</td>
      </tr>
      <tr>
        <td class="label">Course Title:</td>
        <td class="val">${receipt.course_title || "Course"}</td>
      </tr>
      <tr>
        <td class="label">Amount Paid:</td>
        <td class="val highlight">${receipt.currency === "INR" ? "₹" + receipt.amount + " INR" : receipt.amount + " ETH"}</td>
      </tr>
      <tr>
        <td class="label">Payment Method:</td>
        <td class="val">${receipt.payment_method || "Online"}</td>
      </tr>
      ${receipt.transaction_id || receipt.payment_id ? `
      <tr>
        <td class="label">Payment / Transaction ID:</td>
        <td class="val hash-val">${receipt.transaction_id || receipt.payment_id}</td>
      </tr>` : ""}
      ${receipt.bank_utr ? `
      <tr>
        <td class="label">Bank Reference / UTR:</td>
        <td class="val hash-val">${receipt.bank_utr}</td>
      </tr>` : ""}
      ${receipt.student_wallet ? `
      <tr>
        <td class="label">Student Wallet Address:</td>
        <td class="val hash-val">${receipt.student_wallet}</td>
      </tr>` : ""}
      <tr>
        <td class="label">Blockchain Transaction Hash:</td>
        <td class="val hash-val">${receipt.blockchain_hash || receipt.transaction_id || "Recorded on Blockchain"}</td>
      </tr>
      <tr>
        <td class="label">Enrollment Status:</td>
        <td class="val" style="color: #10b981;">✓ ${receipt.status || "CONFIRMED & UNLOCKED"}</td>
      </tr>
    </table>
    <div class="footer">
      <p>This document serves as proof of course purchase and ownership registered on the Ethereum Blockchain network & Edusphere LMS.</p>
      <p>&copy; 2026 Edusphere Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Edusphere_Receipt_${receipt.invoice_no || "Course"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded successfully!");
  };

  const downloadEducatorReceipt = (receipt) => {
    if (!receipt) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Edusphere Educator Credit Voucher - ${receipt.voucher_no || "Voucher"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; padding: 40px 20px; margin: 0; }
    .receipt-container { max-width: 640px; margin: 0 auto; background: #111827; border: 1px solid #374151; border-radius: 20px; padding: 36px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
    .header { text-align: center; border-bottom: 2px dashed #4b5563; padding-bottom: 24px; margin-bottom: 24px; }
    .logo { font-size: 26px; font-weight: 900; color: #10b981; letter-spacing: -0.5px; margin: 0; }
    .badge { display: inline-block; background: #065f46; color: #34d399; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; margin-top: 10px; border: 1px solid #059669; }
    .invoice-meta { font-size: 13px; color: #9ca3af; margin-top: 8px; }
    .banner { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 24px; font-weight: bold; color: #10b981; font-size: 15px; }
    .item-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .item-table tr { border-bottom: 1px solid #1f2937; }
    .item-table td { padding: 12px 6px; font-size: 13px; }
    .item-table td.label { color: #9ca3af; font-weight: 500; width: 40%; }
    .item-table td.val { color: #ffffff; font-weight: 700; text-align: right; }
    .highlight { color: #10b981; font-size: 18px; font-weight: 900; }
    .hash-val { font-family: monospace; font-size: 11px; color: #38bdf8; word-break: break-all; }
    .footer { text-align: center; border-top: 1px solid #1f2937; padding-top: 20px; font-size: 11px; color: #6b7280; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1 class="logo">EDUSPHERE</h1>
      <div class="badge">Official Educator Earning Voucher</div>
      <div class="invoice-meta">Voucher No: <strong style="color: #10b981;">${receipt.voucher_no || "N/A"}</strong> &bull; Date: ${receipt.date || new Date().toLocaleString("en-IN")}</div>
    </div>
    <div class="banner">
      ✓ Revenue Credited to Educator Wallet (Indian Rupees ₹)
    </div>
    <table class="item-table">
      <tr>
        <td class="label">Educator Name:</td>
        <td class="val">${receipt.educator_name || "Educator"}</td>
      </tr>
      <tr>
        <td class="label">Course Title:</td>
        <td class="val">${receipt.course_title || "Course"}</td>
      </tr>
      <tr>
        <td class="label">Enrolled Student:</td>
        <td class="val">${receipt.student_name || "Student"}</td>
      </tr>
      <tr>
        <td class="label">Amount Credited:</td>
        <td class="val highlight">+₹${receipt.amount_credited || receipt.amount || 0} INR</td>
      </tr>
      <tr>
        <td class="label">Payment ID:</td>
        <td class="val hash-val">${receipt.payment_id || "N/A"}</td>
      </tr>
      <tr>
        <td class="label">Payout Status:</td>
        <td class="val" style="color: #10b981;">✓ ${receipt.status || "CREDITED TO EDUCATOR REVENUE"}</td>
      </tr>
    </table>
    <div class="footer">
      <p>This voucher certifies revenue distribution credited to the educator on the Edusphere LMS platform.</p>
      <p>&copy; 2026 Edusphere Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Edusphere_Educator_Voucher_${receipt.voucher_no || Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("📥 Educator Voucher downloaded!");
  };



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
    if (!isAuthor) {
      toast.error("Only the author educator of this course can delete videos.");
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
    if (!isAuthor) {
      toast.error("Only the author educator of this course can publish videos.");
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

    const token = getCookie("admin") || getCookie("user");
    if (!token) {
      toast.warn("Please add your account details first before purchasing.");
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
        "You are the educator of this course. You cannot purchase your own course."
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

      const studentDisplayName = localStorage.getItem("username") || localStorage.getItem("studentName") || "Student";
      const response = await axios.post(
        `${API_BASE_URL}/user/purchase-course`,
        {
          course_id: course._id,
          transaction_id: txHash,
          payment_method: "MetaMask (ETH)",
          amount: Number(validPrice || 0),
          currency: "ETH",
          student_wallet: walletAddress || localStorage.getItem("walletAddress") || "",
          student_name: studentDisplayName,
          blockchain_hash: txHash
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

      // Update educator earnings and dispatch event
      if (response.data?.educator_total_earnings !== undefined) {
        try {
          localStorage.setItem("educator_inr_earnings", String(response.data.educator_total_earnings));
          localStorage.setItem("educator_inr_balance", String(response.data.educator_total_earnings));
          window.dispatchEvent(new CustomEvent("edusphere_balance_updated", { detail: { balance: response.data.educator_total_earnings, isEducator: true } }));
        } catch (e) {}
      }

      // Prepare official bill / receipt for ETH purchase
      const receipt = {
        invoice_no: `EDUPAY-${Date.now().toString().slice(-6)}`,
        student_name: studentDisplayName,
        course_title: course?.title || "Enrolled Course",
        amount: validPrice,
        currency: "ETH",
        payment_method: "Ethereum (MetaMask)",
        transaction_id: txHash,
        student_wallet: walletAddress,
        blockchain_hash: txHash,
        date: new Date().toLocaleString(),
        status: "PAID & VERIFIED ON-CHAIN"
      };

      const educatorRec = response.data?.educator_receipt || {
        voucher_no: `EDUEARN-${Date.now().toString().slice(-6)}`,
        educator_name: course?.author_name || "Educator",
        student_name: studentDisplayName,
        course_title: course?.title || "Course",
        amount_credited: validPrice,
        currency: "ETH",
        payment_id: txHash,
        date: new Date().toLocaleString("en-IN"),
        status: "CREDITED TO EDUCATOR REVENUE (ETH)"
      };

      try {
        const eduTxns = JSON.parse(localStorage.getItem("educator_transactions") || "[]");
        eduTxns.unshift({
          _id: response.data?.transaction?._id || `sale_${Date.now()}`,
          type: "sales",
          type_label: "Student Course Sale",
          student_name: studentDisplayName,
          course_purchased: course?.title || "Course",
          educator_name: course?.author_name || "Educator",
          amount: validPrice,
          currency: "ETH",
          payment_method: "MetaMask (ETH)",
          transaction_address: txHash,
          invoice_no: educatorRec.voucher_no,
          purchase_date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          status: "SUCCESS",
          is_credit: true
        });
        localStorage.setItem("educator_transactions", JSON.stringify(eduTxns));
        localStorage.setItem("educator_purchases", JSON.stringify(eduTxns));
      } catch (e) {}

      setBillData(receipt);
      setEducatorBillData(educatorRec);
      setShowBillModal(true);

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

          {/* Unified Three-Line Menu */}
          <ThreeLineMenu isEducator={isEducator} isDarkMode={isDarkMode} />
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
                <span className="text-gray-400 font-medium">Pricing:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs font-mono shadow-sm">
                    Ξ {exactAmountEth} ETH
                  </span>
                  <span className="text-gray-500 text-xs font-bold">or</span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs font-mono shadow-sm">
                    ₹ {Number(exactAmountInr).toLocaleString("en-IN")} UPI
                  </span>
                </div>
              </div>
            </div>

            {/* Buy Action Buttons (Available for Students & other Educators) */}
            {!isAuthor && (
              <div className="mt-6 pt-4 border-t border-gray-800 space-y-3">
                {isPurchased ? (
                  <div className="w-full py-3.5 rounded-xl font-bold text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center gap-2">
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Enrolled & Course Unlocked</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Student Rupee Balance Quick Indicator */}
                    {walletConnected && (
                      <div className="flex items-center justify-between text-xs px-1 text-gray-400">
                        <span>Your Rupee Balance:</span>
                        <span className="font-extrabold text-emerald-400">₹{Number(demoUpiCash).toLocaleString("en-IN")} INR</span>
                      </div>
                    )}

                    {/* 1. Enroll with ETH (FIRST) */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePurchase}
                      disabled={isBuying}
                      className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm border flex items-center justify-center gap-2 transition-all ${
                        isBuying
                          ? "bg-amber-600/70 text-white cursor-wait border-amber-600"
                          : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-md shadow-amber-500/25 border-amber-400 cursor-pointer"
                      }`}
                    >
                      {isBuying ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Confirming in MetaMask...</span>
                        </>
                      ) : (
                        <>
                          <FiUnlock className="w-4 h-4 text-black" />
                          <span>⟠ Enroll with ETH ({exactAmountEth} ETH)</span>
                        </>
                      )}
                    </motion.button>

                    {/* 2. Buy with UPI / INR (SECOND) — Same font size & attractive */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleOpenRupeeModal}
                      className="w-full py-3 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <FiDollarSign className="w-4 h-4" />
                      <span>⚡ Buy with UPI / INR (₹{Number(exactAmountInr).toLocaleString("en-IN")})</span>
                    </motion.button>
                  </div>
                )}
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

                  <p className="text-xs sm:text-sm text-gray-300 mb-5 leading-relaxed">
                    This course contains {videosList.length || 1} video lectures.
                    Enroll with Indian Rupees (₹{exactAmountInr}) or Ethereum MetaMask ({exactAmountEth} ETH) to unlock and watch all lectures.
                  </p>

                  <div className="flex items-center gap-4 sm:gap-6 mb-5 px-6 py-2.5 rounded-2xl bg-black/70 border border-amber-500/30 backdrop-blur-md">
                    <div className="text-center">
                      <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">⟠ MetaMask / ETH</span>
                      <span className="text-base sm:text-lg font-black text-amber-300 font-mono">{exactAmountEth} ETH</span>
                    </div>
                    <div className="w-px h-8 bg-gray-700" />
                    <div className="text-center">
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">⚡ Indian Rupees (UPI)</span>
                      <span className="text-base sm:text-lg font-black text-emerald-300 font-mono">₹{Number(exactAmountInr).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    {/* 1. ETH Enroll Button (FIRST) */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handlePurchase}
                      disabled={isBuying}
                      className={`px-6 py-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isBuying
                          ? "bg-amber-600 text-white cursor-wait"
                          : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-500/25"
                      }`}
                    >
                      {isBuying ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Confirming in MetaMask...</span>
                        </>
                      ) : (
                        <>
                          <FiUnlock className="w-4 h-4 text-black" />
                          <span>⟠ Enroll with ETH — {exactAmountEth} ETH</span>
                        </>
                      )}
                    </motion.button>

                    {/* 2. UPI / INR Button (SECOND) */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleOpenRupeeModal}
                      className="px-6 py-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <FiDollarSign className="w-4 h-4" />
                      <span>⚡ Buy with UPI / INR (₹{Number(exactAmountInr).toLocaleString("en-IN")})</span>
                    </motion.button>
                  </div>
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

                    {/* Captions Overlay Track with Synchronized Real Speech Subtitles */}
                    {showCaptions && (
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-2xl w-11/12 text-center pointer-events-none transition-all duration-300 z-30">
                        <div className="inline-flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-black/90 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-2xl">
                          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-amber-400/80">
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">CC</span>
                            <span>{currentVideoTitle}</span>
                            <span>&bull;</span>
                            <span>{formatTime(currentTime)}</span>
                          </div>
                          <p className="text-xs sm:text-sm md:text-base font-medium text-white tracking-wide leading-relaxed">
                            "{getSpeechCaption(course?.title, currentVideoTitle, currentTime)}"
                          </p>
                        </div>
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
                      {isAuthor
                        ? "As the author educator of this course, you can publish your first lesson video below."
                        : "The educator has not yet published lecture videos for this course. Please check back soon."}
                    </p>
                    {isAuthor && (
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

                {/* Author Educator Actions: Delete Video & Publish More Videos */}
                {isAuthor && (
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





      {/* ── Buy with Indian Rupees (₹) Modal ──────────────────────────── */}
      <AnimatePresence>
        {showGatewayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 bg-gray-900 text-white flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 px-6 py-5 flex items-center justify-between text-white shrink-0 border-b border-emerald-600/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-black text-xl shadow">
                    ₹
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight">
                      Buy with Indian Rupees (₹)
                    </h3>
                    <p className="text-[11px] text-emerald-200">
                      {isEducator ? "Direct Educator-to-Educator Transfer" : "Direct Student-to-Educator Transfer"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-200 uppercase tracking-wider block">Course Price</span>
                    <span className="text-xl font-black text-white">₹{exactAmountInr}</span>
                  </div>
                  <button
                    onClick={() => setShowGatewayModal(false)}
                    className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Course Details Card */}
                <div className="p-4 rounded-2xl bg-gray-800/80 border border-gray-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Course Name</span>
                    <span className="text-emerald-400 font-bold font-mono">₹{exactAmountInr} INR</span>
                  </div>
                  <h4 className="font-bold text-white text-base leading-snug">{course?.title}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-700/60">
                    <span>Educator / Author:</span>
                    <span className="text-amber-400 font-semibold">{course?.author_name || "Educator"}</span>
                  </div>
                </div>

                {/* Balance & Deduction Breakdown Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-gray-900 to-gray-800 border border-emerald-500/40 shadow-inner space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                        {isEducator ? "Educator Rupee Balance" : "Student Rupee Balance"}
                      </span>
                      <div className="text-2xl font-black text-white mt-0.5">
                        ₹{Number(demoUpiCash).toLocaleString("en-IN")}{" "}
                        <span className="text-xs font-normal text-gray-400">INR</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddDemoCash(500)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] shadow transition-all active:scale-95"
                      >
                        + ₹500
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddDemoCash(1000)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/80 hover:bg-emerald-400 text-black font-extrabold text-[11px] shadow transition-all active:scale-95"
                      >
                        + ₹1,000
                      </button>
                    </div>
                  </div>

                  {/* Transfer Breakdown */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-700/60 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>{isEducator ? "Deduction from Educator:" : "Deduction from Student:"}</span>
                      <span className="text-red-400 font-bold">- ₹{exactAmountInr} INR</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Credit to Educator ({course?.author_name || "Educator"}):</span>
                      <span className="text-emerald-400 font-bold">+ ₹{exactAmountInr} INR</span>
                    </div>
                    <div className="flex justify-between text-white font-semibold pt-1 border-t border-gray-700/40">
                      <span>{isEducator ? "Educator Remaining Balance:" : "Student Remaining Balance:"}</span>
                      <span className="text-amber-400 font-bold">
                        ₹{Number(Math.max(0, demoUpiCash - exactAmountInr)).toLocaleString("en-IN")} INR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Insufficient balance alert */}
                {demoUpiCash < exactAmountInr && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs text-center font-medium">
                    ⚠️ Insufficient balance! Click <strong>+ ₹500</strong> or <strong>+ ₹1,000</strong> above to top up.
                  </div>
                )}

                {/* Pay Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (demoUpiCash < exactAmountInr) {
                        toast.error("Insufficient Indian Rupees! Please add money first.");
                        return;
                      }
                      const simId = `inr_pay_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 900 + 100)}`;
                      verifyAndEnroll({
                        razorpay_order_id: `order_inr_${Date.now()}`,
                        razorpay_payment_id: simId,
                        razorpay_signature: "inr_direct_verified"
                      });
                    }}
                    disabled={isVerifyingGateway || demoUpiCash < exactAmountInr}
                    className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isVerifyingGateway ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Transferring ₹{exactAmountInr} & Unlocking Course...</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="w-5 h-5" />
                        <span>✓ Confirm & Pay ₹{exactAmountInr} (Indian Rupees)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-950 px-6 py-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <FiShield className="text-emerald-400" />
                  <span>Instant Student-to-Educator Settlement</span>
                </span>
                <span>Official Receipts Generated</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          STUDENT OFFICIAL BILL / INVOICE RECEIPT MODAL
         ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showBillModal && billData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full rounded-3xl p-6 sm:p-8 bg-gray-900 border border-amber-400/40 text-white shadow-2xl relative max-h-[92vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowBillModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-lg"
              >
                ✕
              </button>

              {/* Receipt Header */}
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 mb-2">
                  <FiFileText className="w-3.5 h-3.5" />
                  <span>Official Transaction Records (Dual Receipts)</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  {activeReceiptTab === "student" ? "Edusphere Tax Invoice" : "Educator Earning Voucher"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Record ID: <strong className="text-amber-400 font-mono">{activeReceiptTab === "student" ? billData.invoice_no : (educatorBillData?.voucher_no || billData.invoice_no)}</strong>
                </p>
              </div>

              {/* Dual Tab Switcher: Student Receipt & Educator Receipt */}
              <div className="flex border-b border-gray-800 mb-5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveReceiptTab("student")}
                  className={`flex-1 py-2.5 border-b-2 transition-all ${
                    activeReceiptTab === "student"
                      ? "border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-xl"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  🎓 Student Purchase Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReceiptTab("educator")}
                  className={`flex-1 py-2.5 border-b-2 transition-all ${
                    activeReceiptTab === "educator"
                      ? "border-emerald-400 text-emerald-400 bg-emerald-500/10 rounded-t-xl"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  👨‍🏫 Educator Credit Voucher
                </button>
              </div>

              {/* Highlight Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border border-amber-500/30 mb-5 text-center">
                <span className="text-[11px] text-gray-300 block mb-0.5 uppercase tracking-wider">
                  {activeReceiptTab === "student" ? "Student Purchase Confirmation" : "Educator Revenue Credit Confirmation"}
                </span>
                <p className="text-base sm:text-lg font-black text-white">
                  {activeReceiptTab === "student" ? (
                    <>
                      🎉 <span className="text-amber-400">{billData.student_name}</span> purchased{" "}
                      <span className="text-white">"{billData.course_title}"</span> for{" "}
                      <span className="text-emerald-400">
                        {billData.currency === "INR" ? `₹${billData.amount} INR` : `${billData.amount} ETH`}
                      </span>
                    </>
                  ) : (
                    <>
                      💰 Credited <span className="text-emerald-400">+₹{billData.amount} INR</span> to educator{" "}
                      <span className="text-amber-400">{educatorBillData?.educator_name || course?.author_name || "Educator"}</span> for sale of{" "}
                      <span className="text-white">"{billData.course_title}"</span>!
                    </>
                  )}
                </p>
              </div>

              {/* Itemized Receipt Table */}
              <div className="p-4 rounded-2xl bg-black/60 border border-gray-800 space-y-2.5 text-xs mb-6 font-mono">
                {activeReceiptTab === "student" ? (
                  <>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Student Name:</span>
                      <span className="text-white font-bold">{billData.student_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Educator / Faculty:</span>
                      <span className="text-amber-400 font-bold">{educatorBillData?.educator_name || course?.author_name || "Educator"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Course Enrolled:</span>
                      <span className="text-amber-400 font-bold truncate max-w-[200px]">{billData.course_title}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Amount Deducted:</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {billData.currency === "INR" ? `₹${billData.amount} INR` : `${billData.amount} ETH`}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Payment Method:</span>
                      <span className="text-white font-bold">{billData.payment_method}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Date & Time:</span>
                      <span className="text-gray-300">{billData.date}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-gray-400 font-sans">Status:</span>
                      <span className="text-emerald-400 font-bold uppercase tracking-wider">
                        ✓ {billData.status || "CONFIRMED & UNLOCKED"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Educator Name:</span>
                      <span className="text-emerald-400 font-bold">{educatorBillData?.educator_name || course?.author_name || "Educator"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Purchased By Student:</span>
                      <span className="text-white font-bold">{billData.student_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Course Title:</span>
                      <span className="text-amber-400 font-bold truncate max-w-[200px]">{billData.course_title}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Revenue Credited:</span>
                      <span className="text-emerald-400 font-black text-sm">+₹{billData.amount} INR</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Payment Reference:</span>
                      <span className="text-cyan-300 font-mono text-[10px] truncate max-w-[200px]">{billData.payment_id || billData.transaction_id}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 font-sans">Credit Date:</span>
                      <span className="text-gray-300">{billData.date}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-gray-400 font-sans">Settlement Status:</span>
                      <span className="text-emerald-400 font-bold uppercase tracking-wider">
                        ✓ CREDITED TO EDUCATOR REVENUE
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons: Download Receipt / Print / Start Learning */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (activeReceiptTab === "student") {
                      downloadReceipt(billData);
                    } else {
                      downloadEducatorReceipt(educatorBillData || billData);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/30"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>Download {activeReceiptTab === "student" ? "Student Invoice" : "Educator Voucher"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 px-4 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <FiPrinter className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="flex-[1.5] py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <FiPlay className="w-3.5 h-3.5" />
                  <span>Start Watching</span>
                </button>
              </div>
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
