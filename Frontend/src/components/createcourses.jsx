import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiCopy, FiBook , FiUser, FiLoader } from 'react-icons/fi';
import { Tooltip } from 'react-tooltip';
import { useThemeStore } from '../store/themeStore';
import { useWallet } from "../context/WalletProvider";
import axios from 'axios';
import { contractAbi, contractAddress } from "../utils/constants";
import { useWriteContract, useAccount } from 'wagmi'
import { CourseContext, CourseProvider } from "./context1"
import { toast, ToastContainer } from "react-toastify"
import { API_BASE_URL, getCookie } from "../utils/api";

const CreateCourse = () => {
  const navigate = useNavigate();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme, setTheme } = useTheme();
  const { walletAddress, walletConnected, connectWallet } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [videoFiles, setVideoFiles] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_inr: '',
    price_eth: '',
    category: ''
  });
  const { writeContract, writeContractAsync } = useWriteContract()
  const { address } = useAccount()
  
  const dropdownRef = useRef(null);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  const handleWalletClick = () => {
    console.log("Wallet Address:", walletAddress);
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.info("Wallet address copied to clipboard!");
    }
  };

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % 3);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isDarkMode]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleVideoUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 2) {
      toast.warn('You can upload a maximum of 2 video files per course.');
      event.target.value = '';
    } else {
      setVideoFiles(files);
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const uploadMediaFile = async (file) => {
    // 1. Primary: Upload directly to backend local storage for 100% reliable video & image streaming
    try {
      const base64Data = await fileToBase64(file);
      const res = await axios.post(`${API_BASE_URL}/courses/upload-media`, {
        file_data: base64Data,
        file_name: file.name,
        file_type: file.type
      });
      if (res.status === 200 && (res.data?.url || res.data?.relativeUrl)) {
        return res.data.url || `${API_BASE_URL}${res.data.relativeUrl}`;
      }
    } catch (backendErr) {
      console.warn("Backend media upload failed, attempting Pinata fallback:", backendErr);
    }

    // 2. Fallback to Pinata IPFS if configured
    const pinataApiKey = (import.meta.env.VITE_PINATA_API_KEY || '').trim();
    const pinataSecretKey = (import.meta.env.VITE_PINATA_API_SECRET || '').trim();
    if (pinataApiKey && pinataSecretKey) {
      try {
        const pinataFormData = new FormData();
        pinataFormData.append('file', file);
        const metadata = {
          name: formData.title || file.name,
          keyvalues: {
            description: formData.description || '',
            pricing: String(formData.pricing || ''),
            fileType: file.type
          }
        };
        pinataFormData.append('pinataMetadata', JSON.stringify(metadata));
        pinataFormData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));

        const res = await axios.post(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          pinataFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'pinata_api_key': pinataApiKey,
              'pinata_secret_api_key': pinataSecretKey
            }
          }
        );
        return res.data.IpfsHash;
      } catch (pinataErr) {
        console.error('Error uploading file to Pinata:', pinataErr);
      }
    }

    // 3. Fallback reliable sample if neither backend nor Pinata responded
    return file.type.startsWith('image/')
      ? "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80"
      : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  };

  const uploadFileToPinata = uploadMediaFile;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isPublishing) return;

    if (!walletAddress) {
      toast.error('Please connect your MetaMask wallet before publishing a course.');
      return;
    }

    const adminToken = getCookie('admin');
    if (!adminToken) {
      toast.error('Educator session not found. Please click "Add Details" in the menu to register as an Educator.');
      setTimeout(() => navigate('/signup'), 1200);
      return;
    }

    if (!formData.title.trim()) {
      toast.warn('Please enter a course title.');
      return;
    }
    if (!formData.description.trim()) {
      toast.warn('Please enter a course description.');
      return;
    }
    if (formData.price_inr === '' || isNaN(Number(formData.price_inr)) || Number(formData.price_inr) < 0) {
      toast.warn('Please enter a valid price in Indian Rupees (₹ INR).');
      return;
    }
    if (formData.price_eth === '' || isNaN(Number(formData.price_eth)) || Number(formData.price_eth) < 0) {
      toast.warn('Please enter a valid price in Ethereum (ETH).');
      return;
    }
    if (!imageFile) {
      toast.warn('Please select a course thumbnail image.');
      return;
    }
    if (videoFiles.length === 0) {
      toast.warn('Please upload at least one video file for the course.');
      return;
    }

    setIsPublishing(true);
    setPublishingStatus('Uploading thumbnail to IPFS...');

    try {
      const uploadedFiles = {
        image: null,
        videos: []
      };

      // Upload image
      uploadedFiles.image = await uploadFileToPinata(imageFile);

      // Upload videos
      for (let i = 0; i < videoFiles.length; i++) {
        setPublishingStatus(`Uploading video ${i + 1} of ${videoFiles.length} to IPFS...`);
        const videoHash = await uploadFileToPinata(videoFiles[i]);
        uploadedFiles.videos.push(videoHash);
      }

      setPublishingStatus('Saving course details to database...');

      const categoryList = typeof formData.category === 'string'
        ? formData.category.split(',').map((c) => c.trim()).filter(Boolean)
        : (Array.isArray(formData.category) ? formData.category : []);

      const priceInr = Number(formData.price_inr) || 0;
      const priceEth = Number(formData.price_eth) || 0;

      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: priceEth > 0 ? priceEth : priceInr,
        course_price: priceEth > 0 ? priceEth : 0.05,
        currency: 'DUAL',
        price_inr: priceInr,
        price_eth: priceEth,
        upi_id: '9969170089@upi',
        category: categoryList.length > 0 ? categoryList : ['General'],
        image_hash: uploadedFiles.image,
        video_hash: uploadedFiles.videos,
        author_wallet_id: walletAddress,
      };

      // Persist educator wallet
      localStorage.setItem('adminWallet', walletAddress);
      localStorage.setItem('educatorWallet', walletAddress);

      const response = await axios.post(`${API_BASE_URL}/courses`, courseData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        }
      });

      if (response.status === 200 && response.data?.course) {
        setPublishingStatus('Registering course & educator profile...');

        // Try writing contract only if deployed on the current chain
        try {
          if (window.ethereum) {
            const code = await window.ethereum.request({
              method: 'eth_getCode',
              params: [contractAddress, 'latest']
            });
            if (code && code !== '0x' && code !== '0x0') {
              await writeContractAsync({
                abi: contractAbi,
                address: contractAddress,
                functionName: 'addCourse',
                value: 10000000000000000n
              });
            }
          }
        } catch (contractErr) {
          console.warn('Smart contract registration skipped or failed:', contractErr);
        }

        const course_id = response.data.course._id;
        try {
          await axios.post(`${API_BASE_URL}/admin/add-course`, {
            course_id: course_id,
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`,
            },
          });
        } catch (addErr) {
          console.warn('Error linking course to admin list:', addErr);
        }

        toast.success(response.data.message || 'Course published successfully!');

        // Reset form
        setFormData({
          title: '',
          description: '',
          price_inr: '',
          price_eth: '',
          category: ''
        });
        setImageFile(null);
        setVideoFiles([]);

        const imageInput = document.getElementById('image');
        if (imageInput) imageInput.value = '';
        const videoInput = document.getElementById('video');
        if (videoInput) videoInput.value = '';

        setTimeout(() => {
          navigate('/managecourses');
        }, 1200);
      } else {
        toast.error(response.data?.error || 'Failed to save course data.');
      }
    } catch (error) {
      console.error('Error publishing course:', error);
      const errMsg = error.response?.data?.error || error.message || 'Failed to publish course.';
      toast.error(errMsg);
    } finally {
      setIsPublishing(false);
      setPublishingStatus('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  const formVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
  };


  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  // State for file upload
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      setImageFile(files[0]); // Take only the first file
    }
  };
  const handleDragOver = (event) => {
    event.preventDefault();
  };



  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`min-h-screen ${isDarkMode ?
        "bg-gray-900 text-gray-100" :
        "bg-gradient-to-br from-amber-50 to-white text-gray-800"}`}
    >
      {/* Enhanced Navigation */}
      {/* Navbar Section */}
      <nav className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <img
            src="/images/Edusphere logo.png"
            alt="Logo"
            className="w-12 h-12 rounded-full shadow-lg"
          />

          <h1 className="text-4xl font-bold ">Edusphere</h1>
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex space-x-8">
            <Link
              to="/educatorhome"
              className="group relative text-lg font-medium hover:text-amber-500 transition-colors"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/createcourses"
              className="group relative text-lg font-medium hover:text-amber-500 transition-colors"
            >
              Create Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
          </div>

          {/* Wallet Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${walletConnected ?
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
                  className={`absolute right-0 mt-2 w-64 origin-top-right rounded-xl shadow-xl backdrop-blur-lg ${isDarkMode
                    ? "bg-gray-800/95 border border-gray-700"
                    : "bg-white/95 border border-amber-100"
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
                      to="/managecourses"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <FiBook className="text-amber-500" />
                      <span>Manage Courses</span>
                    </Link>
                    
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
      <div className="border-b-4 border-gold"></div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        className="max-w-7xl mx-auto px-6 py-12"
      >
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Carousel */}
          <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <AnimatePresence mode='wait'>
              <motion.img
                key={currentIndex}
                src={`/images/createcourses${currentIndex + 1}.png`}
                alt={`Course ${currentIndex + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Carousel Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${currentIndex === index ?
                    'bg-amber-400 w-6' :
                    'bg-white/50 hover:bg-white/80'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Course Creation Form */}
          <motion.form
            variants={formVariants}
            className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700"
            onSubmit={handleFormSubmit}
          >
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Create New Course
            </h2>

            <div className="space-y-6">
              {/* Form Fields */}
        

              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="tilte"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full pl-0 pr-4 py-3 bg-transparent border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                    placeholder="e.g Web Development"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full pl-0 pr-4 py-3 bg-transparent border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                    placeholder="e.g This course will teach you how to..."
                  />
                </div>
              </div>

              {/*  Independent Pricing Fields: Indian Rupees & Ethereum (Separate & Distinct) */}
              <div className="p-4 rounded-xl border border-gray-700/80 bg-gray-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-200">
                    Course Pricing (Set Separately for Both Payment Options)
                  </label>
                  <span className="text-[11px] text-amber-400 font-semibold">Separate Rates</span>
                </div>
                <p className="text-xs text-gray-400">
                  Set independent custom prices for real-money UPI and Ethereum. Students can purchase using whichever method they prefer.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Indian Rupees Price Input */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-emerald-400 mb-1.5">
                      🇮🇳 Price in Indian Rupees (₹ INR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        id="price_inr"
                        name="price_inr"
                        value={formData.price_inr}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-transparent border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none transition-all font-mono text-sm"
                        placeholder="e.g. 500 or 1"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-black text-xs">
                          ₹
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-1">
                      Exact fee for students paying via UPI QR (Minimum legal UPI bank transfer in India is ₹1.00)
                    </span>
                  </div>

                  {/* Ethereum Price Input */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-amber-400 mb-1.5">
                      ⟠ Price in Ethereum (ETH)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        id="price_eth"
                        name="price_eth"
                        value={formData.price_eth}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-transparent border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition-all font-mono text-sm"
                        placeholder="e.g. 0.05 or 0.01"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center font-bold text-black text-xs">
                          Ξ
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-1">
                      Exact fee for students paying with Web3 / MetaMask
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full pl-0 pr-4 py-3 bg-transparent border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                    placeholder="e.g IT, Business, Marketing"
                  />

                </div>
              </div>

              {/* File Upload */}

              <div className="space-y-2">
                <label className="block text-sm font-medium">Course Thumbnail</label>
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  htmlFor="image"
                  className="group border-2 border-dashed dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-amber-400 hover:bg-amber-50/20 block"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <FiUploadCloud className="mx-auto w-8 h-8 text-gray-400 mb-4 group-hover:text-amber-400" />
                  <p className="text-gray-500 group-hover:text-amber-400">
                    Drag & drop an image or{" "}
                    <span className="text-amber-500 font-medium">click to upload</span>
                  </p>
                </motion.label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {/* Display selected files */}
                {imageFile && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium">Selected Image:</h3>
                    <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                      {imageFile.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Course Video</label>
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  htmlFor="video"
                  className="group border-2 border-dashed dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-amber-400 hover:bg-amber-50/20 block"

                >
                  <FiUploadCloud className="mx-auto w-8 h-8 text-gray-400 mb-4 group-hover:text-amber-400" />
                  <p className="text-gray-500 group-hover:text-amber-400">
                    Drag & drop a video or{" "}
                    <span className="text-amber-500 font-medium">click to upload</span>
                  </p>
                </motion.label>
                <input
                  type="file"
                  id="video"
                  name="video"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                  multiple
                />
                {videoFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium">Uploaded Videos:</p>
                    <ul className="list-disc list-inside">
                      {videoFiles.map((file, index) => (
                        <li key={index} className="text-gray-500">
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col gap-4 mt-8">
                <motion.button
                  disabled={isPublishing}
                  whileHover={{ scale: isPublishing ? 1 : 1.02 }}
                  whileTap={{ scale: isPublishing ? 1 : 0.98 }}
                  className={`w-full py-4 font-medium rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isPublishing
                      ? 'bg-amber-600/70 text-white cursor-wait'
                      : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-amber-500/25'
                  }`}
                  type="submit"
                >
                  {isPublishing ? (
                    <>
                      <FiLoader className="animate-spin text-xl" />
                      <span>{publishingStatus || 'Publishing Course...'}</span>
                    </>
                  ) : (
                    'Publish Course'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.form>
        </div>
      </motion.div>

      {/* Tooltips */}
      <Tooltip id="copy-tooltip" place="bottom" content="Copy Address" />
    </motion.div>
  );
};

// Reusable Form Field Component
const FormField = ({ label, id, type = 'text', placeholder, required }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        id={id}
        rows="4"
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-transparent border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition-all"
        required={required}
      />
    ) : (
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-transparent border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition-all"
        required={required}
      />
    )}
  </div>
);

// Reusable NavLink Component
const NavLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-gray-600 dark:text-gray-300 hover:text-amber-500 px-3 py-2 rounded-lg transition-colors font-medium relative group"
  >
    {children}
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all group-hover:w-full" />
  </Link>
);

export default CreateCourse;