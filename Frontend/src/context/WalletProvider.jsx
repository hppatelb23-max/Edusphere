import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FiShield, FiCheckCircle, FiExternalLink, FiX, FiAlertCircle, FiInfo } from "react-icons/fi";
import { API_BASE_URL, getCookie, setCookie, deleteCookie } from "../utils/api";
import { disconnect } from "@wagmi/core";
import { config } from "../../config.ts";

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  // Only restore if user explicitly connected in this session
  const [walletAddress, setWalletAddress] = useState(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("walletConnected") === "true") {
      return getCookie("walletAddress") || null;
    }
    return null;
  });

  const [walletConnected, setWalletConnected] = useState(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("walletConnected") === "true") {
      return Boolean(getCookie("walletAddress"));
    }
    return false;
  });

  const [showMetaMaskModal, setShowMetaMaskModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [connectNotice, setConnectNotice] = useState("");
  const [pendingCallback, setPendingCallback] = useState(null);

  const handlelogin = async (account, navigatetosignup) => {
    if (!account) return;
    const role = localStorage.getItem("role") || "student";
    const callback = typeof navigatetosignup === "function" ? navigatetosignup : null;

    setCookie("walletAddress", account, 7);
    setWalletAddress(account);
    setWalletConnected(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("walletConnected", "true");
    }

    if (role === "educator") {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/admin/login`,
          { wallet_id: account },
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.status === 200 && response.data?.token) {
          toast.success(response.data.message || "Educator logged in successfully");
          setCookie("walletAddress", account, 7);
          setCookie("adminWallet", account, 7);
          localStorage.setItem("admin", response.data.data.id);
          localStorage.setItem("adminWallet", account);
          localStorage.setItem("educatorWallet", account);
          setCookie("admin", response.data.token, 7);
        }
      } catch (error) {
        console.warn("Educator login response:", error.response?.data || error.message);
        if (error.response?.status === 404) {
          toast.info("Account not found. Please add your educator details.");
          if (callback) callback();
        }
      }
    } else {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/user/login`,
          { wallet_id: account },
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.status === 200 && response.data?.token) {
          toast.success(response.data.message || "Student logged in successfully");
          setCookie("walletAddress", account, 7);
          localStorage.setItem("user", response.data.data.id);
          setCookie("user", response.data.token, 7);
        }
      } catch (error) {
        console.warn("Student login response:", error.response?.data || error.message);
        if (error.response?.status === 404) {
          toast.info("Account not found. Please add your student details.");
          if (callback) callback();
        }
      }
    }
  };

  // Execution function for MetaMask connection
  const executeConnectMetaMask = async (callback) => {
    if (typeof window === "undefined" || !window.ethereum) {
      setConnectError("MetaMask extension is not detected in your browser.");
      const installMetaMask = confirm("MetaMask is required to interact with Edusphere. Install now?");
      if (installMetaMask) window.open("https://metamask.io/download/", "_blank");
      return null;
    }

    setIsConnecting(true);
    setConnectError("");
    setConnectNotice("");

    try {
      // 1. Fast path: check if accounts are already authorized
      const existingAccounts = await window.ethereum.request({ method: "eth_accounts" });
      if (existingAccounts && existingAccounts.length > 0) {
        const account = existingAccounts[0];
        setWalletAddress(account);
        setWalletConnected(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("walletConnected", "true");
        }
        setCookie("walletAddress", account, 7);
        setShowMetaMaskModal(false);
        setIsConnecting(false);
        await handlelogin(account, callback || pendingCallback);
        toast.success("MetaMask connected successfully!");
        return account;
      }

      // 2. Request accounts authorization
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        const account = accounts[0];
        setWalletAddress(account);
        setWalletConnected(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("walletConnected", "true");
        }
        setCookie("walletAddress", account, 7);
        setShowMetaMaskModal(false);
        setIsConnecting(false);
        await handlelogin(account, callback || pendingCallback);
        toast.success("MetaMask connected successfully!");
        return account;
      }
    } catch (error) {
      console.warn("MetaMask connection status:", error);
      setIsConnecting(false);

      if (error.code === -32002 || (error.message && error.message.includes("already pending"))) {
        setConnectNotice(
          "MetaMask notification is already open in your browser extension! Click the Fox icon in your browser toolbar or click 'Open MetaMask Window' below to approve."
        );
      } else if (error.code === 4001) {
        setConnectNotice("Connection request was cancelled in MetaMask. Click 'Connect MetaMask' when you're ready.");
      } else {
        setConnectError(error.message || "Failed to connect to MetaMask. Please try again.");
      }
    }

    return null;
  };

  // Connect wallet function triggered across the app
  const connectWallet = (navigatetosignup) => {
    const callback = typeof navigatetosignup === "function" ? navigatetosignup : null;
    setPendingCallback(() => callback);
    setConnectError("");
    setConnectNotice("");
    setShowMetaMaskModal(true);

    // Also automatically trigger MetaMask request so user doesn't have to double-click
    setTimeout(() => {
      executeConnectMetaMask(callback);
    }, 200);
  };

  // Detect account changes only for already connected sessions
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts && accounts.length > 0) {
          if (sessionStorage.getItem("walletConnected") === "true") {
            const account = accounts[0];
            setWalletAddress(account);
            setWalletConnected(true);
            setCookie("walletAddress", account, 7);
            handlelogin(account);
          }
        } else {
          disconnectWallet();
        }
      };

      const handleDisconnect = () => {
        disconnectWallet();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("disconnect", handleDisconnect);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      };
    }
  }, []);

  // Disconnect wallet function
  const disconnectWallet = (options = {}) => {
    setWalletAddress(null);
    setWalletConnected(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("walletConnected");
      localStorage.removeItem("walletConnected");
    }
    deleteCookie("walletAddress");
    deleteCookie("admin");
    deleteCookie("user");
    deleteCookie("adminWallet");
    localStorage.removeItem("admin");
    localStorage.removeItem("user");
    localStorage.removeItem("adminWallet");
    localStorage.removeItem("educatorWallet");
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("role");
    try {
      disconnect(config).catch(() => {});
    } catch (e) {}
    if (!options?.silent) {
      toast.info("Wallet disconnected");
    }
    // Directly redirect to main landing page (/)
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.href = "/";
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        walletConnected,
        connectWallet,
        disconnectWallet,
        handlelogin,
        setCookie,
        deleteCookie,
        openMetaMaskModal: () => setShowMetaMaskModal(true)
      }}
    >
      {children}

      {/* ── CENTERED MEDIUM-SIZED METAMASK MODAL IN THE MIDDLE OF SCREEN ── */}
      <AnimatePresence>
        {showMetaMaskModal && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-gray-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative flex flex-col items-center text-center"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowMetaMaskModal(false);
                  setIsConnecting(false);
                  setConnectError("");
                  setConnectNotice("");
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>

              {/* MetaMask Fox Badge */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-400/40 flex items-center justify-center mb-4 shadow-xl shadow-amber-500/10">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                  alt="MetaMask Logo"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.ctfassets.net/9sy2a0egs6zh/6zN4k7G7fO8uM6a8GkeGii/d50711dbb5e7d5df63ff39bdf5c26dd5/MetaMask_Fox.svg";
                  }}
                />
              </div>

              <h3 className="text-2xl font-black mb-1 text-white">Connect MetaMask</h3>
              <p className="text-xs sm:text-sm text-gray-300 mb-5 leading-relaxed">
                Connect your MetaMask wallet to authenticate your profile and manage your courses.
              </p>

              {/* Notice / Informational State */}
              {connectNotice && (
                <div className="w-full p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs mb-4 text-left flex items-start gap-2.5">
                  <FiInfo className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span className="leading-snug">{connectNotice}</span>
                </div>
              )}

              {/* Error Message */}
              {connectError && (
                <div className="w-full p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs mb-4 text-left flex items-start gap-2.5">
                  <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span className="leading-snug">{connectError}</span>
                </div>
              )}

              {/* Primary Connect Button */}
              <button
                type="button"
                onClick={() => executeConnectMetaMask(pendingCallback)}
                disabled={isConnecting}
                className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-98"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Waiting for MetaMask Approval...</span>
                  </>
                ) : (
                  <>
                    <FiShield className="w-5 h-5" />
                    <span>Connect MetaMask</span>
                  </>
                )}
              </button>

              {/* Secondary Helper Button: Open in Full Window */}
              <button
                type="button"
                onClick={() => {
                  try {
                    window.open("chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html", "_blank");
                  } catch (e) {
                    toast.info("Please open MetaMask from your browser toolbar.");
                  }
                }}
                className="mt-4 text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="If your extension popup is clipped or small, open MetaMask as a full middle tab"
              >
                <FiExternalLink className="w-3.5 h-3.5" />
                <span>Popup not visible? Open MetaMask Full Window</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </WalletContext.Provider>
  );
};
