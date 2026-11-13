import React, { useState, useEffect, useRef, useContext } from "react";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import {CourseContext, CourseProvider} from "./context"
import { FiUser, FiDollarSign, FiBook, FiGift, FiCopy } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from "../context/WalletProvider";
import { useThemeStore } from "../store/themeStore";
import axios from "axios";
import { contractAbi, contractAddress } from "../utils/constants";
import { useWriteContract, useAccount } from 'wagmi'
import { toast } from 'react-toastify'
import { API_BASE_URL, getCookie } from "../utils/api";

const RedeemPage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const [account, setAccount] = useState(null);
  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const [coins, setCoins] = useState(0);
  const {
    redeemCoins,
  } = useContext(CourseContext);

  const { writeContract, writeContractAsync } = useWriteContract()
  const { address } = useAccount()

  const dropdownRef = useRef(null);
  const isEducator = localStorage.getItem("role") === "educator";

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const token = getCookie("user");
        if (!token) return;

        const response = await axios.get(`${API_BASE_URL}/user/redeem`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200 && response.data?.coins !== undefined) {
          setCoins(response.data.coins);
        }
      } catch (error) {
        console.warn("Error fetching coins:", error);
      }
    };

    fetchCoins();
  }, []);

  const handleWalletClick = async (reqcoins) => {
    try {
      const token = getCookie("user");
      if (!token) {
        toast.error("Please add your Student details first");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/user/redeem`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const usercoins = response.data.coins;
        if(usercoins < reqcoins){
          toast.info("You don't have enough coins to redeem this offer");
        }else{
          const choice = confirm("Are you sure you want to redeem this offer?");
          if(choice){
            try {
              await writeContract({
                abi: contractAbi,
                address: contractAddress,
                functionName: 'redeem',
                args: [reqcoins, address],
              });
            } catch (error) {
              console.warn("Error calling redeemCoins:", error);
            }
            const newcoins = usercoins - reqcoins;
            const resPost = await axios.post(`${API_BASE_URL}/user/redeem`, {
              coins: newcoins,
            }, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (resPost.status === 200) {
              toast.success(resPost.data.message || "Offer redeemed successfully!");
              setCoins(newcoins);
            } else {
              toast.error(resPost.data.error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error redeeming:", error);
      toast.error(error.response?.data?.error || "Error during redemption");
    }
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  // Toggle between dark and light modes
  const toggleisDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);


  const offers = [
    { coinsRequired: 20 , ethers: '0.01' },
    { coinsRequired: 200, ethers: '0.01' },
    { coinsRequired: 500, ethers: '0.025' },
    { coinsRequired: 1000, ethers: '0.05' },
    { coinsRequired: 2000, ethers: '0.1' },
    { coinsRequired: 1500, ethers: '0.075' },
    { coinsRequired: 100, ethers: '0.005' },
    { coinsRequired: 1800, ethers: '0.09' },
    { coinsRequired: 2000, ethers: '0.1' },
    { coinsRequired: 400, ethers: '0.02' },
  ];

  return (
    <div
      className={`${isDarkMode
          ? "bg-gradient-to-r from-black to-gray-700 text-gold"
          : "bg-gradient-to-r from-yellow-100 to-white text-black"
        } transition-colors duration-300`}
    >
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">

          <img src="/images/Edusphere logo.png" alt="Logo" className="w-12 h-12 rounded-full shadow-lg" />

          <h1 className="text-4xl font-bold ">Edusphere</h1>
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex space-x-8">
            <Link to={isEducator ? "/educatorhome" : "/studenthome"} className="group relative text-lg font-medium hover:text-amber-500 transition-colors">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/courses" className="group relative text-lg font-medium hover:text-amber-500 transition-colors">
              Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/contest" className="group relative text-lg font-medium hover:text-amber-500 transition-colors">
              Contest
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          {/* Wallet Button */}
          <motion.button

            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${walletConnected ?
                'bg-emerald-500/20 text-emerald-600' :
                'bg-amber-400 hover:bg-amber-600 text-white'
              } transition-colors`}
            onClick={walletConnected ? handleWalletClick : connectWallet}
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

          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className={`text-lg bg-gradient-to-r from-amber-500 to-amber-300 text-black py-2 px-4 rounded-full ${walletAddress ? "" : "cursor-not-allowed opacity-50"
                }`}
              disabled={!walletAddress}
            >
              ☰
            </button>
            <AnimatePresence>
              {dropdownOpen && walletAddress && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-64 origin-top-right rounded-xl shadow-xl backdrop-blur-lg ${isDarkMode ? "bg-gray-800/95 border border-gray-700" : "bg-white/95 border border-amber-100"
                    } z-50`}
                >
                  <div className="p-2 space-y-1">
                    <Link
                      to="/signup"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiUser className="text-amber-500" />
                      <span>Add Details</span>
                    </Link>
                    
                    <Link
                      to="/transaction"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiDollarSign className="text-amber-500" />
                      <span>Transactions</span>
                    </Link>
                    <Link
                      to="/mylearning"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiBook className="text-amber-500" />
                      <span>My Learning</span>
                    </Link>
                    <Link
                      to="/redeem"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiGift className="text-amber-500" />
                      <span>Redeem</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
      <div className="border-b-4 border-gold"></div>
      {/* Coins Section */}
      <p className="flex flex-row justify-end p-8">
        <div className={`text-4xl font-bold text-center ${isDarkMode ? 'dark:text-gold' : 'bg-gradient-to-r from-black to-gold bg-clip-text'
          }`}>Coins: {coins}</div>  
      </p>
      {/* Redeem Section */}
      <div className="p-8">
        <h1 className={`text-4xl font-bold text-center mb-6 ${isDarkMode ? 'dark:text-gold' : 'bg-gradient-to-r from-black to-gold  bg-clip-text'
          }`}>
          Redeem Your Coins
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer, index) => (
            <div
              key={index}
              className="border border-gold p-4 rounded shadow-lg dark:bg-black dark:text-gold"
            >
              <h2 className={`text-2xl font-semibold ${isDarkMode ? 'dark:text-gold' : 'bg-gradient-to-r from-black to-gold text-transparent bg-clip-text'
                }`}>
                Redeem Offer
              </h2>
              <p className={`mt-2 text-xl ${isDarkMode ? 'dark:text-gold' : 'bg-gradient-to-r from-black to-gold text-transparent bg-clip-text'
                }`}>
                Coins Required: {offer.coinsRequired}
              </p>
              <p className={`mt-2 text-xl${isDarkMode ? 'dark:text-gold' : 'bg-gradient-to-r from-black to-gold text-transparent bg-clip-text'
                }`}>
                You'll Get: {offer.ethers} Ethers
              </p>
              <button
                className="bg-gold text-black px-4 py-2 mt-4 rounded"
                onClick={walletConnected ? () => handleWalletClick(offer.coinsRequired)  : connectWallet}
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RedeemPage;
