import React, { useEffect, useState, useRef,Component } from 'react';
import { FaSun, FaMoon, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCopy, FiUser, FiDollarSign, FiBook, FiGift } from 'react-icons/fi';
import { useWallet } from "../context/WalletProvider";
import { useTheme } from "next-themes";
import { useThemeStore } from "../store/themeStore";

class DropdownMenu extends Component {
  constructor(props) {
    super(props);
    this.dropdownRef = createRef();
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = (event) => {
    if (this.dropdownRef.current && !this.dropdownRef.current.contains(event.target)) {
      this.props.onClose();
    }
  };

  render() {
    const { isOpen, isDarkMode, isWalletConnected } = this.props;
    
    if (!isOpen) return null;

    return (
      <div 
        ref={this.dropdownRef}
        className={`absolute right-0 mt-2 w-48 rounded-md shadow-xl ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}
      >
        <ul className="p-2 space-y-1">
          <DropdownItem
            label="Add Details"
            isDarkMode={isDarkMode}
            disabled={!isWalletConnected}
            onClick={() => console.log('Add Details')}
          />
          <DropdownItem
            label="Coins"
            isDarkMode={isDarkMode}
            disabled={!isWalletConnected}
            onClick={() => console.log('Coins')}
          />
          <DropdownItem
            label="Manage Courses"
            isDarkMode={isDarkMode}
            disabled={!isWalletConnected}
            onClick={() => console.log('Manage Courses')}
          />
          <DropdownItem
            label="Redeem"
            isDarkMode={isDarkMode}
            disabled={!isWalletConnected}
            onClick={() => console.log('Redeem')}
          />
        </ul>
      </div>
    );
  }
}

const DropdownItem = ({ label, isDarkMode, disabled, onClick }) => (
  <li
    onClick={!disabled ? onClick : null}
    className={`p-2 rounded-md transition-colors cursor-pointer ${
      disabled 
        ? `${isDarkMode ? 'text-gray-500' : 'text-gray-400'} cursor-not-allowed`
        : `${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-amber-50 text-gray-700'}`
    }`}
  >
    {label}
  </li>
);

const Contest = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
   const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { walletAddress, walletConnected, connectWallet } = useWallet(); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('light');


  
  const dropdownRef = useRef(null);
  const isEducator = localStorage.getItem("role") === "educator";

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

  
  useEffect(() => {
    
    const fetchContests = async () => {
      let url = `https://codeforces.com/api/contest.list?gym=true/contest`;
      try {
        let data = await fetch(url);
        let parsedData = await data.json();
        const filteredContests = parsedData.result.filter(
          contest => contest.phase === 'BEFORE' || contest.phase === 'CODING'
        );
        setContests(filteredContests);
      } catch (error) {
        console.error('Failed to fetch contests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  
  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
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

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  };
  

   

    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-yellow-50 to-amber-100'}`}>
      
             {/* Navbar Section */}
             <nav className={`flex justify-between items-center p-6 ${isDarkMode? 'text-white':'text-black'}`}>
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
                                     <path d="M10 2a1 1 0 011 1v1.323l3.954.99a1 1 0 01.686.828L15.667 8H17a1 1 0 110 2h-1.333l-.012.082a5 5 0 01-4.245 4.245L11 14.667V17a1 1 0 11-2 0v-2.333l-.082-.012a5 5 0 01-4.245-4.245L4.333 10H3a1 1 0 110-2h1.333l.027-.86a1 1 0 01.686-.827L9 4.323V3a1 1 0 011-1z"/>
                                   </svg>
                                 </>
                               )}
                             </motion.button>
       
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
                             to="/coins"
                             className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                           >
                             <FiDollarSign className="text-amber-500" />
                             <span>Coins</span>
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
             <div className="border-b-4  border-amber-300"></div>
        <div className="container mx-auto pt-32 pb-12 px-4">
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className={`text-5xl font-bold mb-4 ${isDarkMode ? 'text-amber-400' : 'text-gray-800'}`}>
              Upcoming Contests
            </h1>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Challenge yourself with these coding competitions
            </p>
          </motion.header>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="animate-spin text-4xl text-amber-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {contests.map(contest => (
                  <motion.div
                    key={contest.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    className={`rounded-2xl p-6 transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
                  >
                    <div className="flex flex-col h-full">
                      <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-amber-400' : 'text-gray-800'}`}>
                        {contest.name}
                      </h3>
                      
                      <div className={`flex-1 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="flex items-center space-x-2">
                          <ClockIcon isDarkMode={isDarkMode} />
                          <span>
                            {new Date(contest.startTimeSeconds * 1000).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <DurationIcon isDarkMode={isDarkMode} />
                          <span>
                            {Math.floor(contest.durationSeconds / 3600)}h {Math.floor((contest.durationSeconds % 3600) / 60)}m
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <TypeIcon isDarkMode={isDarkMode} />
                          <span className="capitalize">{contest.type.toLowerCase()}</span>
                        </div>
                      </div>

                      <a
                        href={`https://codeforces.com/contests/${contest.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-6 inline-block w-full text-center py-3 rounded-xl font-semibold transition-colors ${
                          isDarkMode
                            ? 'bg-amber-500 hover:bg-amber-600 text-gray-900'
                            : 'bg-amber-400 hover:bg-amber-500 text-gray-800'
                        }`}
                      >
                        Participate Now
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <footer className={`mt-24 py-8 ${isDarkMode ? 'bg-gray-800' : 'bg-amber-100'}`}>
          <div className="container mx-auto text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              © 2025 Edusphere. All rights reserved. Crafted with ❤️ for coders.
            </p>
          </div>
        </footer>
      </div>
    );
  }


// Helper components
const NavButton = ({ to, children, isDarkMode, active }) => (
  <Link
    to={to}
    className={`px-4 py-2 rounded-full transition-all font-medium ${
      active 
        ? (isDarkMode ? 'bg-amber-500 text-gray-900' : 'bg-amber-400 text-gray-800')
        : (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-amber-200 text-gray-600')
    }`}
  >
    {children}
  </Link>
);

const WalletButton = ({ isConnected, wallet_address, address, onClick, isDarkMode }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-full transition-all font-medium flex items-center space-x-2 ${
      isConnected
        ? (isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600')
        : (isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-amber-200 hover:bg-amber-300')
    } ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
  >
    {isConnected || wallet_address ? (
      <>
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        <span>{`${wallet_address.slice(0, 6)}...${wallet_address.slice(-4)}`}</span>
      </>
    ) : 'Connect Wallet'}
  </button>
);

const ClockIcon = ({ isDarkMode }) => (
  <svg className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DurationIcon = ({ isDarkMode }) => (
  <svg className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TypeIcon = ({ isDarkMode }) => (
  <svg className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

export default Contest;