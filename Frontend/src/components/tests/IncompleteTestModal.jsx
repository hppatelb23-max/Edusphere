import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiClock, FiFileText, FiPlayCircle, FiLock } from 'react-icons/fi';
import { useWallet } from '../../context/WalletProvider';

const IncompleteTestModal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { walletAddress, walletConnected } = useWallet();
  const [pausedTest, setPausedTest] = useState(null);

  const checkPausedTest = () => {
    const role = localStorage.getItem('role') || 'student';
    // Only lock students who have an active incomplete test
    if (role !== 'student') {
      setPausedTest(null);
      return;
    }

    // Do not show modal on initial landing, role-selection, or signup before login
    const pathname = location.pathname;
    if (pathname === '/' || pathname === '/role-selection' || pathname === '/roleselection' || pathname === '/signup') {
      setPausedTest(null);
      return;
    }

    // Only show popup AFTER student connects their wallet AND completes Save & Continue with their username
    const isSessionVerified = Boolean(
      walletConnected &&
      walletAddress &&
      sessionStorage.getItem('session_user_logged_in') &&
      sessionStorage.getItem('session_user_logged_in').toLowerCase() === walletAddress.toLowerCase()
    );

    if (!isSessionVerified) {
      setPausedTest(null);
      return;
    }

    try {
      let record = null;
      const studentName =
        localStorage.getItem('username') ||
        localStorage.getItem('studentName') ||
        localStorage.getItem('name') ||
        '';

      const keyWallet = walletAddress ? `edusphere_paused_test_${walletAddress.toLowerCase()}` : '';
      const keyName = studentName ? `edusphere_paused_test_${studentName.toLowerCase()}` : '';

      const rawWallet = keyWallet ? localStorage.getItem(keyWallet) : null;
      const rawName = keyName ? localStorage.getItem(keyName) : null;
      const rawActive = localStorage.getItem('edusphere_active_paused_test');

      let candidate = rawWallet ? JSON.parse(rawWallet) : (rawName ? JSON.parse(rawName) : (rawActive ? JSON.parse(rawActive) : null));

      // Strictly ensure the paused test belongs to the currently logged in student account
      if (candidate && candidate.is_paused && candidate.test_id) {
        const matchesWallet = candidate.student_wallet_id && candidate.student_wallet_id.toLowerCase() === walletAddress.toLowerCase();
        const matchesName = studentName && candidate.student_name && candidate.student_name.trim().toLowerCase() === studentName.trim().toLowerCase();

        if (matchesWallet || matchesName) {
          record = candidate;
        }
      }

      if (record && record.is_paused && record.test_id) {
        // If student is already actively on the test taking screen for this test, hide modal
        if (pathname === `/tests/${record.test_id}`) {
          setPausedTest(null);
          return;
        }
        setPausedTest(record);
      } else {
        setPausedTest(null);
      }
    } catch (e) {
      setPausedTest(null);
    }
  };

  useEffect(() => {
    checkPausedTest();

    const handleStorageChange = () => {
      checkPausedTest();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('edusphere_test_paused_change', handleStorageChange);

    const interval = setInterval(checkPausedTest, 1200);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('edusphere_test_paused_change', handleStorageChange);
      clearInterval(interval);
    };
  }, [location.pathname, walletAddress, walletConnected]);

  if (!pausedTest) return null;

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '15:00';
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const answeredCount = pausedTest.selectedAnswers ? Object.keys(pausedTest.selectedAnswers).length : 0;
  const totalQuestions = pausedTest.totalQuestions || (pausedTest.questions ? pausedTest.questions.length : 10);

  const handleResumeTest = () => {
    navigate(`/tests/${pausedTest.test_id}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-lg bg-gray-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/20 text-white overflow-hidden"
        >
          {/* Glowing background aura */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative">
              <div className="w-18 h-18 bg-amber-500/20 border-2 border-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <FiLock className="text-3xl text-amber-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            </div>
          </div>

          {/* Heading & Notice */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Complete Your Test First
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
              You have an active assessment in progress that was paused. You must finish and submit your test before you can explore courses or perform other student actions.
            </p>
          </div>

          {/* Paused Test Snapshot Card */}
          <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between text-sm border-b border-gray-700/60 pb-2">
              <span className="text-gray-400 flex items-center gap-1.5">
                <FiFileText className="text-amber-400" /> Assessment:
              </span>
              <span className="font-semibold text-amber-300 truncate max-w-[220px]">
                {pausedTest.test_title || 'Ongoing Assessment'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm border-b border-gray-700/60 pb-2">
              <span className="text-gray-400 flex items-center gap-1.5">
                <FiClock className="text-amber-400" /> Time Remaining:
              </span>
              <span className="font-mono font-bold text-amber-400">
                {formatTime(pausedTest.timeLeft)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-1.5">
                <FiAlertTriangle className="text-amber-400" /> Status:
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⏸️ Paused at Question {(pausedTest.currentIndex || 0) + 1}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResumeTest}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiPlayCircle className="text-xl" />
              Resume & Complete Test Now
            </motion.button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Navigation to other pages is restricted until your assessment is submitted.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IncompleteTestModal;
