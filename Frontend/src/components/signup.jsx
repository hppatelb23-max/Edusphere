import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FiUser, FiArrowLeft, FiCheckCircle, FiShield } from 'react-icons/fi';
import { useWallet } from '../context/WalletProvider';
import { API_BASE_URL, getCookie, setCookie } from '../utils/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { walletAddress, walletConnected, connectWallet } = useWallet();

  const [role, setRole] = useState(() => {
    return localStorage.getItem('role') || 'student';
  });
  const [currentWallet, setCurrentWallet] = useState(walletAddress || getCookie('walletAddress') || '');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    if (savedRole) {
      setRole(savedRole);
    }

    const addr = walletAddress || getCookie('walletAddress');
    if (addr) {
      setCurrentWallet(addr);
    }
  }, [walletAddress]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    localStorage.setItem('role', newRole);
  };

  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) {
      setCurrentWallet(addr);
      setCookie('walletAddress', addr, 7);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const activeWallet = currentWallet || walletAddress || getCookie('walletAddress');
    if (!activeWallet) {
      toast.warn('Please connect your MetaMask wallet first.');
      return;
    }

    if (!username.trim()) {
      toast.warn('Please enter a username.');
      return;
    }
    localStorage.setItem('username', username.trim());
    localStorage.setItem('studentName', username.trim());
    localStorage.setItem('name', username.trim());

    setIsLoading(true);

    try {
      if (role === 'student') {
        const response = await axios.post(
          `${API_BASE_URL}/user/add-details`,
          {
            username: username.trim(),
            wallet_id: activeWallet,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.status === 200) {
          toast.success(response.data.message || 'Student details added successfully!');
          setCookie('user', response.data.token, 7);
          setCookie('walletAddress', activeWallet, 7);
          const trimmedName = username.trim();
          localStorage.setItem('user', response.data.data?.id || '');
          localStorage.setItem('role', 'student');
          localStorage.setItem('username', trimmedName);
          localStorage.setItem('studentName', trimmedName);
          localStorage.setItem('name', trimmedName);
          if (activeWallet) {
            localStorage.setItem(`student_name_${activeWallet.toLowerCase()}`, trimmedName);
          }
          setTimeout(() => navigate('/studenthome'), 800);
        } else {
          toast.error(response.data.error || 'Failed to save details');
        }
      } else {
        const response = await axios.post(
          `${API_BASE_URL}/admin/add-details`,
          {
            username: username.trim(),
            wallet_id: activeWallet,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.status === 200) {
          toast.success(response.data.message || 'Educator details added successfully!');
          setCookie('admin', response.data.token, 7);
          setCookie('walletAddress', activeWallet, 7);
          setCookie('adminWallet', activeWallet, 7);
          const trimmedName = username.trim();
          localStorage.setItem('admin', response.data.data?.id || '');
          localStorage.setItem('adminWallet', activeWallet);
          localStorage.setItem('educatorWallet', activeWallet);
          localStorage.setItem('role', 'educator');
          localStorage.setItem('username', trimmedName);
          localStorage.setItem('educatorName', trimmedName);
          localStorage.setItem('name', trimmedName);
          setTimeout(() => navigate('/educatorhome'), 800);
        } else {
          toast.error(response.data.error || 'Failed to save details');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Something went wrong';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const activeWallet = currentWallet || walletAddress || getCookie('walletAddress');

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:bg-gray-950 text-gray-900 dark:text-white px-4 py-8 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-7xl mx-auto z-20">
        <Link
          to={role === 'educator' ? '/educatorhome' : '/studenthome'}
          className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors text-sm font-medium"
        >
          <FiArrowLeft className="text-lg" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <img src="/images/Edusphere logo.png" alt="Edusphere Logo" className="w-10 h-10 rounded-full shadow-lg" />
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Edusphere
          </span>
        </div>
      </header>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl bg-white dark:bg-gray-900/90 border border-amber-200 dark:border-gray-800 rounded-3xl shadow-2xl shadow-amber-100/60 dark:shadow-black/40 overflow-hidden backdrop-blur-xl grid md:grid-cols-2 mt-12 z-10"
      >
        {/* Left Visual Column */}
        <div className="relative hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-amber-500 via-amber-400 to-orange-400 dark:from-gray-900 dark:via-gray-950 dark:to-black border-r border-amber-300 dark:border-gray-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-amber-500/10 border border-white/40 dark:border-amber-500/30 text-white dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <FiShield className="text-sm" /> Web3 Identity
            </div>
            <h2 className="text-3xl font-extrabold leading-tight text-white mb-3">
              Join the Future of Decentralized Learning
            </h2>
            <p className="text-white/80 dark:text-gray-400 text-sm leading-relaxed">
              Complete your profile to publish or enroll in courses, earn verified credentials, and participate in contests on-chain.
            </p>
          </div>

          <div className="my-8 rounded-2xl overflow-hidden border border-gray-800 shadow-lg">
            <img
              src="/images/sign up image.avif"
              alt="Edusphere Web3"
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <FiCheckCircle className="text-emerald-400 text-sm" /> Secured by Polygon & Smart Contracts
          </div>
        </div>

        {/* Right Form Column */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-transparent">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Add Profile Details</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Register your wallet address with Edusphere</p>
          </div>

          {/* Role Selector Pill */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl border border-amber-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  role === 'student'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'
                }`}
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('educator')}
                className={`py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  role === 'educator'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'
                }`}
              >
                👨‍🏫 Educator
              </button>
            </div>
          </div>

          {/* Wallet Address Status / Connect Button */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Connected Wallet
            </label>
            {activeWallet ? (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-gray-800/80 rounded-xl border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono break-all">
                <span>{activeWallet}</span>
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 shrink-0">
                  Connected
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                Connect MetaMask Wallet
              </button>
            )}
          </div>

          {/* Details Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Your Username / Display Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'educator' ? 'e.g., Professor John' : 'e.g., Alex Johnson'}
                  className="w-full pl-10 pr-4 py-3 bg-amber-50 dark:bg-gray-800/90 border border-amber-300 dark:border-gray-700 focus:border-amber-500 dark:focus:border-amber-400 rounded-xl text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 text-sm focus:ring-2 focus:ring-amber-200 dark:focus:ring-1 dark:focus:ring-amber-400"
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !activeWallet}
              whileHover={{ scale: activeWallet && !isLoading ? 1.02 : 1 }}
              whileTap={{ scale: activeWallet && !isLoading ? 0.98 : 1 }}
              className={`w-full py-3.5 rounded-xl text-base font-semibold transition-all shadow-lg ${
                !activeWallet
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : isLoading
                  ? 'bg-amber-600/70 text-white cursor-wait'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-amber-500/25'
              }`}
            >
              {isLoading ? 'Saving Details...' : `Save & Continue as ${role === 'educator' ? 'Educator' : 'Student'}`}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;