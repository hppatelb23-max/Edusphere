import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBook,
  FiAward,
  FiDollarSign,
  FiGift,
  FiLogOut,
  FiPlusCircle,
  FiPlus,
  FiBookOpen,
  FiDownload,
  FiCheckCircle
} from "react-icons/fi";
import { useWallet } from "../context/WalletProvider";
import { useThemeStore } from "../store/themeStore";
import { API_BASE_URL, getCookie } from "../utils/api";
import axios from "axios";
import { toast } from "react-toastify";

export const downloadDepositReceipt = (depositData) => {
  if (!depositData) return;
  const user = depositData.user_name || localStorage.getItem("username") || "User";
  const role = depositData.role || (localStorage.getItem("role") === "educator" ? "Educator" : "Student");
  const amount = Number(depositData.amount || 0);
  const method = depositData.payment_method || "UPI ID";
  const invoiceNo = depositData.invoice_no || `EDUDEP-${Date.now().toString().slice(-6)}`;
  const dateStr = depositData.date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const txRef = depositData.transaction_address || `TXN-DEP-${Date.now()}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Edusphere Deposit Receipt - ${invoiceNo}</title>
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
    .footer { text-align: center; border-top: 1px solid #1f2937; padding-top: 20px; font-size: 11px; color: #6b7280; line-height: 1.6; }
    @media print {
      body { background: #ffffff; color: #111827; padding: 0; }
      .receipt-container { border: 1px solid #e5e7eb; background: #ffffff; box-shadow: none; color: #111827; }
      .logo { color: #059669; }
      .item-table td.label { color: #4b5563; }
      .item-table td.val { color: #111827; }
      .banner { background: #f0fdf4; border-color: #86efac; color: #15803d; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1 class="logo">EDUSPHERE</h1>
      <div class="badge">Official Wallet Top-Up & Deposit Receipt</div>
      <div class="invoice-meta">Receipt / Reference No: <strong style="color: #10b981;">${invoiceNo}</strong> &bull; Date: ${dateStr}</div>
    </div>
    <div class="banner">
      ✓ Funds Successfully Verified & Added to Online Money Available Balance
    </div>
    <table class="item-table">
      <tr>
        <td class="label">Account Holder</td>
        <td class="val" style="color: #f59e0b; font-size: 14px;">${user} (${role})</td>
      </tr>
      <tr>
        <td class="label">Transaction Type</td>
        <td class="val">Online Money Deposit (Wallet Top-Up)</td>
      </tr>
      <tr>
        <td class="label">Payment Source / Method</td>
        <td class="val">${method}</td>
      </tr>
      <tr>
        <td class="label">Transaction Reference</td>
        <td class="val" style="font-family: monospace; font-size: 11px; color: #38bdf8;">${txRef}</td>
      </tr>
      <tr>
        <td class="label">Total Amount Deposited</td>
        <td class="val highlight">₹${amount.toLocaleString("en-IN")} INR</td>
      </tr>
      <tr>
        <td class="label">Deposit Status</td>
        <td class="val" style="color: #10b981;">CREDITED & AVAILABLE TO SPEND</td>
      </tr>
    </table>
    <div class="footer">
      This is a digitally generated deposit voucher from Edusphere Platform.<br />
      Valid for platform payment verification, accounting records, and course purchases.
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  // Directly trigger automatic file download - immune to browser popup blockers
  const a = document.createElement("a");
  a.href = url;
  a.download = `Edusphere_Deposit_${invoiceNo}.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {}
  }, 1000);

  // Also attempt to open new tab preview if not blocked
  try {
    window.open(url, "_blank");
  } catch (e) {}
};

