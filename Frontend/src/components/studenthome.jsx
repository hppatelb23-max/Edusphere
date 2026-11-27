import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiDollarSign, FiBook, FiGift, FiCopy, FiAward, FiLogOut, FiPlusCircle } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from "../context/WalletProvider";
import { useThemeStore } from "../store/themeStore";
import { API_BASE_URL, getCookie } from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";
import ThreeLineMenu, { downloadDepositReceipt } from "./ThreeLineMenu";

const Studenthome = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const { walletAddress, walletConnected, connectWallet, disconnectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("role", "student");
    localStorage.removeItem("admin");
    localStorage.removeItem("educatorName");
    localStorage.removeItem("educatorWallet");
    localStorage.removeItem("adminWallet");
  }, []);

  const [inrBalance, setInrBalance] = useState(() => {
    const saved = localStorage.getItem("student_inr_cash") || localStorage.getItem("demo_upi_cash");
    if (!saved || saved === "1000") {
      localStorage.setItem("student_inr_cash", "0");
      localStorage.setItem("demo_upi_cash", "0");
      return 0;
    }
    return Number(saved);
  });

  useEffect(() => {
    const handleBalanceUpdate = (e) => {
      if (e?.detail?.balance !== undefined) {
        setInrBalance(Number(e.detail.balance));
      } else {
        const saved = localStorage.getItem("student_inr_cash") || localStorage.getItem("demo_upi_cash");
        if (saved !== null && saved !== undefined) {
          setInrBalance(Number(saved));
        }
      }
    };
    window.addEventListener("edusphere_balance_updated", handleBalanceUpdate);
    window.addEventListener("storage", handleBalanceUpdate);
    return () => {
      window.removeEventListener("edusphere_balance_updated", handleBalanceUpdate);
      window.removeEventListener("storage", handleBalanceUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = getCookie("user");
        const res = await axios.get(`${API_BASE_URL}/user/demo-upi-balance`, {
          params: { wallet: walletAddress || "" },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const bal = res.data?.inr_balance ?? res.data?.demo_balance ?? 0;
        setInrBalance(bal);
        localStorage.setItem("student_inr_cash", String(bal));
        localStorage.setItem("demo_upi_cash", String(bal));
      } catch (e) {}
    };
    fetchBalance();
  }, [walletAddress]);

  // Add Money Modal State (UPI ID & Card Number, Max ₹500)
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyMethod, setAddMoneyMethod] = useState("upi"); // 'upi' | 'card'
  const [upiIdInput, setUpiIdInput] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");
  const [cardExpiryInput, setCardExpiryInput] = useState("");
  const [cardCvvInput, setCardCvvInput] = useState("");
  const [addAmountInput, setAddAmountInput] = useState("500");
  const [isAddingMoney, setIsAddingMoney] = useState(false);

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

    const activeWallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem("studentWallet") || getCookie("walletAddress") || "";
    const activeName = localStorage.getItem("studentName") || localStorage.getItem("name") || (localStorage.getItem("role") === "student" ? localStorage.getItem("username") : "") || "";

    setIsAddingMoney(true);
    try {
      const token = getCookie("user");
      const methodLabel = addMoneyMethod === "upi" ? `UPI ID (${upiIdInput.trim()})` : `Card (•••• ${cardNumberInput.replace(/\s+/g, "").slice(-4)})`;
      const res = await axios.post(`${API_BASE_URL}/user/demo-upi-add-cash`, {
        amount: amt,
        wallet: activeWallet,
        name: activeName,
        is_educator: false,
        payment_method: methodLabel
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const newBal = res.data?.new_balance ?? (inrBalance + amt);
      setInrBalance(newBal);
      localStorage.setItem("student_inr_cash", String(newBal));
      localStorage.setItem("demo_upi_cash", String(newBal));

      // Record in local transactions & auto-download receipt
      const depNow = Date.now();
      const depIso = new Date(depNow).toISOString();
      const depRecord = {
        _id: res.data?.transaction?._id || `dep_${depNow}`,
        invoice_no: `EDUDEP-${depNow.toString().slice(-6)}`,
        user_name: activeName || "Student",
        student_name: activeName || "Student",
        role: "Student",
        amount: amt,
        currency: "INR",
        payment_method: methodLabel,
        transaction_address: res.data?.transaction?.transaction_address || (addMoneyMethod === "upi" ? upiIdInput.trim() : `Card ending in ${cardNumberInput.replace(/\s+/g, "").slice(-4) || "XXXX"}`),
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
        const existingTxns = JSON.parse(localStorage.getItem("student_transactions") || "[]");
        existingTxns.unshift(depRecord);
        localStorage.setItem("student_transactions", JSON.stringify(existingTxns));
        window.dispatchEvent(new CustomEvent("edusphere_transaction_created", {
          detail: { transaction: depRecord, isEducator: false }
        }));
      } catch (e) {}

      try {
        downloadDepositReceipt(depRecord);
      } catch (dlErr) {
        console.error("Error auto-downloading deposit receipt:", dlErr);
      }

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
    const role = localStorage.getItem("role");
    if (role === "educator") {
      navigate("/educatorhome", { replace: true });
    } else {
      localStorage.setItem("role", "student");
    }
  }, [navigate]);





  return (
    <div
      className={`${isDarkMode
          ? "bg-gradient-to-r from-black to-gray-700 text-gold"
          : "bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900"
        } transition-colors duration-300`}
    >
      {/* Navbar Section */}
      <nav className={`flex justify-between items-center p-5 px-8 ${isDarkMode ? "bg-gray-900/80 border-b border-gray-700/50" : "bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-sm"} sticky top-0 z-40`}>
        <div className="flex items-center space-x-2">

          <img src="/images/Edusphere logo.png" alt="Logo" className="w-12 h-12 rounded-full shadow-lg" />



          <h1 className="text-4xl font-bold ">Edusphere</h1>
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex space-x-8">
            <Link to="/studenthome" className={`group relative text-lg font-medium transition-colors ${isDarkMode ? "hover:text-amber-500" : "text-slate-700 hover:text-amber-600 font-semibold"}`}>
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
            <Link to="/my-test-marks" className={`group relative text-lg font-medium transition-colors ${isDarkMode ? "hover:text-amber-500" : "text-slate-700 hover:text-amber-600 font-semibold"}`}>
              Test Review
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/contest" className={`group relative text-lg font-medium transition-colors ${isDarkMode ? "hover:text-amber-500" : "text-slate-700 hover:text-amber-600 font-semibold"}`}>
              Contest
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          {/* Student Indian Rupee Balance Badge */}
          {walletConnected && (
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold shadow-sm ${
              isDarkMode
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-emerald-50 border-emerald-300 text-emerald-800"
            }`}>
              <span className={`font-mono text-[10px] uppercase tracking-wider ${isDarkMode ? "text-emerald-300/80" : "text-emerald-700"}`}>Online Money Available:</span>
              <span className={`font-black text-sm ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>₹{Number(inrBalance).toLocaleString("en-IN")}</span>
            </div>
          )}

          {/* Wallet Button */}
          <motion.button

            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${walletConnected ?
                'bg-emerald-500/20 text-emerald-400' :
                'bg-amber-500 hover:bg-amber-600 text-white'
              } transition-colors`}
            onClick={walletConnected ? handleWalletClick : ()=>connectWallet(()=>navigate('/signup'))}
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
                  <path d="M10 2a1 1 0 011 1v1.323l3.954.99a1 1 0 01.686.828L15.667 8H17a1 1 0 110 2h-1.333l-.012.082a5 5 0 01-4.245 4.245L11 14.667V17a1 1 0 11-2 0v-2.333l-.082-.012a5 5 0 01-4.245-4.245L4.333 10H3a1 1 0 110-2h1.333l.027-.86a1 1 0 01.686-.827L9 4.323V3a1 1 0 011-1z" />
                </svg>
              </>
            )}

          </motion.button>


          {/* Theme toggle */}
          <button className="dark-mode-toggle text-3xl" onClick={toggleTheme}>
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          {/* 100% Uniform Three Line Menu Component (Student Only) */}
          <ThreeLineMenu isEducator={false} />
        </div>
      </nav>
      <div className={isDarkMode ? "border-b border-gray-700/50" : "border-b border-slate-200/80"}></div>

      {/* Main Content Section */}
      <div className="container mx-auto py-14 px-6 relative">
        <div className="flex justify-between items-center">
          <div className="w-1/2">
            <DotLottieReact
              src="https://lottie.host/b3d4cb2f-dce5-406a-938f-0ed9f0b58974/k1qWoZHhWD.lottie"
              loop
              autoplay
              className="w-full h-[500px] flex justify-center"
            />
          </div>
          <div className="lg:w-1/2 space-y-8 animate-fade-in-up delay-100">
            <h2 className={`text-5xl md:text-6xl font-extrabold leading-tight ${isDarkMode ? "bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent" : "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent"}`}>
              Revolutionizing Education with Blockchain
            </h2>
            <p className={`text-xl leading-relaxed ${isDarkMode ? "text-gray-300" : "text-slate-600 font-normal"}`}>
              Empower your learning journey with decentralized education. Take control of your academic credentials,
              earn rewards for your achievements, and access a world of knowledge powered by Web3 technology.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/courses" className={`${isDarkMode ? "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white shadow-amber-500/30" : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 shadow-amber-500/25"} px-8 py-4 rounded-full text-lg font-bold shadow-lg transition-all duration-300`}>
                Explore Courses
              </Link>
              <Link to="/tests" className={`${isDarkMode ? "bg-amber-500/20 border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black" : "bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-black shadow-md shadow-amber-100"} px-8 py-4 rounded-full text-lg font-bold shadow-lg transition-all duration-300`}>
                Give Tests
              </Link>
              <Link to="/my-test-marks" className={`${isDarkMode ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black" : "bg-white border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-500 hover:text-black shadow-md shadow-emerald-100"} px-8 py-4 rounded-full text-lg font-bold shadow-lg transition-all duration-300`}>
                Test Review
              </Link>
              <Link to="/howitworks" className={`${isDarkMode ? "border-2 border-amber-500 text-amber-500 hover:bg-amber-500/10" : "border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-sm"} px-8 py-4 rounded-full text-lg font-semibold transition-colors duration-300`}>
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className={`py-6 mt-12 ${isDarkMode ? 'bg-gray-900/80 border-t border-gray-800 text-white' : 'bg-white/85 border-t border-slate-200/80 text-slate-600'}`}>
        <div className="flex justify-center items-center space-x-6">
          <button className={`${isDarkMode ? 'text-yellow-500' : 'text-amber-600 font-semibold'} hover:underline`}>About Us</button>
          <span className={isDarkMode ? 'text-yellow-600' : 'text-slate-300'}>|</span>
          <button className={`${isDarkMode ? 'text-yellow-500' : 'text-amber-600 font-semibold'} hover:underline`}>Contact Us</button>
          <span className={isDarkMode ? 'text-yellow-600' : 'text-slate-300'}>|</span>
          <p className={isDarkMode ? 'text-yellow-600' : 'text-slate-500 text-sm'}>© 2025 Edusphere. All Rights Reserved.</p>
        </div>
      </footer>

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
    </div>
  );
};

export default Studenthome;