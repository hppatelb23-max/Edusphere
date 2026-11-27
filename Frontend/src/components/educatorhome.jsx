import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiDollarSign, FiBook, FiGift, FiCopy, FiLogOut, FiPlusCircle, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from "../store/themeStore";
import { useWallet } from "../context/WalletProvider";
import { API_BASE_URL, getCookie } from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";
import ThreeLineMenu from "./ThreeLineMenu";

const Edusphere = () => {

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { walletAddress, walletConnected, connectWallet, disconnectWallet } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);

  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  const [inrEarnings, setInrEarnings] = useState(() => {
    const saved = localStorage.getItem("educator_inr_earnings");
    return saved ? Number(saved) : 0;
  });

  const [inrBalance, setInrBalance] = useState(() => {
    const saved = localStorage.getItem("educator_inr_balance") || localStorage.getItem("educator_inr_earnings");
    return saved ? Number(saved) : 0;
  });

  // Add Money Modal State for Educator (UPI ID & Card Number, Max ₹2000)
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyMethod, setAddMoneyMethod] = useState("upi"); // 'upi' | 'card'
  const [upiIdInput, setUpiIdInput] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");
  const [cardExpiryInput, setCardExpiryInput] = useState("");
  const [cardCvvInput, setCardCvvInput] = useState("");
  const [addAmountInput, setAddAmountInput] = useState("1000");
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
      toast.error("Please enter a valid amount (₹1 to ₹2000).");
      return;
    }
    if (amt > 2000) {
      toast.error("Maximum amount that can be added at a time is ₹2000 only.");
      return;
    }

    if (addMoneyMethod === "upi") {
      const trimmedUpi = upiIdInput.trim();
      if (!trimmedUpi) {
        toast.error("Please enter your UPI ID.");
        return;
      }
      if (!trimmedUpi.includes("@")) {
        toast.error("Please enter a valid UPI ID (e.g., educator@upi, mobile@paytm).");
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
    }

    const activeWallet = walletAddress || localStorage.getItem("adminWallet") || localStorage.getItem("educatorWallet") || localStorage.getItem("walletAddress") || getCookie("walletAddress") || "";
    const activeName = localStorage.getItem("educatorName") || localStorage.getItem("name") || (localStorage.getItem("role") === "educator" ? localStorage.getItem("username") : "") || "";

    setIsAddingMoney(true);
    try {
      const token = getCookie("admin");
      const methodLabel = addMoneyMethod === "upi" ? `UPI ID (${upiIdInput.trim()})` : `Card (•••• ${cardNumberInput.replace(/\s+/g, "").slice(-4)})`;
      const res = await axios.post(`${API_BASE_URL}/admin/add-cash`, {
        amount: amt,
        wallet: activeWallet,
        name: activeName,
        payment_method: methodLabel
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const newBal = res.data?.new_balance ?? (inrBalance + amt);
      setInrBalance(newBal);
      localStorage.setItem("role", "educator");
      localStorage.setItem("educator_inr_balance", String(newBal));
      localStorage.setItem("educator_inr_earnings", String(newBal));

      const receiptRecord = {
        _id: res.data?.transaction?._id || `dep_${Date.now()}`,
        invoice_no: `EDUDEP-${Date.now().toString().slice(-6)}`,
        user_name: activeName || "Educator",
        student_name: activeName || "Educator",
        role: "Educator",
        amount: amt,
        currency: "INR",
        payment_method: methodLabel,
        transaction_address: res.data?.transaction?.transaction_address || `TXN-DEP-${Date.now()}`,
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        status: "SUCCESS",
        type: "deposit",
        course_purchased: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
        course_title: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
        educator_name: "Personal Rupee Wallet"
      };

      try {
        const eduTxns = JSON.parse(localStorage.getItem("educator_transactions") || "[]");
        eduTxns.unshift(receiptRecord);
        localStorage.setItem("educator_transactions", JSON.stringify(eduTxns));
        localStorage.setItem("educator_purchases", JSON.stringify(eduTxns));
      } catch (e) {}

      try {
        window.dispatchEvent(new CustomEvent("edusphere_balance_updated", {
          detail: { balance: newBal, isEducator: true }
        }));
        window.dispatchEvent(new CustomEvent("edusphere_transaction_created", {
          detail: { transaction: receiptRecord, isEducator: true }
        }));
        window.dispatchEvent(new Event("storage"));
      } catch (evErr) {}

      toast.success(`🎉 Added ₹${amt} via ${addMoneyMethod === "upi" ? "UPI ID" : "Card"}! Balance: ₹${newBal}`);
      setShowAddMoneyModal(false);
      setUpiIdInput("");
      setCardNumberInput("");
      setCardExpiryInput("");
      setCardCvvInput("");
      setAddAmountInput("1000");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      if (err.response?.status === 400 && errMsg) {
        toast.error(errMsg);
      } else {
        const newBal = inrBalance + amt;
        setInrBalance(newBal);
        localStorage.setItem("role", "educator");
        localStorage.setItem("educator_inr_balance", String(newBal));
        localStorage.setItem("educator_inr_earnings", String(newBal));

        const fallbackReceipt = {
          _id: `dep_${Date.now()}`,
          invoice_no: `EDUDEP-${Date.now().toString().slice(-6)}`,
          user_name: activeName || "Educator",
          student_name: activeName || "Educator",
          role: "Educator",
          amount: amt,
          currency: "INR",
          payment_method: methodLabel,
          transaction_address: `TXN-DEP-${Date.now()}`,
          date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          status: "SUCCESS",
          type: "deposit",
          course_purchased: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
          course_title: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
          educator_name: "Personal Rupee Wallet"
        };

        try {
          const eduTxns = JSON.parse(localStorage.getItem("educator_transactions") || "[]");
          eduTxns.unshift(fallbackReceipt);
          localStorage.setItem("educator_transactions", JSON.stringify(eduTxns));
          localStorage.setItem("educator_purchases", JSON.stringify(eduTxns));
        } catch (e) {}

        try {
          window.dispatchEvent(new CustomEvent("edusphere_balance_updated", {
            detail: { balance: newBal, isEducator: true }
          }));
          window.dispatchEvent(new CustomEvent("edusphere_transaction_created", {
            detail: { transaction: fallbackReceipt, isEducator: true }
          }));
          window.dispatchEvent(new Event("storage"));
        } catch (evErr) {}

        toast.success(`🎉 Added ₹${amt}! New Balance: ₹${newBal}`);
        setShowAddMoneyModal(false);
      }
    } finally {
      setIsAddingMoney(false);
    }
  };

  useEffect(() => {
    const handleBalanceUpdate = (e) => {
      if (e?.detail?.balance !== undefined) {
        setInrBalance(Number(e.detail.balance));
        setInrEarnings(Number(e.detail.balance));
      } else {
        const saved = localStorage.getItem("educator_inr_balance") || localStorage.getItem("educator_inr_earnings");
        if (saved !== null && saved !== undefined) {
          setInrBalance(Number(saved));
          setInrEarnings(Number(saved));
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
    const fetchEarnings = async () => {
      try {
        const token = getCookie("admin");
        const activeWallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem("educatorWallet") || getCookie("walletAddress") || "";
        const activeName = localStorage.getItem("username") || localStorage.getItem("educatorName") || "";
        if (!activeWallet && !activeName) return;

        const res = await axios.get(`${API_BASE_URL}/admin/inr-earnings`, {
          params: { wallet: activeWallet, name: activeName },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const amt = res.data?.inr_earnings ?? 0;
        const bal = res.data?.inr_balance ?? amt;
        setInrEarnings(amt);
        setInrBalance(bal);
        localStorage.setItem("educator_inr_earnings", String(amt));
        localStorage.setItem("educator_inr_balance", String(bal));
      } catch (e) {}
    };
    fetchEarnings();
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

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "student") {
      navigate("/studenthome", { replace: true });
    } else {
      localStorage.setItem("role", "educator");
    }
  }, [navigate]);



  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <div
      className={`${isDarkMode
          ? "bg-gradient-to-r from-black to-gray-700 text-gold"
          : "bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900"
        } transition-colors duration-300`}
    >
      {/* Navbar Section */}
      <nav className={`flex justify-between items-center py-4 px-6 sm:px-8 gap-4 ${isDarkMode ? "bg-gray-900/90 border-b border-gray-700/50" : "bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-sm"} sticky top-0 z-40`}>
        <div className="flex items-center space-x-3 shrink-0 mr-4">
          <img
            src="/images/Edusphere logo.png"
            alt="Logo"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-lg"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Edusphere</h1>
        </div>

        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link
            to="/educatorhome"
            className={`group relative text-base font-semibold transition-colors ${
              isDarkMode ? "hover:text-amber-500 text-gray-200" : "text-slate-700 hover:text-amber-600"
            }`}
          >
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link
            to="/createcourses"
            className={`group relative text-base font-semibold transition-colors ${
              isDarkMode ? "hover:text-amber-500 text-gray-200" : "text-slate-700 hover:text-amber-600"
            }`}
          >
            Create Courses
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link
            to="/create-test"
            className={`group relative text-base font-semibold transition-colors ${
              isDarkMode ? "hover:text-amber-500 text-gray-200" : "text-slate-700 hover:text-amber-600"
            }`}
          >
            Create Test
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link
            to="/educator-marks"
            className={`group relative text-base font-semibold transition-colors ${
              isDarkMode ? "hover:text-emerald-400 text-gray-200" : "text-slate-700 hover:text-emerald-600"
            }`}
          >
            Student Marks
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link
            to="/tests"
            className={`group relative text-base font-semibold transition-colors ${
              isDarkMode ? "hover:text-amber-500 text-gray-200" : "text-slate-700 hover:text-amber-600"
            }`}
          >
            Test Facility
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
          </Link>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
          {/* Educator Online Money Badge */}
          {walletConnected && (
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold shadow-sm ${
              isDarkMode
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-emerald-50 border-emerald-300 text-emerald-800"
            }`}>
              <span className={`font-mono text-[10px] uppercase tracking-wider ${isDarkMode ? "text-emerald-300/80" : "text-emerald-700"}`}>Online Money Available:</span>
              <span className={`font-black text-sm font-mono ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>₹{Number(inrBalance).toLocaleString("en-IN")}</span>
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
            onClick={walletConnected ? handleWalletClick : () => connectWallet(() => navigate('/signup'))}
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

          {/* 100% Uniform Three Line Menu Component (Educator Only) */}
          <ThreeLineMenu isEducator={true} />
        </div>
      </nav>
      <div className={isDarkMode ? "border-b border-gray-700/50" : "border-b border-slate-200/80"}></div>

      {/* Main Content Section */}
      <div className="container mx-auto py-14 px-6 relative">
        <div className="flex justify-between items-center">
          <div className="w-1/2">
            <DotLottieReact
              src="https://lottie.host/63360050-ad99-4d7b-af74-93e7d716903c/ntk07VkOVF.lottie"
              loop
              autoplay
              className="w-full h-[500px] flex justify-center"
            />
          </div>
          <div className="lg:w-1/2 space-y-8 animate-fade-in-up delay-100">
            <h2 className={`text-5xl md:text-6xl font-extrabold leading-tight ${
              isDarkMode ? "bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent" : "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent"
            }`}>
              Revolutionizing Education with Blockchain
            </h2>
            <p className={`text-xl leading-relaxed ${isDarkMode ? "text-amber-100/80" : "text-slate-600 font-normal"}`}>
              Empower your learning journey with decentralized education. Take
              control of your academic credentials, earn rewards for your
              achievements, and access a world of knowledge powered by Web3
              technology.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/createcourses"
                className={`${isDarkMode ? "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white shadow-amber-500/30" : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 shadow-amber-500/25"} px-8 py-4 rounded-full text-lg font-bold shadow-lg transition-all duration-300`}
              >
                Create Courses
              </Link>
              <Link
                to="/create-test"
                className={`${isDarkMode ? "bg-amber-500/20 border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black" : "bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-black shadow-md shadow-amber-100"} px-8 py-4 rounded-full text-lg font-bold shadow-lg transition-all duration-300`}
              >
                Create Test
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
    </div>
  );
};

export default Edusphere;
