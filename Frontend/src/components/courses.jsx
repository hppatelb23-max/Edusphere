import React, { useState, useEffect,useRef } from 'react';
import { useNavigate, useLocation ,Link} from 'react-router-dom';
// import Web3 from 'web3';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown,FiCopy, FiLogOut } from 'react-icons/fi';
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

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVisitCourse = (course) => {
    navigate(`/course/${course._id || course.title}`, { state: { course } });
  };
  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/courses`);

        if (response.status === 200 && Array.isArray(response.data?.courses)) {
          const dbCourses = response.data.courses;
          const seenIds = new Set();
          const seenTitles = new Set();
          const uniqueList = [];

          dbCourses.forEach((c) => {
            if (!c) return;
            const sid = c._id ? c._id.toString() : null;
            const normTitle = (c.title || "").toLowerCase().trim();
            if ((!sid || !seenIds.has(sid)) && (!normTitle || !seenTitles.has(normTitle))) {
              if (sid) seenIds.add(sid);
              if (normTitle) seenTitles.add(normTitle);
              uniqueList.push(c);
            }
          });

          dummyCourses.forEach((c) => {
            if (!c) return;
            const sid = c._id ? c._id.toString() : null;
            const normTitle = (c.title || "").toLowerCase().trim();
            if ((!sid || !seenIds.has(sid)) && (!normTitle || !seenTitles.has(normTitle))) {
              if (sid) seenIds.add(sid);
              if (normTitle) seenTitles.add(normTitle);
              uniqueList.push(c);
            }
          });

          setCourses(uniqueList);
        } else {
          setCourses(dummyCourses);
        }
      } catch (error) {
        console.warn("Could not fetch remote courses, falling back to dummy courses:", error);
        setCourses(dummyCourses);
      }
    };

    fetchCourses();
  }, []);
 

  return (
    <div
      className={`${
        isDarkMode
          ? "bg-gradient-to-r from-black to-gray-700 text-white"
          : "bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900"
      } transition-colors duration-300`}
    >
      <nav className={`flex justify-between items-center p-5 px-8 ${isDarkMode ? "bg-gray-900/80 border-b border-gray-700/50" : "bg-white/90 backdrop-blur-sm border-b border-amber-200/70 shadow-sm"} sticky top-0 z-40`}>
             <div className="flex items-center space-x-2">
               
                <img src="/images/Edusphere logo.png" alt="Logo" className="w-12 h-12 rounded-full shadow-lg" />
                 
                
               
               <h1 className="text-4xl font-bold ">Edusphere</h1>
             </div>
             <div className="flex items-center space-x-8">
               <div className="flex space-x-8">
                 <Link to="/studenthome" className="group relative text-lg font-medium hover:text-amber-500 transition-colors">
                                  Home
                                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
                                </Link>
                                <Link to="/courses" className="group relative text-lg font-medium hover:text-amber-500 transition-colors">
                                  Courses
                                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
                                </Link>
            <Link to="/tests" className="group relative text-lg font-medium hover:text-amber-500 transition-colors">
              Tests
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
     
               {/* Dropdown Menu */}
               <div className="relative" ref={dropdownRef}>
                 <button
                   onClick={toggleDropdown}
                   className={`text-lg bg-gradient-to-r from-amber-500 to-amber-300 text-black py-2 px-4 rounded-full ${
                     walletAddress ? "" : "cursor-not-allowed opacity-50"
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
                       className={`absolute right-0 mt-2 w-64 origin-top-right rounded-xl shadow-xl backdrop-blur-lg ${
                         isDarkMode ? "bg-gray-800/95 border border-gray-700" : "bg-white/95 border border-amber-100"
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
                : 'bg-white shadow-xl shadow-amber-100/70 border border-amber-200/60 hover:border-amber-300 hover:shadow-amber-200/60'
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-base font-black block ${
                      isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                    }`}>
                      ₹{course.price_inr && course.price_inr > 0
                        ? course.price_inr
                        : (course.course_price && course.course_price > 10
                            ? course.course_price
                            : Math.round(Number(course.course_price || 0.01) * 350000))} INR
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono block">
                      or {course.course_price && course.course_price < 5 ? course.course_price : 0.01} ETH
                    </span>
                  </div>
                </div>

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