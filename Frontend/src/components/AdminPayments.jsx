import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiUser,
  FiBook,
  FiDollarSign,
  FiCopy,
  FiFilter,
  FiAlertTriangle,
  FiShield,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../context/WalletProvider";
import { useThemeStore } from "../store/themeStore";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL, getCookie } from "../utils/api";

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", icon: FiClock },
  SUCCESS: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", icon: FiCheckCircle },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", icon: FiXCircle },
};

const AdminPayments = () => {
  const navigate = useNavigate();
  const { walletAddress } = useWallet();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { setTheme } = useTheme();
  const dropdownRef = useRef(null);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState(null); // txn._id being processed
  const [rejectModal, setRejectModal] = useState(null); // txn to reject
  const [rejectReason, setRejectReason] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const rawToken = getCookie("admin") || getCookie("user");
      const token = (rawToken && rawToken !== "undefined" && rawToken !== "null") ? rawToken : null;
      const headers = {
        "Accept": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      if (walletAddress) {
        headers["x-wallet-address"] = walletAddress;
      }

      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/admin/payments`, {
          params: { status: filterStatus, wallet: walletAddress || "" },
          headers
        });
      } catch (adminErr) {
        // Fallback to user payments endpoint
        res = await axios.get(`${API_BASE_URL}/user/payments`, {
          params: { status: filterStatus, wallet: walletAddress || "" },
          headers
        });
      }
      setPayments(res.data?.payments || []);
    } catch (err) {
      console.warn("Fetch payments error:", err);
      const errMsg = err.response?.data?.error || err.message || "Failed to fetch payments.";
      toast.error(errMsg);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const handleApprove = async (txn) => {
    if (!window.confirm(`Approve ₹${txn.amount} payment from "${txn.student_name}" for "${txn.courses_purchased?.title || "Course"}"?\n\nThis will enroll the student immediately.`)) return;
    setActionLoading(txn._id);
    try {
      const rawToken = getCookie("admin") || getCookie("user");
      const token = (rawToken && rawToken !== "undefined" && rawToken !== "null") ? rawToken : null;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      if (walletAddress) headers["x-wallet-address"] = walletAddress;

      try {
        await axios.post(`${API_BASE_URL}/admin/payments/approve`, { transaction_id: txn._id }, { headers });
      } catch (err1) {
        await axios.post(`${API_BASE_URL}/user/payments/approve`, { transaction_id: txn._id }, { headers });
      }
      toast.success(`✅ Payment approved! "${txn.student_name}" is now enrolled.`);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve payment.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal._id);
    try {
      const rawToken = getCookie("admin") || getCookie("user");
      const token = (rawToken && rawToken !== "undefined" && rawToken !== "null") ? rawToken : null;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      if (walletAddress) headers["x-wallet-address"] = walletAddress;

      try {
        await axios.post(`${API_BASE_URL}/admin/payments/reject`, {
          transaction_id: rejectModal._id,
          reason: rejectReason || "Payment rejected by admin."
        }, { headers });
      } catch (err1) {
        await axios.post(`${API_BASE_URL}/user/payments/reject`, {
          transaction_id: rejectModal._id,
          reason: rejectReason || "Payment rejected by admin."
        }, { headers });
      }
      toast.info(`Payment from "${rejectModal.student_name}" has been rejected.`);
      setRejectModal(null);
      setRejectReason("");
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reject payment.");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-950 text-white" : "bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900"}`}>
      {/* Navbar */}
      <nav className={`flex justify-between items-center p-5 px-8 ${isDarkMode ? "bg-gray-900/80 border-b border-gray-700/50" : "bg-white/90 backdrop-blur-sm border-b border-amber-200/70 shadow-sm"} sticky top-0 z-40`}>
        <div className="flex items-center space-x-3">
          <img src="/images/Edusphere logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
          <h1 className="text-2xl font-bold">Edusphere</h1>
          <span className="ml-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Admin Panel</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/educatorhome" className="text-sm font-medium hover:text-amber-500 transition-colors">Home</Link>
          <Link to="/managecourses" className="text-sm font-medium hover:text-amber-500 transition-colors">Manage Courses</Link>
          <button
            onClick={toggleTheme}
            className="text-2xl p-2 rounded-full bg-opacity-20 backdrop-blur-sm"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <FiShield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black">UPI Payment Management</h2>
              <p className="text-sm text-gray-400">Review and approve student UPI payment submissions</p>
            </div>
          </div>
          {pendingCount > 0 && filterStatus === "PENDING" && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-bold">
              <FiAlertTriangle className="w-4 h-4" />
              {pendingCount} payment{pendingCount > 1 ? "s" : ""} awaiting verification
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["PENDING", "SUCCESS", "REJECTED", "ALL"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterStatus === s
                  ? s === "PENDING" ? "bg-amber-500 text-black shadow-lg"
                    : s === "SUCCESS" ? "bg-emerald-500 text-black shadow-lg"
                    : s === "REJECTED" ? "bg-red-500 text-white shadow-lg"
                    : "bg-blue-500 text-white shadow-lg"
                  : isDarkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "PENDING" ? "⏳ Pending" : s === "SUCCESS" ? "✅ Approved" : s === "REJECTED" ? "❌ Rejected" : "📋 All"}
            </button>
          ))}
          <button
            onClick={fetchPayments}
            className={`ml-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Instructions Card */}
        {filterStatus === "PENDING" && !loading && (
          <div className={`p-4 rounded-2xl border mb-6 ${isDarkMode ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
            <p className="text-sm font-bold text-blue-400 mb-1">📌 How to verify payments:</p>
            <ol className="text-xs text-blue-300 space-y-1 list-decimal list-inside">
              <li>Open your UPI account (GPay / PhonePe / Paytm) and check your transaction history.</li>
              <li>Confirm the amount, student's UPI Transaction ID (UTR), and course match.</li>
              <li>Click <strong>Approve</strong> to enroll the student, or <strong>Reject</strong> if the payment is invalid.</li>
            </ol>
          </div>
        )}

        {/* Payments Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl border ${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"}`}>
            <FiClock className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold mb-1">No {filterStatus === "ALL" ? "" : filterStatus.toLowerCase()} payments found</h3>
            <p className="text-xs text-gray-400">
              {filterStatus === "PENDING" ? "No students have submitted UPI payments yet." : "No records match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((txn) => {
              const statusCfg = STATUS_CONFIG[txn.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusCfg.icon;
              const isProcessing = actionLoading === txn._id;

              return (
                <motion.div
                  key={txn._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start ${statusCfg.bg} ${statusCfg.color} flex-shrink-0`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </div>

                    {/* Payment Details */}
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {/* Student */}
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Student</span>
                          <div className="flex items-center gap-1.5">
                            <FiUser className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="font-bold truncate">{txn.student_name || "Unknown"}</span>
                          </div>
                          {txn.student_wallet && (
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">
                              {txn.student_wallet.slice(0, 10)}...{txn.student_wallet.slice(-6)}
                            </p>
                          )}
                        </div>

                        {/* Course */}
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Course</span>
                          <div className="flex items-center gap-1.5">
                            <FiBook className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <span className="font-bold text-amber-400 truncate">{txn.courses_purchased?.title || "Unknown Course"}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Amount Claimed</span>
                          <div className="flex items-center gap-1.5">
                            <FiDollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span className="font-black text-emerald-400 text-base">₹{txn.amount}</span>
                            <span className="text-xs text-gray-400">INR</span>
                          </div>
                        </div>

                        {/* UTR */}
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">UPI Transaction ID / UTR</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-cyan-300 bg-black/30 px-2 py-1 rounded border border-cyan-500/20">{txn.bank_utr || txn.transaction_address || "N/A"}</span>
                            {(txn.bank_utr || txn.transaction_address) && (
                              <button
                                onClick={() => { navigator.clipboard.writeText(txn.bank_utr || txn.transaction_address); toast.info("UTR copied!"); }}
                                className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                              >
                                <FiCopy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Date */}
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Submitted At</span>
                          <span className="text-xs text-gray-300">
                            {txn.purchased_date ? new Date(txn.purchased_date).toLocaleString() : new Date(txn.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Error / Reject reason */}
                        {txn.status === "REJECTED" && txn.error_message && (
                          <div className="sm:col-span-2 lg:col-span-3">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Rejection Reason</span>
                            <span className="text-xs text-red-400">{txn.error_message}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {txn.status === "PENDING" && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(txn)}
                          disabled={isProcessing}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                          {isProcessing ? (
                            <div className="w-3.5 h-3.5 border-2 border-black/50 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiCheckCircle className="w-3.5 h-3.5" />
                          )}
                          Approve & Enroll
                        </button>
                        <button
                          onClick={() => { setRejectModal(txn); setRejectReason(""); }}
                          disabled={isProcessing}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500 border border-red-500/40 text-red-400 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
                        >
                          <FiXCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full rounded-3xl p-6 bg-gray-900 border border-red-500/40 text-white shadow-2xl"
            >
              <h3 className="text-lg font-black mb-1 text-red-400">Reject Payment</h3>
              <p className="text-xs text-gray-400 mb-4">
                Rejecting payment from <strong className="text-white">{rejectModal.student_name}</strong> for{" "}
                <strong className="text-amber-400">{rejectModal.courses_purchased?.title}</strong>
                <span className="block mt-1">UTR: <span className="font-mono text-cyan-300">{rejectModal.bank_utr || rejectModal.transaction_address}</span></span>
              </p>
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-300 block mb-1.5">Reason for rejection (optional):</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Payment not found in bank account, wrong amount, etc."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-gray-700 focus:border-red-400 text-white text-sm placeholder-gray-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(""); }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === rejectModal._id}
                  className="flex-[2] py-3 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                >
                  <FiXCircle className="w-4 h-4" />
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayments;

