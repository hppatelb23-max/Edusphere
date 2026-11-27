import React, { useState, useEffect,useRef } from 'react';
import { useNavigate, useLocation ,Link} from 'react-router-dom';
// import Web3 from 'web3';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown,FiCopy, FiLogOut, FiPlusCircle } from 'react-icons/fi';
import { FiUser, FiDollarSign, FiBook, FiGift } from "react-icons/fi";
// import { MdOutlineLibraryAdd, MdOutlineAccountBalance } from 'react-icons/md';
// import { RiCoinsLine } from 'react-icons/ri';
// import { BiBook, BiGift } from 'react-icons/bi';
import { useWallet } from "../context/WalletProvider";
import axios from 'axios';
// import { contractAbi, contractAddress } from "../utils/constants";
import { useWriteContract, useAccount } from 'wagmi'
// import {CourseContext, CourseProvider} from "./context1"
import { toast } from 'react-toastify';
import { dummyCourses } from '../utils/dummyCourses';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useTheme } from "next-themes";
import { useThemeStore } from "../store/themeStore";
import { API_BASE_URL } from "../utils/api";
import ThreeLineMenu, { downloadDepositReceipt } from "./ThreeLineMenu";

const CoursesPage = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [account, setAccount] = useState(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [courses, setCourses] = useState(dummyCourses);
  const navigate = useNavigate();
  const { state } = useLocation();
  const menuRef = useRef(null);
  const { walletAddress, walletConnected, connectWallet, disconnectWallet: providerDisconnect } = useWallet();
  const { theme, setTheme } = useTheme();
  const userRole = localStorage.getItem("role") || "student";
  const isEducator = userRole === "educator";

  // Balance & Add Money Modal
  const [inrBalance, setInrBalance] = useState(() => {
    if (isEducator) {
      return Number(localStorage.getItem("educator_inr_balance") || "0");
    }
    const saved = localStorage.getItem("student_inr_cash") || localStorage.getItem("demo_upi_cash");
    if (!saved || saved === "1000") {
      localStorage.setItem("student_inr_cash", "0");
      localStorage.setItem("demo_upi_cash", "0");
      return 0;
    }
    return Number(saved);
  });
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyMethod, setAddMoneyMethod] = useState("upi"); // 'upi' | 'card'
  const [upiIdInput, setUpiIdInput] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");
  const [cardExpiryInput, setCardExpiryInput] = useState("");
  const [cardCvvInput, setCardCvvInput] = useState("");
  const [addAmountInput, setAddAmountInput] = useState(isEducator ? "1000" : "500");
  const [isAddingMoney, setIsAddingMoney] = useState(false);

  useEffect(() => {
    const syncBalance = (e) => {
      if (e?.detail?.balance !== undefined) {
        setInrBalance(Number(e.detail.balance));
      } else {
        if (isEducator) {
          setInrBalance(Number(localStorage.getItem("educator_inr_balance") || "0"));
        } else {
          setInrBalance(Number(localStorage.getItem("student_inr_cash") || localStorage.getItem("demo_upi_cash") || "0"));
        }
      }
    };
    window.addEventListener("edusphere_balance_updated", syncBalance);
    window.addEventListener("storage", syncBalance);
    return () => {
      window.removeEventListener("edusphere_balance_updated", syncBalance);
      window.removeEventListener("storage", syncBalance);
    };
  }, [isEducator]);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (isEducator) {
          const activeWallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem("educatorWallet") || getCookie("walletAddress") || "";
          const activeName = localStorage.getItem("username") || localStorage.getItem("educatorName") || "";
          if (!activeWallet && !activeName) return;
          const token = getCookie("admin");
          const res = await axios.get(`${API_BASE_URL}/admin/inr-earnings`, {
            params: { wallet: activeWallet, name: activeName },
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const amt = res.data?.inr_earnings ?? 0;
          const bal = res.data?.inr_balance ?? amt;
          setInrBalance(bal);
          localStorage.setItem("educator_inr_earnings", String(amt));
          localStorage.setItem("educator_inr_balance", String(bal));
        } else {
          const res = await axios.get(`${API_BASE_URL}/user/demo-upi-balance`, {
            params: { wallet: walletAddress || "" }
          });
          const bal = res.data?.inr_balance ?? res.data?.demo_balance ?? 0;
          setInrBalance(bal);
          localStorage.setItem("student_inr_cash", String(bal));
          localStorage.setItem("demo_upi_cash", String(bal));
        }
      } catch (e) {}
    };
    fetchBalance();
  }, [walletAddress, isEducator]);

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardNumberInput(formatted);
  };

  const handleConfirmAddMoney = async (e) => {
    e?.preventDefault();
    const amt = Number(addAmountInput);

    if (!amt || isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount (₹1 to ₹500).");
      return;
    }
    if (amt > 500) {
      toast.error("Maximum amount that can be added at a time is ₹500 only.");
      return;
    }

    if (addMoneyMethod === "upi") {
      const trimmedUpi = upiIdInput.trim();
      if (!trimmedUpi) {
        toast.error("Please enter your UPI ID.");
        return;
      }
      if (!trimmedUpi.includes("@")) {
        toast.error("Please enter a valid UPI ID (e.g., student@upi, mobile@paytm).");
        return;
      }
    } else {
      const cleanCard = cardNumberInput.replace(/\s+/g, "");
      if (!cleanCard) {
        toast.error("Please enter your Credit or Debit Card number.");
        return;
      }
      if (cleanCard.length < 12) {
        toast.error("Please enter a valid 12-16 digit Card number.");
        return;
      }
      const cleanCvv = cardCvvInput.replace(/\D/g, "");
      if (cleanCvv.length !== 3) {
        toast.error("Please enter a valid 3-digit CVV.");
        return;
      }
    }

    const activeWallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem(isEducator ? "adminWallet" : "studentWallet") || localStorage.getItem("educatorWallet") || getCookie("walletAddress") || "";
    const activeName = isEducator
      ? (localStorage.getItem("educatorName") || localStorage.getItem("name") || (localStorage.getItem("role") === "educator" ? localStorage.getItem("username") : "") || "")
      : (localStorage.getItem("studentName") || localStorage.getItem("name") || (localStorage.getItem("role") === "student" ? localStorage.getItem("username") : "") || "");

    setIsAddingMoney(true);
    try {
      const methodLabel = addMoneyMethod === "upi" ? `UPI ID (${upiIdInput.trim()})` : `Card (•••• ${cardNumberInput.replace(/\s+/g, "").slice(-4)})`;
      const res = await axios.post(`${API_BASE_URL}/user/demo-upi-add-cash`, {
        amount: amt,
        wallet: activeWallet,
        name: activeName,
        is_educator: isEducator,
        payment_method: methodLabel
      });

      const newBal = res.data?.new_balance ?? (inrBalance + amt);
      setInrBalance(newBal);
      if (isEducator) {
        localStorage.setItem("educator_inr_balance", String(newBal));
      } else {
        localStorage.setItem("student_inr_cash", String(newBal));
        localStorage.setItem("demo_upi_cash", String(newBal));
      }

      const depNow = Date.now();
      const depIso = new Date(depNow).toISOString();
      const depRecord = {
        _id: res.data?.transaction?._id || `dep_${depNow}`,
        invoice_no: `EDUDEP-${depNow.toString().slice(-6)}`,
        user_name: activeName || (isEducator ? "Educator" : "Student"),
        student_name: activeName || (isEducator ? "Educator" : "Student"),
        role: isEducator ? "Educator" : "Student",
        amount: amt,
        currency: "INR",
        payment_method: methodLabel,
        transaction_address: res.data?.transaction?.transaction_address || `TXN-DEP-${depNow}`,
        bank_utr: res.data?.transaction?.bank_utr || `DEP-${depNow}`,
        timestamp: depNow,
        createdAt: depIso,
        purchased_date: depIso,
        date: new Date(depNow).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        status: "SUCCESS",
        type: "deposit",
        course_purchased: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
        course_title: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
        educator_name: "Personal Rupee Wallet"
      };

      try {
        const storeKey = isEducator ? "educator_transactions" : "student_transactions";
        const existingTxns = JSON.parse(localStorage.getItem(storeKey) || "[]");
        existingTxns.unshift(depRecord);
        localStorage.setItem(storeKey, JSON.stringify(existingTxns));
        window.dispatchEvent(new CustomEvent("edusphere_transaction_created", {
          detail: { transaction: depRecord, isEducator }
        }));
      } catch (e) {}

      try {
        downloadDepositReceipt(depRecord);
      } catch (dlErr) {
        console.error("Error auto-downloading deposit receipt:", dlErr);
      }

      try {
        window.dispatchEvent(new CustomEvent("edusphere_balance_updated", { detail: { balance: newBal, isEducator } }));
      } catch (e) {}

      toast.success(`🎉 Added ₹${amt} via ${addMoneyMethod === "upi" ? "UPI ID" : "Card"}! Receipt generated. New Balance: ₹${newBal}`);
      setShowAddMoneyModal(false);
      setUpiIdInput("");
      setCardNumberInput("");
      setCardExpiryInput("");
      setCardCvvInput("");
      setAddAmountInput("500");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      if (err.response?.status === 400 && errMsg) {
        toast.error(errMsg);
      } else {
        const newBal = inrBalance + amt;
        setInrBalance(newBal);
        localStorage.setItem("student_inr_cash", String(newBal));
        localStorage.setItem("demo_upi_cash", String(newBal));
        toast.success(`🎉 Added ₹${amt}! New Balance: ₹${newBal}`);
        setShowAddMoneyModal(false);
      }
    } finally {
      setIsAddingMoney(false);
    }
  };

  const { writeContract, writeContractAsync } = useWriteContract()
  const { address } = useAccount()


   const dropdownRef = useRef(null);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

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

  useEffect(() => {
    if (window.ethereum) {
      setIsMetaMaskInstalled(true);
      loadAccount();
    }
  }, []);

 

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
    } else {
      setAccount(accounts[0]);
    }
  };

  const loadAccount = async () => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      setAccount(window.ethereum.selectedAddress);
    }
  };
  

  const disconnectWallet = () => {
    setAccount(null);
    setIsMenuOpen(false);
    if (providerDisconnect) providerDisconnect();
    else window.location.href = "/";
  };
  const toggleisDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const activeEduWallet = (walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem("educatorWallet") || "").toLowerCase();
  const activeEduName = (localStorage.getItem("username") || localStorage.getItem("educatorName") || "").trim().toLowerCase();

  const filteredCourses = courses.filter(course => {
    if (!course) return false;
    // Educator own courses should NOT be seen in other courses (only in manage courses)
    if (isEducator) {
      const courseAuthorWallet = (course.author_wallet_id || "").toLowerCase();
      const courseAuthorName = (course.author_name || "").toLowerCase().trim();
      const isMine =
        (activeEduWallet && courseAuthorWallet && courseAuthorWallet === activeEduWallet) ||
        (activeEduName && courseAuthorName && courseAuthorName === activeEduName);
      if (isMine) return false;
    }
    return (course.title || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleVisitCourse = (course) => {
    navigate(`/course/${course._id || course.title}`, { state: { course } });
  };
  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/courses`);

        if (response.status === 200 && Array.isArray(response.data?.courses)) {
          const dbCourses = response.data.courses;
          let deletedIds = [];
          try {
            deletedIds = JSON.parse(localStorage.getItem("deleted_course_ids") || "[]");
          } catch(e) {}

          const seenIds = new Set();
          const seenTitles = new Set();
          const uniqueList = [];

          let localCustom = [];
          try {
            localCustom = JSON.parse(localStorage.getItem("edusphere_custom_courses") || "[]");
          } catch(e) {}

          [...dbCourses, ...localCustom, ...dummyCourses].forEach((c) => {
            if (!c) return;
            const sid = c._id ? c._id.toString() : null;
            if (sid && deletedIds.includes(sid)) return;
            const normTitle = (c.title || "").toLowerCase().trim();
            if ((!sid || !seenIds.has(sid)) && (!normTitle || !seenTitles.has(normTitle))) {
              if (sid) seenIds.add(sid);
              if (normTitle) seenTitles.add(normTitle);
              uniqueList.push(c);
            }
          });

          setCourses(uniqueList);
        } else {
          let deletedIds = [];
          try {
            deletedIds = JSON.parse(localStorage.getItem("deleted_course_ids") || "[]");
          } catch(e) {}
          setCourses(dummyCourses.filter(c => !deletedIds.includes(c._id ? c._id.toString() : "")));
        }
      } catch (error) {
        console.warn("Could not fetch remote courses, falling back to dummy courses:", error);
        let deletedIds = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem("deleted_course_ids") || "[]");
        } catch(e) {}
        setCourses(dummyCourses.filter(c => !deletedIds.includes(c._id ? c._id.toString() : "")));
      }
    };

    fetchCourses();
  }, []);
 

  return (
    <div
      className={`${
        isDarkMode
          ? "bg-gradient-to-r from-black to-gray-700 text-white"
          : "bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900"
      } transition-colors duration-300`}
    >
      <nav className={`flex justify-between items-center p-5 px-8 ${isDarkMode ? "bg-gray-900/80 border-b border-gray-700/50" : "bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-sm"} sticky top-0 z-40`}>
             <div className="flex items-center space-x-2">
               
                <img src="/images/Edusphere logo.png" alt="Logo" className="w-12 h-12 rounded-full shadow-lg" />
                 
                
               
               <h1 className="text-4xl font-bold ">Edusphere</h1>
             </div>
             <div className="flex items-center space-x-8">
               <div className="flex space-x-8">
                 <Link to={isEducator ? "/educatorhome" : "/studenthome"} className={`group relative text-lg font-medium transition-colors ${isDarkMode ? "hover:text-amber-500" : "text-slate-700 hover:text-amber-600 font-semibold"}`}>
                                  Home
                                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
                                </Link>
                                <Link to="/courses" className={`group relative text-lg font-medium transition-colors ${isDarkMode ? "hover:text-amber-500" : "text-slate-700 hover:text-amber-600 font-semibold"}`}>
                                  Courses
                                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
                                </Link>
            <Link to="/tests" className={`group relative text-lg font-medium transition-colors ${isDarkMode ? "hover:text-amber-500" : "text-slate-700 hover:text-amber-600 font-semibold"}`}>
              Tests
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {!isEducator && (
              <Link to="/my-test-marks" className={`group relative text-lg font-medium transition-colors ${isDarkMode ? "hover:text-amber-500" : "text-slate-700 hover:text-amber-600 font-semibold"}`}>
                Test Review
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
            {!isEducator && (
              <Link to="/contest" className={`group relative text-lg font-medium transition-colors ${isDarkMode ? "hover:text-amber-500" : "text-slate-700 hover:text-amber-600 font-semibold"}`}>
                Contest
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
               </div>
     
               {/* Student Indian Rupee Balance Badge */}
               {walletConnected && (
                 <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-sm">
                   <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/80">Online Money Available:</span>
                   <span className="font-black text-sm text-emerald-300">₹{Number(inrBalance).toLocaleString("en-IN")}</span>
                 </div>
               )}

               {/* Wallet Button */}
                   <motion.button
                           
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                             className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                               walletConnected ? 
                               'bg-emerald-500/20 text-emerald-400' : 
                               'bg-amber-500 hover:bg-amber-600 text-white'
                             } transition-colors`}
                             onClick={walletConnected ? handleWalletClick : connectWallet}
                           >
                             {walletConnected ? (
                               <>
                                 <span className="hidden sm:inline">
                                 {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""}
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
                                   <path d="M10 2a1 1 0 011 1v1.323l3.954.99a1 1 0 01.686.828L15.667 8H17a1 1 0 110 2h-1.333l-.012.082a5 5 0 01-4.245 4.245L11 14.667V17a1 1 0 11-2 0v-2.333l-.082-.012a5 5 0 01-4.245-4.245L4.333 10H3a1 1 0 110-2h1.333l.027-.86a1 1 0 01.686-.827L9 4.323V3a1 1 0 011-1z"/>
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
           <div className="border-b-4 border-gold"></div>
      <div className={`px-20 pt-16 pb-10 flex flex-col items-center gap-3`}>
        <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Explore Courses</h2>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-amber-700/70'}`}>Discover courses taught by expert educators on the blockchain</p>
        <div className={`relative w-full max-w-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-amber-200 shadow-md shadow-amber-100/60'} rounded-full transition-all duration-300 focus-within:scale-[1.02]`}>
          <input
            type="text"
            className={`w-full px-8 py-4 rounded-full outline-none transition-colors ${
              isDarkMode ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-transparent text-gray-800 placeholder-gray-400'
            }`}
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-2xl ${
            isDarkMode ? 'text-gray-400' : 'text-amber-500'
          }`}>
            🔍
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-12 pb-20">
        {filteredCourses.map((course, index) => (
          <div
            key={course._id}
            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
              isDarkMode
                ? 'bg-gray-800 shadow-xl shadow-black/30'
                : 'bg-white/95 shadow-xl shadow-slate-100/90 border border-slate-200/90 hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-100/60'
            }`}
          >
            <div className="relative h-60 overflow-hidden">
              <img 
                src={
                  course.course_image?.startsWith('http://') || 
                  course.course_image?.startsWith('https://') || 
                  course.course_image?.startsWith('/') 
                    ? course.course_image 
                    : "https://gateway.pinata.cloud/ipfs/" + course.course_image
                } 
                alt={course.title} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute inset-0 " />
            </div>
            
            <div className="p-6">
              <h3 className={`text-xl font-bold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {course.title}
              </h3>
              
              <div className="flex items-center flex-wrap gap-2 mb-4">
                {Array.isArray(course.category) ? (
                  course.category.map((cat, catIdx) => (
                    <span key={catIdx} className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isDarkMode ?
                      'bg-amber-900/40 text-amber-300 border border-amber-700/50' :
                      'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isDarkMode ?
                    'bg-amber-900/40 text-amber-300 border border-amber-700/50' :
                    'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {course.category}
                  </span>
                )}
              </div>
                {/* Dual Pricing UI: ETH FIRST, then UPI — Both of exact same font size & attractive styling */}
              {(() => {
                const ethPrice = course.price_eth !== undefined && Number(course.price_eth) > 0
                  ? Number(course.price_eth)
                  : (course.course_price && Number(course.course_price) < 5 ? Number(course.course_price) : 0.01);
                const upiPrice = course.price_inr !== undefined && Number(course.price_inr) > 0
                  ? Number(course.price_inr)
                  : (course.course_price && Number(course.course_price) >= 5 ? Number(course.course_price) : 499);

                return (
                  <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold mb-2 text-gray-400">
                      <span>Available Pricing</span>
                      <span className="text-amber-400 font-mono text-[10px]">ETH & UPI</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* 1. ETH Badge (FIRST) */}
                      <div className={`flex items-center gap-2 p-2 rounded-xl shadow-sm ${
                        isDarkMode ? "bg-amber-500/15 border border-amber-500/40 text-amber-300" : "bg-amber-50 border border-amber-300 text-amber-900"
                      }`}>
                        <div className="w-7 h-7 rounded-lg bg-amber-400 text-black font-black text-xs flex items-center justify-center shrink-0 shadow">
                          Ξ
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[10px] uppercase font-bold block leading-tight ${isDarkMode ? "text-amber-400/80" : "text-amber-800"}`}>ETH</span>
                          <span className={`text-sm font-black font-mono tracking-tight block truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            {ethPrice} ETH
                          </span>
                        </div>
                      </div>

                      {/* 2. UPI Badge (SECOND) */}
                      <div className={`flex items-center gap-2 p-2 rounded-xl shadow-sm ${
                        isDarkMode ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300" : "bg-emerald-50 border border-emerald-300 text-emerald-900"
                      }`}>
                        <div className="w-7 h-7 rounded-lg bg-emerald-400 text-black font-black text-xs flex items-center justify-center shrink-0 shadow">
                          ₹
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[10px] uppercase font-bold block leading-tight ${isDarkMode ? "text-emerald-400/80" : "text-emerald-800"}`}>UPI</span>
                          <span className={`text-sm font-black font-mono tracking-tight block truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            ₹{Number(upiPrice).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={() => handleVisitCourse(course)}
                className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all shadow-md ${
                  isDarkMode ?
                  'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black' :
                  'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-amber-200/50'
                }`}
              >
                Visit Course
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add Money Modal (UPI ID & Card Options, Max ₹500) ── */}
      <AnimatePresence>
        {showAddMoneyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full rounded-3xl p-6 sm:p-8 border shadow-2xl relative ${
                isDarkMode ? "bg-gray-900 border-amber-500/30 text-white" : "bg-white border-amber-200 text-gray-900"
              }`}
            >
              {/* Close button */}
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 text-2xl font-black">
                  ₹
                </div>
                <div>
                  <h3 className="text-xl font-black">Add Money</h3>
                  <p className="text-xs text-gray-400">
                    Current Balance: <strong className="text-emerald-400">₹{Number(inrBalance).toLocaleString("en-IN")} INR</strong>
                  </p>
                </div>
              </div>

              {/* Step 1: Select Payment Method (UPI ID or Card) */}
              <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  1. Choose Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAddMoneyMethod("upi")}
                    className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      addMoneyMethod === "upi"
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30 shadow-md"
                        : isDarkMode
                        ? "bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl">📱</span>
                    <span>UPI ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddMoneyMethod("card")}
                    className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      addMoneyMethod === "card"
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30 shadow-md"
                        : isDarkMode
                        ? "bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl">💳</span>
                    <span>Credit / Debit Card</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Method Input Details */}
              <div className="mb-5">
                {addMoneyMethod === "upi" ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Enter your UPI ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@upi / 9876543210@paytm"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-mono outline-none transition-all ${
                        isDarkMode
                          ? "bg-gray-800/70 border-gray-700 focus:border-emerald-400 text-white placeholder-gray-500"
                          : "bg-gray-50 border-gray-300 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                      }`}
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Supports Google Pay, PhonePe, Paytm, BHIM or any banking UPI app
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Credit or Debit Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="XXXX XXXX XXXX XXXX"
                        value={cardNumberInput}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-mono outline-none transition-all ${
                          isDarkMode
                            ? "bg-gray-800/70 border-gray-700 focus:border-emerald-400 text-white placeholder-gray-500"
                            : "bg-gray-50 border-gray-300 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiryInput}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                            if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                            setCardExpiryInput(v);
                          }}
                          maxLength={5}
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono outline-none ${
                            isDarkMode
                              ? "bg-gray-800/70 border-gray-700 focus:border-emerald-400 text-white"
                              : "bg-gray-50 border-gray-300 focus:border-emerald-500 text-gray-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cardCvvInput}
                          onChange={(e) => setCardCvvInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          maxLength={3}
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono outline-none ${
                            isDarkMode
                              ? "bg-gray-800/70 border-gray-700 focus:border-emerald-400 text-white"
                              : "bg-gray-50 border-gray-300 focus:border-emerald-500 text-gray-900"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Enter Amount (Maximum ₹500) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Amount to Add (₹ INR)
                  </label>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Max Limit: ₹500
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    placeholder="Enter amount (1 - 500)"
                    value={addAmountInput}
                    onChange={(e) => setAddAmountInput(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-lg font-black font-mono outline-none transition-all ${
                      isDarkMode
                        ? "bg-gray-800/70 border-gray-700 focus:border-emerald-400 text-emerald-300"
                        : "bg-gray-50 border-gray-300 focus:border-emerald-500 text-emerald-700"
                    }`}
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-emerald-400 text-lg">
                    ₹
                  </div>
                </div>

                <div className="flex gap-2 mt-2.5">
                  {[100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddAmountInput(String(preset))}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        addAmountInput === String(preset)
                          ? "bg-emerald-500 text-black border-emerald-400 shadow-sm"
                          : isDarkMode
                          ? "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-emerald-500/50"
                          : "bg-gray-100 border-gray-300 text-gray-700 hover:border-emerald-400"
                      }`}
                    >
                      ₹{preset}{preset === 500 ? " (Max)" : ""}
                    </button>
                  ))}
                </div>

                {Number(addAmountInput) > 500 && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1 font-semibold">
                    <span>⚠️</span> Maximum amount allowed is ₹500 only.
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-xs border transition-colors ${
                    isDarkMode ? "border-gray-700 hover:bg-gray-800 text-gray-400" : "border-gray-300 hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAddingMoney || Number(addAmountInput) <= 0 || Number(addAmountInput) > 500}
                  onClick={handleConfirmAddMoney}
                  className="flex-[2] py-3 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isAddingMoney ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Add ₹{Number(addAmountInput) || 0} to Account</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className={`py-8 text-center ${
        isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
      } backdrop-blur-lg border-t ${
        isDarkMode ? 'border-gray-800' : 'border-amber-200/60'
      }`}>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          © 2025 Edusphere. All rights reserved.<br />
          Empowering learners through blockchain technology
        </p>
      </footer>
    </div>
  );
};

export default CoursesPage;