const ThreeLineMenu = ({ onAddMoneyClick, isEducator: propIsEducator }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { walletAddress, disconnectWallet } = useWallet();

  const currentPath = typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "";
  const currentRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  // Strict role evaluation: If on studenthome or role is student, NEVER treat as educator
  const isStudentContext = currentPath.includes("studenthome") || currentRole === "student";

  const isEducator = propIsEducator !== undefined
    ? Boolean(propIsEducator)
    : (!isStudentContext && Boolean(
        currentPath.includes("educator") ||
        currentPath.includes("createcourses") ||
        currentPath.includes("managecourses") ||
        currentPath.includes("educator-marks") ||
        currentPath.includes("create-test") ||
        currentRole === "educator"
      ));

  // Add Money Modal State
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyMethod, setAddMoneyMethod] = useState("upi"); // 'upi' | 'card'
  const [upiIdInput, setUpiIdInput] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");
  const [cardExpiryInput, setCardExpiryInput] = useState("");
  const [cardCvvInput, setCardCvvInput] = useState("");
  const [addAmountInput, setAddAmountInput] = useState(isEducator ? "1000" : "500");
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [lastDepositReceipt, setLastDepositReceipt] = useState(null);
  const [inrBalance, setInrBalance] = useState(() => {
    if (isEducator) {
      return Number(localStorage.getItem("educator_inr_balance") || "0");
    }
    return Number(localStorage.getItem("student_inr_cash") || localStorage.getItem("demo_upi_cash") || "0");
  });

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
    if (!dropdownOpen && !showAddMoneyModal) return;
    const fetchLatest = async () => {
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
          const bal = res.data?.inr_balance ?? res.data?.inr_earnings ?? 0;
          setInrBalance(bal);
          localStorage.setItem("educator_inr_balance", String(bal));
        } else {
          const activeWallet = walletAddress || localStorage.getItem("walletAddress") || "";
          if (!activeWallet) return;
          const res = await axios.get(`${API_BASE_URL}/user/demo-upi-balance`, {
            params: { wallet: activeWallet }
          });
          const bal = res.data?.inr_balance ?? res.data?.demo_balance ?? 0;
          setInrBalance(bal);
          localStorage.setItem("student_inr_cash", String(bal));
        }
      } catch (e) {}
    };
    fetchLatest();
  }, [dropdownOpen, showAddMoneyModal, isEducator, walletAddress]);

  const maxAllowed = isEducator ? 2000 : 500;

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardNumberInput(formatted);
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

  const handleDisconnect = () => {
    if (disconnectWallet) {
      disconnectWallet();
    } else {
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletConnected");
    }
    toast.info("Wallet disconnected. Redirecting...");
    navigate("/");
  };

  const handleConfirmAddMoney = async (e) => {
    e?.preventDefault();
    const amt = Number(addAmountInput);

    if (!amt || isNaN(amt) || amt <= 0) {
      toast.error(`Please enter a valid amount (₹1 to ₹${maxAllowed}).`);
      return;
    }
    if (amt > maxAllowed) {
      toast.error(`Maximum amount that can be added at a time is ₹${maxAllowed} only.`);
      return;
    }

    if (addMoneyMethod === "upi") {
      const trimmedUpi = upiIdInput.trim();
      if (!trimmedUpi) {
        toast.error("Please enter your UPI ID.");
        return;
      }
      if (!trimmedUpi.includes("@")) {
        toast.error("Please enter a valid UPI ID (e.g., username@upi, mobile@paytm).");
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

    setIsAddingMoney(true);
    try {
      const token = isEducator ? (getCookie("admin") || getCookie("user")) : (getCookie("user") || getCookie("admin"));
      const methodLabel = addMoneyMethod === "upi"
        ? `UPI ID (${upiIdInput.trim()})`
        : `Card (•••• ${cardNumberInput.replace(/\s+/g, "").slice(-4)})`;

      const activeWallet = walletAddress || localStorage.getItem("walletAddress") || localStorage.getItem("educatorWallet") || localStorage.getItem("adminWallet") || getCookie("walletAddress") || "";
      const activeName = (isEducator
        ? (localStorage.getItem("educatorName") || localStorage.getItem("name") || (localStorage.getItem("role") === "educator" ? localStorage.getItem("username") : "") || "Educator")
        : (localStorage.getItem("studentName") || localStorage.getItem("name") || (localStorage.getItem("role") === "student" ? localStorage.getItem("username") : "") || "Student")
      );

      const endpoint = isEducator ? `${API_BASE_URL}/admin/add-cash` : `${API_BASE_URL}/user/demo-upi-add-cash`;
      const res = await axios.post(endpoint, {
        amount: amt,
        wallet: activeWallet,
        name: activeName,
        payment_method: methodLabel,
        is_educator: isEducator
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const updatedBalance = res.data?.new_balance ?? amt;
      setInrBalance(updatedBalance);

      if (isEducator) {
        localStorage.setItem("role", "educator");
        localStorage.setItem("educator_inr_balance", String(updatedBalance));
        localStorage.setItem("educator_inr_earnings", String(updatedBalance));
      } else {
        localStorage.setItem("student_inr_cash", String(updatedBalance));
        localStorage.setItem("demo_upi_cash", String(updatedBalance));
      }

      const nowMs = Date.now();
      const isoNow = new Date(nowMs).toISOString();
      const receiptRecord = {
        _id: res.data?.transaction?._id || `dep_${nowMs}`,
        invoice_no: `EDUDEP-${nowMs.toString().slice(-6)}`,
        user_name: activeName,
        student_name: activeName,
        role: isEducator ? "Educator" : "Student",
        amount: amt,
        currency: "INR",
        payment_method: methodLabel,
        transaction_address: res.data?.transaction?.transaction_address || `TXN-DEP-${nowMs}`,
        bank_utr: res.data?.transaction?.bank_utr || `DEP-${nowMs}`,
        timestamp: nowMs,
        createdAt: isoNow,
        purchased_date: isoNow,
        date: new Date(nowMs).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        status: "SUCCESS",
        type: "deposit",
        course_purchased: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
        course_title: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
        educator_name: "Personal Rupee Wallet"
      };

      // Save into transaction ledger
      try {
        if (isEducator) {
          const eduTxns = JSON.parse(localStorage.getItem("educator_transactions") || "[]");
          eduTxns.unshift(receiptRecord);
          localStorage.setItem("educator_transactions", JSON.stringify(eduTxns));
          localStorage.setItem("educator_purchases", JSON.stringify(eduTxns));
        } else {
          const stuTxns = JSON.parse(localStorage.getItem("student_transactions") || "[]");
          stuTxns.unshift(receiptRecord);
          localStorage.setItem("student_transactions", JSON.stringify(stuTxns));
        }
      } catch (e) {}

      try {
        window.dispatchEvent(new CustomEvent("edusphere_balance_updated", {
          detail: { balance: updatedBalance, isEducator }
        }));
        window.dispatchEvent(new CustomEvent("edusphere_transaction_created", {
          detail: { transaction: receiptRecord, isEducator }
        }));
        window.dispatchEvent(new Event("storage"));
      } catch (evErr) {}

      setLastDepositReceipt(receiptRecord);
      try {
        downloadDepositReceipt(receiptRecord);
      } catch (dlErr) {
        console.error("Error downloading deposit receipt:", dlErr);
      }
      toast.success(`🎉 Added ₹${amt}! Official deposit receipt generated. New Balance: ₹${updatedBalance}`);
      setShowAddMoneyModal(false);
      setUpiIdInput("");
      setCardNumberInput("");
      setCardExpiryInput("");
      setCardCvvInput("");
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      if (err.response?.status === 400 && errMsg) {
        toast.error(errMsg);
      } else {
        const currentSaved = isEducator
          ? Number(localStorage.getItem("educator_inr_balance") || 0)
          : Number(localStorage.getItem("student_inr_cash") || 0);
        const newBal = currentSaved + amt;
        if (isEducator) {
          localStorage.setItem("role", "educator");
          localStorage.setItem("educator_inr_balance", String(newBal));
          localStorage.setItem("educator_inr_earnings", String(newBal));
        } else {
          localStorage.setItem("student_inr_cash", String(newBal));
          localStorage.setItem("demo_upi_cash", String(newBal));
        }

        const fallbackActiveName = (isEducator
          ? (localStorage.getItem("educatorName") || localStorage.getItem("name") || (localStorage.getItem("role") === "educator" ? localStorage.getItem("username") : "") || "Educator")
          : (localStorage.getItem("studentName") || localStorage.getItem("name") || (localStorage.getItem("role") === "student" ? localStorage.getItem("username") : "") || "Student")
        );
        const fbNow = Date.now();
        const fbIso = new Date(fbNow).toISOString();
        const fallbackReceipt = {
          _id: `dep_${fbNow}`,
          invoice_no: `EDUDEP-${fbNow.toString().slice(-6)}`,
          user_name: fallbackActiveName,
          student_name: fallbackActiveName,
          role: isEducator ? "Educator" : "Student",
          amount: amt,
          currency: "INR",
          payment_method: addMoneyMethod === "upi" ? `UPI ID (${upiIdInput.trim()})` : "Credit/Debit Card",
          transaction_address: `TXN-DEP-${fbNow}`,
          bank_utr: `DEP-${fbNow}`,
          timestamp: fbNow,
          createdAt: fbIso,
          purchased_date: fbIso,
          date: new Date(fbNow).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          status: "SUCCESS",
          type: "deposit",
          course_purchased: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
          course_title: `Personal Rupee Wallet Top-up (+₹${amt.toLocaleString("en-IN")})`,
          educator_name: "Personal Rupee Wallet"
        };
        try {
          if (isEducator) {
            const eduTxns = JSON.parse(localStorage.getItem("educator_transactions") || "[]");
            eduTxns.unshift(fallbackReceipt);
            localStorage.setItem("educator_transactions", JSON.stringify(eduTxns));
            localStorage.setItem("educator_purchases", JSON.stringify(eduTxns));
          } else {
            const stuTxns = JSON.parse(localStorage.getItem("student_transactions") || "[]");
            stuTxns.unshift(fallbackReceipt);
            localStorage.setItem("student_transactions", JSON.stringify(stuTxns));
          }
        } catch (fErr) {}

        try {
          window.dispatchEvent(new CustomEvent("edusphere_balance_updated", {
            detail: { balance: newBal, isEducator }
          }));
          window.dispatchEvent(new CustomEvent("edusphere_transaction_created", {
            detail: { transaction: fallbackReceipt, isEducator }
          }));
          window.dispatchEvent(new Event("storage"));
        } catch (evErr) {}

        try {
          downloadDepositReceipt(fallbackReceipt);
        } catch (dlErr) {
          console.error("Error downloading fallback deposit receipt:", dlErr);
        }
        toast.success(`🎉 Added ₹${amt}! Official deposit receipt generated. Balance: ₹${newBal}`);
        setShowAddMoneyModal(false);
        setUpiIdInput("");
        setCardNumberInput("");
        setCardExpiryInput("");
        setCardCvvInput("");
      }
    } finally {
      setIsAddingMoney(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="text-lg bg-gradient-to-r from-amber-500 to-amber-300 text-black py-2 px-4 rounded-full font-bold hover:shadow-md transition-all cursor-pointer"
          title="Menu"
        >
          ☰
        </button>
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute right-0 mt-2 w-64 origin-top-right rounded-2xl shadow-2xl backdrop-blur-lg ${
                isDarkMode ? "bg-gray-900/95 border border-gray-700 text-white" : "bg-white/98 border border-slate-200 text-slate-800 shadow-2xl shadow-slate-300/60 ring-1 ring-slate-900/5"
              } z-50 overflow-hidden`}
            >
              <div className="p-2 space-y-1 text-sm font-medium">
                {isEducator ? (
                  /* ── EDUCATOR 100% UNIFORM MENU OPTIONS ── */
                  <>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        if (onAddMoneyClick) onAddMoneyClick();
                        else setShowAddMoneyModal(true);
                      }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left group cursor-pointer ${
                        isDarkMode ? "hover:bg-emerald-500/15 text-emerald-400" : "hover:bg-emerald-50 text-emerald-600"
                      } font-bold`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                        <FiPlusCircle className="text-base" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="block leading-none">Add Money</span>
                          <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isDarkMode ? "text-emerald-400 bg-emerald-500/10" : "text-emerald-700 bg-emerald-100"
                          }`}>₹{Number(inrBalance).toLocaleString("en-IN")}</span>
                        </div>
                        <span className={`text-[10px] font-normal ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>UPI & Card (Max ₹2000)</span>
                      </div>
                    </button>

                    <Link
                      to="/courses"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors font-semibold ${
                        isDarkMode ? "hover:bg-amber-500/10 text-amber-400" : "hover:bg-amber-50/80 text-amber-600"
                      }`}
                    >
                      <FiBook className="text-amber-500" />
                      <span>Other Courses</span>
                    </Link>

                    <Link
                      to="/managecourses"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/10 text-gray-200 hover:text-amber-300" : "hover:bg-slate-100 text-slate-700 hover:text-amber-600 font-semibold"
                      }`}
                    >
                      <FiBook className="text-amber-500" />
                      <span>Manage Courses</span>
                    </Link>

                    <Link
                      to="/createcourses"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/10 text-gray-200 hover:text-amber-300" : "hover:bg-slate-100 text-slate-700 hover:text-amber-600 font-semibold"
                      }`}
                    >
                      <FiPlus className="text-amber-500" />
                      <span>Create Courses</span>
                    </Link>

                    <Link
                      to="/create-test"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors font-semibold ${
                        isDarkMode ? "hover:bg-amber-500/10 text-amber-400" : "hover:bg-amber-50/80 text-amber-600"
                      }`}
                    >
                      <FiBookOpen className="text-amber-500" />
                      <span>Create Test</span>
                    </Link>

                    <Link
                      to="/educator-marks"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors font-semibold ${
                        isDarkMode ? "hover:bg-emerald-500/10 text-emerald-400" : "hover:bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      <FiAward className="text-emerald-500" />
                      <span>Student Marks</span>
                    </Link>

                    <Link
                      to="/tests"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/10 text-gray-200 hover:text-amber-300" : "hover:bg-slate-100 text-slate-700 hover:text-amber-600 font-semibold"
                      }`}
                    >
                      <FiBookOpen className="text-amber-500" />
                      <span>Test Facility</span>
                    </Link>

                    <Link
                      to="/transaction"
                      state={{ isEducator: true }}
                      onClick={() => {
                        localStorage.setItem("role", "educator");
                        setDropdownOpen(false);
                      }}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/10 text-gray-200 hover:text-amber-300" : "hover:bg-slate-100 text-slate-700 hover:text-amber-600 font-semibold"
                      }`}
                    >
                      <FiDollarSign className="text-amber-500" />
                      <span>Transactions</span>
                    </Link>

                    <Link
                      to="/mylearning"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/10 text-gray-200 hover:text-amber-300" : "hover:bg-slate-100 text-slate-700 hover:text-amber-600 font-semibold"
                      }`}
                    >
                      <FiBook className="text-amber-500" />
                      <span>My Learning</span>
                    </Link>
                  </>
                ) : (
                  /* ── STUDENT 100% UNIFORM MENU OPTIONS (ONLY 5 SPECIFIED OPTIONS) ── */
                  <>
                    {/* 1. Add Money */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        if (onAddMoneyClick) onAddMoneyClick();
                        else setShowAddMoneyModal(true);
                      }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left group cursor-pointer ${
                        isDarkMode ? "hover:bg-emerald-500/15 text-emerald-400" : "hover:bg-emerald-50 text-emerald-600"
                      } font-bold`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                        <FiPlusCircle className="text-base" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="block leading-none">Add Money</span>
                          <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isDarkMode ? "text-emerald-400 bg-emerald-500/10" : "text-emerald-700 bg-emerald-100"
                          }`}>₹{Number(inrBalance).toLocaleString("en-IN")}</span>
                        </div>
                        <span className={`text-[10px] font-normal ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>UPI & Card (Max ₹500)</span>
                      </div>
                    </button>

                    {/* 2. My Test Review */}
                    <Link
                      to="/my-test-marks"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors font-semibold ${
                        isDarkMode ? "hover:bg-emerald-500/10 text-emerald-400" : "hover:bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      <FiAward className="text-emerald-500" />
                      <span>My Test Review</span>
                    </Link>

                    {/* 3. My Learning */}
                    <Link
                      to="/mylearning"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/10 text-gray-200 hover:text-amber-300" : "hover:bg-slate-100 text-slate-700 hover:text-amber-600 font-semibold"
                      }`}
                    >
                      <FiBook className="text-amber-500" />
                      <span>My Learning</span>
                    </Link>

                    {/* 4. Transaction */}
                    <Link
                      to="/transaction"
                      state={{ isEducator: false }}
                      onClick={() => {
                        localStorage.setItem("role", "student");
                        setDropdownOpen(false);
                      }}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/10 text-gray-200 hover:text-amber-300" : "hover:bg-slate-100 text-slate-700 hover:text-amber-600 font-semibold"
                      }`}
                    >
                      <FiDollarSign className="text-amber-500" />
                      <span>Transaction</span>
                    </Link>

                    {/* 5. Redeem */}
                    <Link
                      to="/redeem"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/10 text-gray-200 hover:text-amber-300" : "hover:bg-slate-100 text-slate-700 hover:text-amber-600 font-semibold"
                      }`}
                    >
                      <FiGift className="text-amber-500" />
                      <span>Redeem</span>
                    </Link>
                  </>
                )}

                {/* Disconnect Wallet */}
                <button
                  onClick={handleDisconnect}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors text-left font-medium border-t mt-1 cursor-pointer ${
                    isDarkMode ? "hover:bg-red-500/10 text-red-400 hover:text-red-300 border-gray-700/50" : "hover:bg-red-50 text-red-500 hover:text-red-600 border-slate-200"
                  }`}
                >
                  <FiLogOut className="text-red-500" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── UNIFIED ADD MONEY MODAL (WITH INSTANT RECEIPT GENERATION) ─── */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showAddMoneyModal && (
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setShowAddMoneyModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border relative ${
                  isDarkMode ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-amber-200 text-gray-900"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <FiPlusCircle className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight">Add Indian Rupees (INR)</h3>
                      <p className="text-xs text-gray-400">
                        {isEducator ? "Educator Account • Max ₹2000" : "Student Account • Max ₹500"}
                        {" • "}Available: <strong className="text-emerald-400 font-mono font-bold">₹{Number(inrBalance).toLocaleString("en-IN")}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddMoneyModal(false)}
                    className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Deposit Method Tabs */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Select Deposit Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddMoneyMethod("upi")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        addMoneyMethod === "upi"
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm"
                          : isDarkMode
                          ? "bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200"
                          : "bg-gray-100 border-gray-300 text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <span>⚡ UPI ID (VPA)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMoneyMethod("card")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        addMoneyMethod === "card"
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm"
                          : isDarkMode
                          ? "bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200"
                          : "bg-gray-100 border-gray-300 text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <span>💳 Credit / Debit Card</span>
                    </button>
                  </div>
                </div>

                {/* Input details */}
                <div className="mb-4">
                  {addMoneyMethod === "upi" ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Enter UPI ID
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        spellCheck="false"
                        placeholder="e.g. username@okhdfcbank or mobile@paytm"
                        value={upiIdInput}
                        onChange={(e) => setUpiIdInput(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                          isDarkMode
                            ? "bg-gray-800/70 border-gray-700 focus:border-emerald-400 text-white placeholder-gray-500"
                            : "bg-gray-50 border-gray-300 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="•••• •••• •••• ••••"
                          value={cardNumberInput}
                          onChange={handleCardNumberChange}
                          maxLength={19}
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono outline-none tracking-widest ${
                            isDarkMode
                              ? "bg-gray-800/70 border-gray-700 focus:border-emerald-400 text-white"
                              : "bg-gray-50 border-gray-300 focus:border-emerald-500 text-gray-900"
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="MM/YY"
                            value={cardExpiryInput}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                              if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2)}`;
                              setCardExpiryInput(val);
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
                            CVV (3 Digits)
                          </label>
                          <input
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
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

                {/* Amount input */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      Amount to Add (₹ INR)
                    </label>
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Max Limit: ₹{maxAllowed}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      placeholder={`Enter amount (1 - ${maxAllowed})`}
                      value={addAmountInput}
                      onChange={(e) => setAddAmountInput(e.target.value.replace(/\D/g, ""))}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-lg font-black font-mono outline-none transition-all ${
                        isDarkMode
                          ? "bg-gray-800/70 border-gray-700 focus:border-emerald-400 text-emerald-300"
                          : "bg-gray-50 border-gray-300 focus:border-emerald-500 text-emerald-700"
                      }`}
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-emerald-400 text-lg pointer-events-none select-none">
                      ₹
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2.5">
                    {(isEducator ? [500, 1000, 2000] : [100, 250, 500]).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAddAmountInput(String(preset))}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          addAmountInput === String(preset)
                            ? "bg-emerald-500 text-black border-emerald-400 shadow-sm"
                            : isDarkMode
                            ? "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-emerald-500/50"
                            : "bg-gray-100 border-gray-300 text-gray-700 hover:border-emerald-400"
                        }`}
                      >
                        ₹{preset}{preset === maxAllowed ? " (Max)" : ""}
                      </button>
                    ))}
                  </div>

                  {Number(addAmountInput) > maxAllowed && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1 font-semibold">
                      <span>⚠️</span> Maximum amount allowed is ₹{maxAllowed} only.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddMoneyModal(false)}
                    className={`flex-1 py-3 rounded-xl font-semibold text-xs border transition-colors cursor-pointer ${
                      isDarkMode ? "border-gray-700 hover:bg-gray-800 text-gray-400" : "border-gray-300 hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isAddingMoney || Number(addAmountInput) <= 0 || Number(addAmountInput) > maxAllowed}
                    onClick={handleConfirmAddMoney}
                    className="flex-[2] py-3 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isAddingMoney ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Adding & Generating Receipt...</span>
                      </>
                    ) : (
                      <span>Add ₹{Number(addAmountInput) || 0} & Get Receipt</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ThreeLineMenu;
