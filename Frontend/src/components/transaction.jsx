import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiUser, FiDollarSign, FiBook, FiGift, FiCopy, FiDownload, FiFileText, FiLogOut, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from "../context/WalletProvider";
import { useThemeStore } from '../store/themeStore';
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL, getCookie } from "../utils/api";
import ThreeLineMenu, { downloadDepositReceipt } from "./ThreeLineMenu";

const TransactionPage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { setTheme } = useTheme();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { walletAddress, walletConnected, connectWallet, disconnectWallet } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [educatorTransactions, setEducatorTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const currentRole = localStorage.getItem("role");
  const isEducator = Boolean(
    location.state?.isEducator !== undefined
      ? location.state.isEducator
      : (
          currentRole === "educator" ||
          (currentRole !== "student" && (
            Boolean(getCookie("admin")) ||
            Boolean(localStorage.getItem("educatorName")) ||
            Boolean(localStorage.getItem("adminWallet")) ||
            Boolean(localStorage.getItem("educatorWallet"))
          ))
        )
  );

  useEffect(() => {
    if (isEducator && currentRole !== "student") {
      localStorage.setItem("role", "educator");
    }
  }, [isEducator, currentRole]);

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
        const token = isEducator ? (getCookie("admin") || getCookie("user")) : (getCookie("user") || getCookie("admin"));
        const activeName = isEducator
          ? (localStorage.getItem("educatorName") || (localStorage.getItem("role") === "educator" ? localStorage.getItem("username") : "") || localStorage.getItem("name") || "")
          : (localStorage.getItem("studentName") || (localStorage.getItem("role") === "student" ? localStorage.getItem("username") : "") || localStorage.getItem("name") || "");
        const wallet = walletAddress || localStorage.getItem("walletAddress") || (isEducator ? (localStorage.getItem("adminWallet") || localStorage.getItem("educatorWallet")) : localStorage.getItem("studentWallet")) || "";

        const formatDateTime = (raw) => {
          if (!raw) {
            const now = new Date();
            return {
              date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
              full: now.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
            };
          }
          const d = new Date(raw);
          if (isNaN(d.getTime())) {
            return { date: String(raw), time: "", full: String(raw) };
          }
          return {
            date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
            full: d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
          };
        };

        const getTimestamp = (item) => {
          if (!item) return 0;
          if (typeof item.timestamp === "number" && item.timestamp > 0) return item.timestamp;
          if (typeof item.raw?.timestamp === "number" && item.raw.timestamp > 0) return item.raw.timestamp;

          const refStrings = [
            item.transaction_address,
            item.raw?.transaction_address,
            item.bank_utr,
            item.raw?.bank_utr,
            item.invoice_no,
            item.raw?.invoice_no,
            String(item._id || ""),
            String(item.raw?._id || "")
          ];
          for (const s of refStrings) {
            if (s) {
              const match = String(s).match(/(\d{13})/);
              if (match) {
                const t = Number(match[1]);
                if (!isNaN(t) && t > 1577836800000 && t < 2524608000000) {
                  return t;
                }
              }
            }
          }

          const purchasedDateCandidate = item.raw?.purchased_date || item.purchased_date;
          if (purchasedDateCandidate) {
            const t = new Date(purchasedDateCandidate).getTime();
            if (!isNaN(t) && t > 0) return t;
          }

          const isoCandidates = [
            item.raw?.createdAt,
            item.createdAt,
            item.purchase_date_time,
            item.raw?.purchase_date_time,
            item.raw?.purchase_date,
            item.purchase_date,
            item.raw?.updatedAt,
            item.updatedAt
          ];
          for (const c of isoCandidates) {
            if (c) {
              const str = String(c);
              if (str.includes("T") || str.includes(":")) {
                const t = new Date(c).getTime();
                if (!isNaN(t) && t > 0) return t;
              }
            }
          }

          const idStr = String(item._id || item.raw?._id || "");
          if (idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
            const t = parseInt(idStr.substring(0, 8), 16) * 1000;
            if (!isNaN(t) && t > 0) return t;
          }

          const fallbackCandidates = [
            item.raw?.date,
            item.date,
            item.raw?.formatted_date,
            item.formatted_date
          ];
          for (const c of fallbackCandidates) {
            if (c) {
              const t = new Date(c).getTime();
              if (!isNaN(t) && t > 0) return t;
            }
          }

          return 0;
        };

        const mapTxn = (txn, defaultType = "purchase") => {
          const isDeposit = txn.type === "deposit" ||
            (!txn.courses_purchased && !txn.course_title) ||
            (!txn.courses_purchased && txn.payment_method && (
              txn.payment_method.toLowerCase().includes("upi") ||
              txn.payment_method.toLowerCase().includes("card") ||
              txn.payment_method.toLowerCase().includes("wallet")
            )) ||
            (txn.payment_method && (
              txn.payment_method.toLowerCase().includes("deposit") ||
              txn.payment_method.toLowerCase().includes("add money") ||
              txn.payment_method.toLowerCase().includes("added money") ||
              txn.payment_method.toLowerCase().includes("top-up")
            )) ||
            (txn.course_purchased && (
              txn.course_purchased.toLowerCase().includes("wallet top-up") ||
              txn.course_purchased.toLowerCase().includes("deposit")
            ));

          const amount =
            txn.amount !== undefined && txn.amount !== null
              ? Number(txn.amount)
              : Number(txn.courses_purchased?.course_price || 0);

          const currency = txn.currency || "INR";
          const paymentMethod = txn.payment_method || (currency === "INR" ? "Indian Rupees (₹)" : "MetaMask (ETH)");
          
          const ts = getTimestamp(txn);
          const rawTimeSource = ts > 0 ? ts : (txn.purchased_date || txn.createdAt || txn.date || txn.purchase_date || txn.updatedAt);
          const dt = formatDateTime(rawTimeSource);
          const purchaseDate = dt.date;
          const purchaseTime = dt.time;
          const purchaseDateTime = dt.full;

          if (isDeposit) {
            const invoiceNo = txn.invoice_no || `EDUDEP-${String(txn._id || Date.now()).slice(-6).toUpperCase()}`;
            const resolvedAccountHolder =
              txn.student_name ||
              (txn.user_id && (txn.user_id.admin_name || txn.user_id.user_name || txn.user_id.name)) ||
              (activeName || (isEducator ? "Educator" : "Student"));
            return {
              _id: txn._id,
              student_name: resolvedAccountHolder,
              course_purchased: `Personal Rupee Wallet Top-up (+₹${amount.toLocaleString("en-IN")})`,
              educator_name: "Personal Rupee Wallet",
              amount: amount,
              currency: currency,
              payment_method: paymentMethod,
              transaction_address: txn.transaction_address || invoiceNo,
              timestamp: ts,
              purchase_date: purchaseDate,
              purchase_time: purchaseTime,
              purchase_date_time: purchaseDateTime,
              formatted_date: purchaseDate,
              formatted_time: purchaseTime,
              status: txn.status || "SUCCESS",
              invoice_no: invoiceNo,
              type: "deposit",
              type_label: "Wallet Top-Up",
              is_credit: true,
              raw: txn
            };
          }

          // Course transaction: Check if Sales (student bought educator course) or Purchase (educator bought course)
          const activeNormName = (activeName || "").toLowerCase().trim();
          const activeNormWallet = (wallet || "").toLowerCase().trim();

          const rawAuthorName = (txn.educator_name || txn.courses_purchased?.author_name || "").toLowerCase().trim();
          const rawAuthorWallet = (txn.educator_wallet || txn.courses_purchased?.author_wallet_id || "").toLowerCase().trim();

          const rawBuyerName = (txn.student_name || (txn.user_id && (txn.user_id.admin_name || txn.user_id.user_name || txn.user_id.name)) || "").toLowerCase().trim();
          const rawBuyerWallet = (txn.student_wallet || (txn.user_id && txn.user_id.metamask_wallet_id) || "").toLowerCase().trim();

          const isAuthorMe = (activeNormName && rawAuthorName && rawAuthorName === activeNormName) ||
                             (activeNormWallet && rawAuthorWallet && rawAuthorWallet === activeNormWallet);

          const isBuyerMe = (activeNormName && rawBuyerName && rawBuyerName === activeNormName) ||
                            (activeNormWallet && rawBuyerWallet && rawBuyerWallet === activeNormWallet);

          let resolvedType = defaultType;
          if (txn.type === "sales") {
            resolvedType = "sales";
          } else if (txn.type === "purchase") {
            resolvedType = "purchase";
          } else if (isEducator) {
            if (isAuthorMe && !isBuyerMe) {
              resolvedType = "sales";
            } else if (isBuyerMe && !isAuthorMe) {
              resolvedType = "purchase";
            } else if (rawAuthorName && rawBuyerName && rawAuthorName !== rawBuyerName) {
              if (activeNormName && rawBuyerName === activeNormName) {
                resolvedType = "purchase";
              } else {
                resolvedType = "sales";
              }
            } else if (rawBuyerName && activeNormName && rawBuyerName === activeNormName) {
              resolvedType = "purchase";
            } else if (rawAuthorName && activeNormName && rawAuthorName === activeNormName) {
              resolvedType = "sales";
            } else {
              resolvedType = "sales";
            }
          }

          const isSales = resolvedType === "sales";
          const courseTitle = txn.courses_purchased?.title || txn.course_title || txn.course_purchased || "Course";
          const educatorName = txn.educator_name || txn.courses_purchased?.author_name || (isSales ? (activeName || "Educator") : "Educator");
          const studentName = txn.student_name || (txn.user_id && (txn.user_id.admin_name || txn.user_id.user_name || txn.user_id.name)) || (isSales ? "Student" : (activeName || "Account Holder"));

          const invoiceNo = txn.invoice_no || (isSales
            ? `EDUEARN-${String(txn._id || Date.now()).slice(-6).toUpperCase()}`
            : `EDUPAY-${String(txn._id || Date.now()).slice(-6).toUpperCase()}`);

          return {
            _id: txn._id,
            student_name: studentName,
            course_purchased: courseTitle,
            educator_name: educatorName,
            amount: amount,
            currency: currency,
            payment_method: paymentMethod,
            transaction_address: txn.transaction_address || invoiceNo,
            timestamp: ts,
            purchase_date: purchaseDate,
            purchase_time: purchaseTime,
            purchase_date_time: purchaseDateTime,
            formatted_date: purchaseDate,
            formatted_time: purchaseTime,
            status: txn.status || "SUCCESS",
            invoice_no: invoiceNo,
            type: resolvedType,
            type_label: isSales ? "Student Course Sale" : "Course Purchase",
            is_credit: isSales,
            raw: txn
          };
        };

        const sortByDescending = (list) => {
          return [...list].sort((a, b) => {
            const timeB = b?.timestamp || getTimestamp(b);
            const timeA = a?.timestamp || getTimestamp(a);
            return timeB - timeA;
          });
        };

        let apiTxns = [];
        const endpointsToTry = isEducator
          ? [
              `${API_BASE_URL}/user/educator-transactions`,
              `${API_BASE_URL}/educator-transactions`,
              `${API_BASE_URL}/admin/educator-transactions`
            ]
          : [
              `${API_BASE_URL}/user/transaction-history`
            ];

        for (const ep of endpointsToTry) {
          try {
            const res = await axios.get(ep, {
              params: {
                wallet: wallet || undefined,
                name: activeName || undefined,
                student_name: activeName || undefined
              },
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.status === 200 && res.data) {
              const list = res.data.transaction_history || res.data.all_transactions;
              if (Array.isArray(list) && list.length > 0) {
                apiTxns.push(...list);
              } else {
                if (Array.isArray(res.data.student_purchases)) {
                  apiTxns.push(...res.data.student_purchases);
                }
                if (Array.isArray(res.data.my_purchases)) {
                  apiTxns.push(...res.data.my_purchases);
                }
              }
              if (apiTxns.length > 0) break;
            }
          } catch (e) {
            // try next endpoint
          }
        }

        const activeNormName = (activeName || "").toLowerCase().trim();
        const activeNormWallet = (wallet || "").toLowerCase().trim();

        let localTxns = [];
        try {
          if (isEducator) {
            const tx1 = JSON.parse(localStorage.getItem("educator_transactions") || "[]");
            const tx2 = JSON.parse(localStorage.getItem("educator_purchases") || "[]");
            localTxns = [...tx1, ...tx2];
          } else {
            const tx3 = JSON.parse(localStorage.getItem("student_transactions") || "[]");
            const sanitizedTx3 = tx3.filter(t => {
              if (!t) return false;
              if (t.role === "Educator" || t.account_role === "educator") return false;
              const bName = (t.student_name || t.user_name || "").toLowerCase().trim();
              if (bName.includes("pramila") || bName === "educator") return false;
              return true;
            });
            if (sanitizedTx3.length !== tx3.length) {
              try {
                localStorage.setItem("student_transactions", JSON.stringify(sanitizedTx3));
              } catch (e) {}
            }
            localTxns = [...sanitizedTx3].filter(t => {
              if (!t) return false;
              if (t.role === "Educator" || t.account_role === "educator") return false;
              const normBuyerName = (t.student_name || t.user_name || "").toLowerCase().trim();
              const normBuyerWallet = (t.student_wallet || "").toLowerCase().trim();

              // If record has an explicit name that does not match active student, reject
              if (activeNormName && normBuyerName && normBuyerName !== activeNormName) {
                return false;
              }
              if (activeNormName && normBuyerName === activeNormName) return true;
              if (activeNormWallet && normBuyerWallet === activeNormWallet) {
                if (normBuyerName && activeNormName && normBuyerName !== activeNormName) return false;
                return true;
              }
              return !activeNormName && !activeNormWallet;
            });
          }
        } catch (e) {}

        // Strict account separation
        let filteredApiTxns = apiTxns;

        if (isEducator) {
          filteredApiTxns = apiTxns.filter(t => {
            if (!t) return false;
            const normAuthorName = (t.educator_name || t.courses_purchased?.author_name || "").toLowerCase().trim();
            const normAuthorWallet = (t.educator_wallet || t.courses_purchased?.author_wallet_id || "").toLowerCase().trim();
            const normBuyerName = (t.student_name || (t.user_id && (t.user_id.admin_name || t.user_id.name)) || "").toLowerCase().trim();
            const normBuyerWallet = (t.student_wallet || (t.user_id && t.user_id.metamask_wallet_id) || "").toLowerCase().trim();

            const isDep = t.type === "deposit" || (!t.courses_purchased && !t.course_title);
            if (isDep) {
              return (activeNormName && normBuyerName === activeNormName) ||
                     (activeNormWallet && normBuyerWallet === activeNormWallet) ||
                     normBuyerName === "educator" ||
                     !normBuyerName;
            }

            const isAuthor = (activeNormName && normAuthorName === activeNormName) ||
                             (activeNormWallet && normAuthorWallet === activeNormWallet);
            const isBuyer = (activeNormName && normBuyerName === activeNormName) ||
                            (activeNormWallet && normBuyerWallet === activeNormWallet);
            return isAuthor || isBuyer;
          });
        } else {
          // STUDENT: Strictly keep transactions belonging to this student account
          filteredApiTxns = apiTxns.filter(t => {
            if (!t) return false;
            // Reject educator records
            if (t.role === "Educator" || t.account_role === "educator") return false;
            if (t.user_id && t.user_id.admin_name) return false;

            const normBuyerName = (t.student_name || (t.user_id && (t.user_id.user_name || t.user_id.locked_account_name || t.user_id.name)) || "").toLowerCase().trim();
            const normBuyerWallet = (t.student_wallet || (t.user_id && t.user_id.metamask_wallet_id) || "").toLowerCase().trim();

            // Explicit name check: If student is Hitanshu and transaction has a different student_name, REJECT
            if (activeNormName && normBuyerName && normBuyerName !== activeNormName) {
              return false;
            }

            if (activeNormName && normBuyerName === activeNormName) {
              return true;
            }

            if (activeNormWallet && normBuyerWallet === activeNormWallet) {
              if (normBuyerName && activeNormName && normBuyerName !== activeNormName) {
                return false;
              }
              return true;
            }

            return !activeNormName && !activeNormWallet;
          });
        }

        const merged = [...localTxns, ...filteredApiTxns];
        const seen = new Set();
        const deduplicated = [];
        merged.forEach(t => {
          if (!t) return;
          const tid = String(t._id || t.transaction_address || t.bank_utr || t.invoice_no || "");
          if (tid && seen.has(tid)) return;
          if (tid) seen.add(tid);
          deduplicated.push(t);
        });

        const mapped = deduplicated.map(t => mapTxn(t));
        const sorted = sortByDescending(mapped);
        if (isEducator) {
          setEducatorTransactions(sorted);
        } else {
          setTransactions(sorted);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
        setEducatorTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    const handleTxnUpdate = () => {
      fetchTransactions();
    };
    window.addEventListener("edusphere_transaction_created", handleTxnUpdate);
    window.addEventListener("edusphere_balance_updated", handleTxnUpdate);
    window.addEventListener("storage", handleTxnUpdate);
    return () => {
      window.removeEventListener("edusphere_transaction_created", handleTxnUpdate);
      window.removeEventListener("edusphere_balance_updated", handleTxnUpdate);
      window.removeEventListener("storage", handleTxnUpdate);
    };
  }, [walletAddress, isEducator]);

  // ─── OFFICIAL DOWNLOADABLE TAX INVOICE & REVENUE RECEIPT GENERATOR ─────────
  const downloadReceipt = (txn) => {
    if (!txn) return;
    const isDeposit = txn.type === "deposit" ||
      (txn.raw && (!txn.raw.courses_purchased && !txn.raw.course_title)) ||
      (txn.course_purchased && (txn.course_purchased.toLowerCase().includes("wallet top-up") || txn.course_purchased.toLowerCase().includes("deposit"))) ||
      (txn.payment_method && (txn.payment_method.toLowerCase().includes("added money") || txn.payment_method.toLowerCase().includes("top-up")));

    if (isDeposit) {
      downloadDepositReceipt({
        invoice_no: txn.invoice_no || `EDUDEP-${String(txn._id || Date.now()).slice(-6).toUpperCase()}`,
        user_name: txn.student_name || (isEducator ? (localStorage.getItem("educatorName") || localStorage.getItem("name") || "Educator") : (localStorage.getItem("studentName") || localStorage.getItem("name") || "Student")),
        role: isEducator ? "Educator" : "Student",
        amount: Number(txn.amount) || 0,
        payment_method: txn.payment_method || "Added Money to Wallet",
        transaction_address: txn.transaction_address || `TXN-DEP-${Date.now()}`,
        date: txn.purchase_date_time || txn.purchase_date || new Date().toLocaleString("en-IN"),
        status: "SUCCESS"
      });
      return;
    }

    const isSales = txn.type === "sales";
    const student = txn.student_name || (isSales ? "Student" : (isEducator ? (localStorage.getItem("educatorName") || "Educator") : (localStorage.getItem("studentName") || "Student")));
    const courseTitle = txn.course_purchased || "Course";
    const educator = txn.educator_name || "Educator";
    const amountStr = txn.currency === "INR" ? `₹${Number(txn.amount).toLocaleString("en-IN")} INR` : `${txn.amount} ETH`;
    const invoiceNo = txn.invoice_no || (isSales ? `EDUEARN-${String(txn._id).slice(-6).toUpperCase()}` : `EDUPAY-${String(txn._id).slice(-6).toUpperCase()}`);
    const dateStr = txn.purchase_date_time || txn.purchase_date || new Date().toLocaleString("en-IN");
    const paymentMethod = txn.payment_method || (txn.currency === "INR" ? "Indian Rupees (UPI)" : "MetaMask (ETH)");

    const receiptTitle = isSales
      ? "Official Educator Course Sales & Revenue Credit Voucher"
      : "Official Course Purchase & Enrollment Tax Invoice";

    const bannerText = isSales
      ? "💰 Course Purchased by Student — Revenue Verified & Added to Educator Account"
      : "✓ Verified Enrollment & Cryptographically Recorded on Blockchain Ledger";

    const statusText = isSales
      ? "SETTLED & REVENUE ADDED"
      : "PAID & ENROLLMENT UNLOCKED";

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Edusphere ${isSales ? "Sales Voucher" : "Tax Invoice"} - ${invoiceNo}</title>
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
      <div class="badge">${receiptTitle}</div>
      <div class="invoice-meta">Receipt / Reference No: <strong style="color: #f59e0b;">${invoiceNo}</strong> &bull; Date: ${dateStr}</div>
    </div>
    <div class="banner">
      ${bannerText}
    </div>
    <table class="item-table">
      <tr>
        <td class="label">${isSales ? "Paid By (Student)" : "Purchaser Name"}</td>
        <td class="val" style="color: #f59e0b; font-size: 14px;">${student}</td>
      </tr>
      <tr>
        <td class="label">Course Title</td>
        <td class="val">${courseTitle}</td>
      </tr>
      <tr>
        <td class="label">${isSales ? "Credited To (Educator)" : "Course Educator / Instructor"}</td>
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
        <td class="label">${isSales ? "Total Revenue Added / Credited" : "Total Amount Paid"}</td>
        <td class="val highlight">${amountStr}</td>
      </tr>
      <tr>
        <td class="label">${isSales ? "Settlement Status" : "Enrollment Status"}</td>
        <td class="val" style="color: #10b981;">${statusText}</td>
      </tr>
    </table>
    <div class="footer">
      This is a digitally generated tax & settlement receipt from Edusphere Platform.<br />
      Valid for educator earnings accounting, student records, and platform verification.
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
    
    // Direct file download - immune to browser popup blockers
    const a = document.createElement("a");
    a.href = url;
    a.download = `Edusphere_Receipt_${invoiceNo}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {}
    }, 1000);

    try {
      window.open(url, "_blank");
    } catch (e) {}
  };

  const finalRecords = isEducator ? educatorTransactions : transactions;

  return (
    <div
      className={`${isDarkMode
        ? "bg-gradient-to-r from-black to-gray-900 text-gold"
        : "bg-gradient-to-br from-slate-50 via-white to-amber-50/20 text-slate-900"
        } transition-colors duration-300 min-h-[100vh] flex flex-col`}
    >
      {/* Navbar */}
      <nav className={`flex justify-between items-center p-6 border-b ${isDarkMode ? "border-amber-500/20 bg-gray-900/60" : "border-slate-200/80 bg-white/85 backdrop-blur-md"} shadow-sm sticky top-0 z-40`}>
        <div className="flex items-center space-x-2">
          <img src="/images/Edusphere logo.png" alt="Logo" className="w-12 h-12 rounded-full shadow-lg" />
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            Edusphere
          </h1>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-8">
          <div className="hidden md:flex space-x-8">
            <Link to={isEducator ? "/educatorhome" : "/studenthome"} className="group relative text-base font-medium hover:text-amber-500 transition-colors">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/courses" className="group relative text-base font-medium hover:text-amber-500 transition-colors">
              Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {!isEducator && (
              <Link to="/contest" className="group relative text-base font-medium hover:text-amber-500 transition-colors">
                Contest
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
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

          <ThreeLineMenu isEducator={isEducator} isDarkMode={isDarkMode} />
        </div>
      </nav>

      {/* Transaction History Section */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              {isEducator ? "Educator Financial Ledger" : "Transaction History"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {isEducator
                ? "Unified record of course sales from students, personal wallet top-ups, and course purchases with downloadable official receipts."
                : "Complete verifiable ledger of your course enrollments and downloadable official tax invoices."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/30">
              {finalRecords.length} Total Records
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-gray-400 space-y-3">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Loading financial records...</p>
          </div>
        ) : finalRecords.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${isDarkMode ? "bg-gray-900/60 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
            <FiFileText className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold mb-1">
              {isEducator ? "No Financial Transactions Found" : "No Transactions Found"}
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-5">
              {isEducator
                ? "All your transaction records (student course sales, wallet top-ups, and courses you bought) will appear here chronologically with downloadable official receipts."
                : "You haven't enrolled in any courses yet. Browse our course catalog and enroll using Indian Rupees (₹) or MetaMask ETH."}
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
            isDarkMode ? "bg-gray-900/80 border-gray-800" : "bg-white/95 border-slate-200/90 shadow-xl shadow-slate-100"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-xs uppercase tracking-wider font-extrabold border-b ${
                    isDarkMode ? "bg-black/60 text-amber-300 border-gray-800" : "bg-slate-50/90 text-slate-700 border-slate-200"
                  }`}>
                    <th className="p-4 sm:p-5">Transaction Type</th>
                    <th className="p-4 sm:p-5">
                      {isEducator ? "Party / Purchaser" : "Purchaser"}
                    </th>
                    <th className="p-4 sm:p-5">Course / Description</th>
                    <th className="p-4 sm:p-5">
                      {isEducator ? "Educator / Beneficiary" : "Educator / Author"}
                    </th>
                    <th className="p-4 sm:p-5">Amount</th>
                    <th className="p-4 sm:p-5">Payment Method</th>
                    <th className="p-4 sm:p-5">Date</th>
                    <th className="p-4 sm:p-5 text-center">Official Receipt</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-sm ${isDarkMode ? "divide-gray-800/50" : "divide-slate-200/70"}`}>
                  {finalRecords.map((txn, index) => (
                    <tr
                      key={txn._id || index}
                      className={`transition-colors ${
                        isDarkMode ? "hover:bg-amber-500/5" : "hover:bg-amber-50/40"
                      }`}
                    >
                      {/* Transaction Type */}
                      <td className="p-4 sm:p-5">
                        {txn.type === "sales" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            💰 Student Course Sale
                          </span>
                        ) : txn.type === "deposit" ? (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            isDarkMode ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                          }`}>
                            💳 Wallet Top-Up
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            isDarkMode ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-amber-100/70 text-amber-800 border border-amber-300/50"
                          }`}>
                            📚 Course Purchase
                          </span>
                        )}
                      </td>

                      {/* Party / Purchaser Name */}
                      <td className={`p-4 sm:p-5 font-bold ${isDarkMode ? "text-amber-400" : "text-amber-700"}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                            isDarkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {txn.student_name ? txn.student_name[0].toUpperCase() : "U"}
                          </div>
                          <span className="truncate max-w-[150px]">{txn.student_name}</span>
                        </div>
                      </td>

                      {/* Course / Description */}
                      <td className={`p-4 sm:p-5 font-semibold max-w-xs truncate ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}>
                        {txn.course_purchased}
                      </td>

                      {/* Educator / Beneficiary */}
                      <td className={`p-4 sm:p-5 text-xs font-medium ${
                        isDarkMode ? "text-gray-300" : "text-slate-600"
                      }`}>
                        {txn.educator_name}
                      </td>

                      {/* Amount */}
                      <td className="p-4 sm:p-5 font-extrabold font-mono">
                        {txn.is_credit ? (
                          <span className={isDarkMode ? "text-emerald-400" : "text-emerald-600 font-black"}>
                            +{txn.currency === "INR" ? `₹${Number(txn.amount).toLocaleString("en-IN")}` : `${txn.amount} ETH`}
                          </span>
                        ) : (
                          <span className={isDarkMode ? "text-white" : "text-slate-900 font-black"}>
                            {txn.currency === "INR" ? `₹${Number(txn.amount).toLocaleString("en-IN")}` : `${txn.amount} ETH`}
                          </span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="p-4 sm:p-5 text-xs">
                        <span className={`inline-block px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${
                          isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {txn.payment_method}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className={`p-4 sm:p-5 text-xs whitespace-nowrap ${
                        isDarkMode ? "text-gray-300" : "text-slate-600"
                      }`}>
                        <div className={`font-bold text-xs ${isDarkMode ? "text-white" : "text-slate-900"}`}>{txn.purchase_date}</div>
                        {txn.purchase_time && (
                          <div className={`text-[11px] font-mono mt-0.5 ${
                            isDarkMode ? "text-amber-400" : "text-amber-600 font-semibold"
                          }`}>{txn.purchase_time}</div>
                        )}
                      </td>

                      {/* Download Receipt Button */}
                      <td className="p-4 sm:p-5 text-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => downloadReceipt(txn)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                          title={txn.type === "sales" ? "Download Educator Revenue Voucher" : txn.type === "deposit" ? "Download Wallet Deposit Receipt" : "Download Official Purchase Receipt"}
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
