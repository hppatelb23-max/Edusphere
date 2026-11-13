import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiDollarSign, FiBook, FiGift, FiCopy, FiDownload, FiFileText, FiLogOut, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from "../context/WalletProvider";
import { useThemeStore } from '../store/themeStore';
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL, getCookie } from "../utils/api";

const TransactionPage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { setTheme } = useTheme();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { walletAddress, walletConnected, connectWallet, disconnectWallet } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleWalletClick = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.info("Wallet address copied to clipboard!");
    }
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.info("Wallet address copied to clipboard!");
    }
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

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    setTheme(nextMode ? "dark" : "light");
  };

  const handleDisconnect = () => {
    if (disconnectWallet) {
      disconnectWallet();
    } else {
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletConnected");
    }
    toast.info("Wallet disconnected. Redirecting to home...");
    navigate("/");
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const token = getCookie("user");
        const studentName = localStorage.getItem("username") || localStorage.getItem("studentName") || "";
        const wallet = walletAddress || localStorage.getItem("walletAddress") || "";

        const response = await axios.get(`${API_BASE_URL}/user/transaction-history`, {
          params: {
            wallet: wallet || undefined,
            student_name: studentName || undefined,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.status === 200 && response.data?.transaction_history) {
          const data = response.data.transaction_history.map((txn) => {
            const resolvedStudentName =
              txn.student_name ||
              (txn.user_id && txn.user_id.user_name) ||
              localStorage.getItem("username") ||
              "Student";

            const courseTitle =
              txn.courses_purchased?.title ||
              txn.course_title ||
              "Course";

            const educatorName =
              txn.educator_name ||
              txn.courses_purchased?.author_name ||
              "Educator";

            const amount =
              txn.amount !== undefined && txn.amount !== null
                ? txn.amount
                : (txn.courses_purchased?.course_price || 0);

            const currency = txn.currency || "INR";
            const paymentMethod = txn.payment_method || (currency === "INR" ? "Indian Rupees (₹)" : "MetaMask (ETH)");
            const purchaseDate = txn.purchased_date
              ? new Date(txn.purchased_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
              : (txn.createdAt
                  ? new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : new Date().toLocaleDateString("en-IN"));

            const invoiceNo = `EDUPAY-${String(txn._id || Date.now()).slice(-6).toUpperCase()}`;

            return {
              _id: txn._id,
              student_name: resolvedStudentName,
              course_purchased: courseTitle,
              educator_name: educatorName,
              amount: amount,
              currency: currency,
              payment_method: paymentMethod,
              transaction_address: txn.transaction_address || invoiceNo,
              purchase_date: purchaseDate,
              status: txn.status || "SUCCESS",
              invoice_no: invoiceNo,
              raw: txn
            };
          });
          setTransactions(data);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [walletAddress]);

  // ─── OFFICIAL DOWNLOADABLE TAX INVOICE GENERATOR ────────────────────────────
  const downloadReceipt = (txn) => {
    if (!txn) return;
    const student = txn.student_name || localStorage.getItem("username") || "Student";
    const courseTitle = txn.course_purchased || "Course";
    const educator = txn.educator_name || "Educator";
    const amountStr = txn.currency === "INR" ? `₹${Number(txn.amount).toLocaleString("en-IN")} INR` : `${txn.amount} ETH`;
    const invoiceNo = txn.invoice_no || `EDUPAY-${String(txn._id).slice(-6).toUpperCase()}`;
    const dateStr = txn.purchase_date || new Date().toLocaleDateString("en-IN");
    const paymentMethod = txn.payment_method || "Indian Rupees (₹)";

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Edusphere Tax Invoice - ${invoiceNo}</title>
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
    .footer { text-align: center; border-top: 1px solid #1f2937; padding-top: 20px; font-size: 11px; color: #6b7280; line-height: 1.6; }
    @media print {
      body { background: #ffffff; color: #111827; padding: 0; }
      .receipt-container { border: 1px solid #e5e7eb; background: #ffffff; box-shadow: none; color: #111827; }
      .logo { color: #d97706; }
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
      <div class="badge">Official Course Enrollment Tax Invoice</div>
      <div class="invoice-meta">Invoice No: <strong style="color: #f59e0b;">${invoiceNo}</strong> &bull; Date: ${dateStr}</div>
    </div>
    <div class="banner">
      ✓ Verified & Cryptographically Recorded on Blockchain Ledger
    </div>
    <table class="item-table">
      <tr>
        <td class="label">Student Name</td>
        <td class="val" style="color: #f59e0b; font-size: 14px;">${student}</td>
      </tr>
      <tr>
        <td class="label">Course Title</td>
        <td class="val">${courseTitle}</td>
      </tr>
      <tr>
        <td class="label">Course Educator / Author</td>
        <td class="val">${educator}</td>
      </tr>
      <tr>
        <td class="label">Payment Mode</td>
        <td class="val">${paymentMethod}</td>
      </tr>
      <tr>
        <td class="label">Transaction Reference</td>
        <td class="val" style="font-family: monospace; font-size: 11px; color: #38bdf8;">${txn.transaction_address || invoiceNo}</td>
      </tr>
      <tr>
        <td class="label">Total Amount Paid</td>
        <td class="val highlight">${amountStr}</td>
      </tr>
      <tr>
        <td class="label">Enrollment Status</td>
        <td class="val" style="color: #10b981;">PAID & ALL ACCESS UNLOCKED</td>
      </tr>
    </table>
    <div class="footer">
      This is a digitally generated tax invoice from Edusphere Decentralized Learning Platform.<br />
      Valid for all academic accreditation, student records, and GST compliance.
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
    const win = window.open(url, "_blank");
    if (!win) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `Edusphere_Invoice_${invoiceNo}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div
      className={`${isDarkMode
        ? "bg-gradient-to-r from-black to-gray-900 text-gold"
        : "bg-gradient-to-r from-gray-50 to-white text-black"
        } transition-colors duration-300 min-h-[100vh] flex flex-col`}
    >
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 border-b border-amber-500/20 shadow-sm">
        <div className="flex items-center space-x-2">
          <img src="/images/Edusphere logo.png" alt="Logo" className="w-12 h-12 rounded-full shadow-lg" />
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            Edusphere
          </h1>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-8">
          <div className="hidden md:flex space-x-8">
            <Link to="/studenthome" className="group relative text-base font-medium hover:text-amber-500 transition-colors">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/courses" className="group relative text-base font-medium hover:text-amber-500 transition-colors">
              Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/contest" className="group relative text-base font-medium hover:text-amber-500 transition-colors">
              Contest
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          {/* Wallet Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold ${walletConnected ?
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
              'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
              } transition-colors`}
            onClick={walletConnected ? handleWalletClick : connectWallet}
          >
            {walletConnected ? (
              <>
                <FiCheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connected"}
                </span>
                <FiCopy
                  className="hover:text-amber-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard();
                  }}
                  title="Copy Wallet Address"
                />
              </>
            ) : (
              <>
                <span>Connect Wallet</span>
              </>
            )}
          </motion.button>

          {/* Theme toggle */}
          <button
            className="p-2 text-2xl rounded-full hover:bg-amber-500/10 transition-colors"
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="text-base bg-gradient-to-r from-amber-500 to-amber-300 text-black py-2 px-4 rounded-full font-bold hover:shadow-lg transition-all"
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
                    isDarkMode ? "bg-gray-900/95 border border-gray-700 text-white" : "bg-white/95 border border-amber-100 text-gray-800"
                  } z-50 overflow-hidden`}
                >
                  <div className="p-2 space-y-1">
                    <Link
                      to="/signup"
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-amber-500/10 transition-colors"
                    >
                      <FiUser className="text-amber-500" />
                      <span>Add Details</span>
                    </Link>
                    <Link
                      to="/transactions"
                      className="flex items-center space-x-3 p-3 rounded-xl bg-amber-500/15 text-amber-400 font-semibold transition-colors"
                    >
                      <FiDollarSign className="text-amber-500" />
                      <span>Transactions</span>
                    </Link>
                    <Link
                      to="/mylearning"
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-amber-500/10 transition-colors"
                    >
                      <FiBook className="text-amber-500" />
                      <span>My Learning</span>
                    </Link>
                    <Link
                      to="/redeem"
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-amber-500/10 transition-colors"
                    >
                      <FiGift className="text-amber-500" />
                      <span>Redeem</span>
                    </Link>

                    {/* Disconnect Wallet Button */}
                    <button
                      onClick={handleDisconnect}
                      className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-left font-medium border-t border-gray-700/50 mt-1"
                    >
                      <FiLogOut className="text-red-400" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Transaction History Section */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              Transaction History
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Complete verifiable ledger of your course enrollments and downloadable official tax invoices.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/30">
              {transactions.length} Total {transactions.length === 1 ? "Record" : "Records"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-gray-400 space-y-3">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Loading transaction ledger...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${isDarkMode ? "bg-gray-900/60 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
            <FiFileText className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold mb-1">No Transactions Found</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-5">
              You haven't enrolled in any courses yet. Browse our course catalog and enroll using Indian Rupees (₹) or MetaMask ETH.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              Browse Course Catalog
            </Link>
          </div>
        ) : (
          <div className={`rounded-3xl overflow-hidden border shadow-xl ${
            isDarkMode ? "bg-gray-900/80 border-gray-800" : "bg-white border-gray-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-xs uppercase tracking-wider font-extrabold border-b ${
                    isDarkMode ? "bg-black/60 text-amber-300 border-gray-800" : "bg-amber-50/70 text-amber-900 border-amber-200"
                  }`}>
                    <th className="p-4 sm:p-5">Student Name</th>
                    <th className="p-4 sm:p-5">Course Title</th>
                    <th className="p-4 sm:p-5">Educator</th>
                    <th className="p-4 sm:p-5">Amount Paid</th>
                    <th className="p-4 sm:p-5">Payment Method</th>
                    <th className="p-4 sm:p-5">Date</th>
                    <th className="p-4 sm:p-5 text-center">Official Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-sm">
                  {transactions.map((txn, index) => (
                    <tr
                      key={txn._id || index}
                      className={`transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/5" : "hover:bg-amber-50/50"
                      }`}
                    >
                      {/* Student Name */}
                      <td className="p-4 sm:p-5 font-bold text-amber-400">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                            {txn.student_name ? txn.student_name[0].toUpperCase() : "S"}
                          </div>
                          <span>{txn.student_name}</span>
                        </div>
                      </td>

                      {/* Course Title */}
                      <td className="p-4 sm:p-5 font-semibold text-white max-w-xs truncate">
                        {txn.course_purchased}
                      </td>

                      {/* Educator */}
                      <td className="p-4 sm:p-5 text-gray-300 text-xs">
                        {txn.educator_name}
                      </td>

                      {/* Amount */}
                      <td className="p-4 sm:p-5 font-extrabold text-emerald-400 font-mono">
                        {txn.currency === "INR" ? `₹${Number(txn.amount).toLocaleString("en-IN")}` : `${txn.amount} ETH`}
                      </td>

                      {/* Payment Method */}
                      <td className="p-4 sm:p-5 text-xs text-gray-300">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700 font-medium">
                          {txn.payment_method}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 sm:p-5 text-xs text-gray-400">
                        {txn.purchase_date}
                      </td>

                      {/* Download Receipt Button */}
                      <td className="p-4 sm:p-5 text-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => downloadReceipt(txn)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer"
                          title="Download Official Tax Invoice PDF/HTML"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                          <span>📥 Download Receipt</span>
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionPage;
