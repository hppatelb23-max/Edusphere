import React, { useState, useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTheme } from "next-themes";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from "framer-motion";
import { useThemeStore } from "../store/themeStore";
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { useWallet } from "../context/WalletProvider";

const sections = [
  {
    id: "section1",
    src: "https://lottie.host/35b0410c-5260-4043-982f-3abc2d505971/DgMX7iJaVi.lottie",
    title: "Empowering Educators",
    description:
      "Revolutionizing the education landscape with blockchain technology.",
    direction: "left",
  },
  {
    id: "section2",
    src: "https://lottie.host/5603972b-ac23-48b5-84d9-19ac7ed462a3/FIokjQbPsW.lottie",
    title: "Student Ownership",
    description: "Providing students full control over their educational data.",
    direction: "right",
  },
  {
    id: "section3",
    src: "https://lottie.host/c35cafd9-47c8-40d1-b8da-b1ec5f438ce8/BOkx6yNfDC.lottie",
    title: "Secure & Transparent",
    description: "Ensuring security and transparency in learning transactions.",
    direction: "left",
  },
];

const Edusphere = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { theme, setTheme } = useTheme();
  const [isVisible, setIsVisible] = useState({});
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);
  const [navScroll, setNavScroll] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { disconnectWallet } = useWallet();

  // Whenever user arrives directly at the starting home screen, automatically disconnect the wallet
  useEffect(() => {
    if (disconnectWallet) {
      disconnectWallet({ silent: true });
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("walletConnected");
    }
  }, [location.pathname]);

  const handleStartLearning = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (disconnectWallet) {
      disconnectWallet();
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("walletConnected");
    }
    navigate("/role-selection");
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    setNavScroll(latest > 100);
  });

  // Floating animation for hero lottie
  const floatingAnim = {
    y: [0, -20, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  // Staggered animation for team cards
  const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: "backOut"
      }
    })
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(isDarkMode ? "light" : "dark");
  };

  useEffect(() => {
    const handleScroll = () => {
      const updatedVisibility = {};
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          updatedVisibility[section.id] =
            rect.top <= window.innerHeight && rect.bottom >= 0;
        }
      });
      setIsVisible(updatedVisibility);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check visibility on page load
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const contacts = [
    {
      name: "Pranit Mehta",
      college: "VJTI",
      branch: "Computer Engineering",
      contribution: "Frontend Development",
      image: "/images/Pranit.jpeg",
      github: 'https://github.com/KaranShah1911',
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com',
      description: 'A passionate developer with expertise in Frontend Development.',
      imagePosition: 'object-center'
    },
    {
      name: "Harsh Pimple",
      college: "VJTI",
      branch: "Computer Engineering",
      contribution: "Backend Developer",
      image: "/images/harshimage.jpg",
      github: 'https://github.com/harshp1321',
      linkedin: 'https://linkedin.com/in/johndoe',
      instagram: 'https://instagram.com/johndoe',
      description: 'A passionate developer with expertise in Backend.'
    },
    {
      name: "Hitanshu Patel",
      college: "VJTI",
      branch: "Computer Engineering",
      contribution: "Frontend Developer",
      image: "/images/Hitanshu.jpeg",
      github: 'https://github.com/DARSHITSHAH-2906',
      linkedin: 'https://www.linkedin.com/in/darshit-shah-513153318/',
      instagram: 'https://www.instagram.com/_.29darshit06._/#',
      description: 'A passionate developer with enthusiasm in Frontend development and learning new technologies.'
    },
    {
      name: "Kavya Shah",
      college: "VJTI",
      branch: "Computer Engineering",
      contribution: "Blockchain Development",
      image: "/images/2B8A4005.JPG",
      github: 'https://github.com/KavyaShah1105',
      linkedin: 'https://linkedin.com/in/johndoe',
      instagram: 'https://instagram.com/johndoe',
      description: 'A passionate developer with expertise in Blockchain.'
    },
  ];

  // ... existing state and effects

  return (
    <div className="overflow-x-hidden">
      <div
        className={`relative min-h-screen ${isDarkMode
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
            : "bg-gradient-to-br from-blue-50 via-amber-50 to-blue-50"
          } 
        transition-all duration-500`}
      >
        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full blur-3xl opacity-30"
          style={{ y: y1 }}
        />
        <motion.div
          className="absolute top-1/2 right-0 w-64 h-64 bg-gradient-to-l from-purple-400 to-blue-300 rounded-full blur-3xl opacity-30"
          style={{ y: y2 }}
        />


        {/* Enhanced Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-amber-400/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, 100, 0],
                x: [0, 50, 0],
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
        {/* Enhanced Navbar */}
        <motion.nav
          className={`sticky top-0 z-50 transition-all duration-300 ${navScroll ? "backdrop-blur-xl bg-white/5 shadow-lg" : "backdrop-blur-md"
            }`}
          animate={{
            borderBottomWidth: navScroll ? 1 : 0,
            borderColor: "rgba(245, 158, 11, 0.1)"
          }}
        >
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <img
                src="/images/Edusphere logo.png"
                alt="Logo"
                className="w-20 h-12 rounded-full shadow-lg"
              />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
                Edusphere
              </h1>
            </motion.div>

            <div className="flex items-center gap-6">
              <Link
                to="/Edusphere"
                className={`group relative text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"
                  } hover:text-amber-300 transition-colors`}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-300 group-hover:w-full transition-all duration-300"></span>
              </Link>

              <Link
                className={`group relative text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"
                  } hover:text-amber-300 transition-colors`}
                onClick={() => {
                  const element = document.getElementById("features");
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-300 group-hover:w-full transition-all duration-300"></span>
              </Link>

              <button
                onClick={handleStartLearning}
                className={`group relative text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"
                  } hover:text-amber-300 transition-colors cursor-pointer`}
              >
                Get Started
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-300 group-hover:w-full transition-all duration-300"></span>
              </button>

              <motion.button
                whileHover={{ rotate: 15 }}
                className="text-3xl p-2 rounded-full bg-opacity-20 backdrop-blur-sm"
                onClick={toggleTheme}
              >
                {isDarkMode ? "🌙" : "☀️"}
              </motion.button>
            </div>
          </div>
        </motion.nav>
        <div className="border-b-4 border-amber-300"></div>

        {/* Hero Section */}
        <section className="relative pt-32 pb-48">
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(${isDarkMode ? '#f59e0b' : '#3b82f6'} 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-1/2 relative z-10"
            >
              <h1 className="text-7xl font-bold mb-8 leading-tight">
                <motion.span
                  className="bg-gradient-to-r ml-12 from-amber-500 to-amber-300 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Revolutionizing
                </motion.span>
                <motion.br
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                />
                <motion.span
                  className="text-5xl ml-12 bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent"
                  initial={{ x: -50 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Education Ecosystem
                </motion.span>
              </h1>
              <p
                className={`text-xl ml-12 mb-8 opacity-90 ${isDarkMode ? "text-gray-300" : "text-gray-900"
                  }`}
              >
                Empowering learners and educators with decentralized, secure,
                and transparent educational experiences.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} className="inline-block">
                <button
                  onClick={handleStartLearning}
                  className="px-8 py-4 ml-12 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                  Start Learning Now
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              className="lg:w-1/2 relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                className="absolute -inset-8 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-3xl blur-2xl opacity-30"
                animate={floatingAnim}
              />
              <DotLottieReact
                src="https://lottie.host/2fa8ee19-3348-4358-92c0-c3331ca12c20/BbbdUxJoOR.lottie"
                loop
                autoplay
                className="relative z-10 transform hover:scale-105 transition-transform"
              />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24">
          <section className="py-36 relative">
            <div className="container mx-auto px-6">
              <h2 className="text-4xl font-bold text-center mb-20">
                <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  Why Choose Edusphere?
                </span>
              </h2>

              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial="offscreen"
                  whileInView="onscreen"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={{
                    offscreen: { opacity: 0, y: 100 },
                    onscreen: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        bounce: 0.4,
                        duration: 1
                      }
                    }
                  }}
                  className={`flex flex-col ${index % 2 ? 'lg:flex-row-reverse' : 'lg:flex-row'} 
                  items-center gap-16 mb-48`}
                >
                  <div className="lg:w-1/2 relative group perspective-1000">
                    <motion.div
                      className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-3xl blur-xl opacity-30 
                      group-hover:opacity-50 transition-opacity"
                      whileHover={{ rotateY: 5, rotateX: 5 }}
                    />
                    <DotLottieReact
                      src={section.src}
                      loop
                      autoplay
                      className="w-full h-96 rounded-2xl transform group-hover:scale-[1.02] transition-transform"
                    />
                  </div>

                  <div className="lg:w-1/2 space-y-6">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                      {section.title}
                    </h3>
                    <p
                      className={`text-xl opacity-90 leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                    >
                      {section.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </section>
        <div className="border-b-4 border-amber-300"></div>

        {/* <!-- Achievement Cards Section --> */}
        <section class={`bg-gray-800 py-16 ${isDarkMode ? "bg-gray-800" : "bg-gradient-to-br from-blue-50 via-amber-50 to-blue-50"}`}>
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* <!-- Courses Card --> */}
              <motion.div class="bg-gray-200 rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg hover:bg-amber-500">
                <div class="p-8 text-center">
                  <div class="flex justify-center">
                    <i class="fas fa-book-open text-4xl text-blue-600 mb-4"></i>
                  </div>
                  <h3 class="text-3xl font-bold text-gray-900 mb-2">100+ Courses</h3>
                  <p class="text-gray-600">Explore diverse subjects and skills</p>
                </div>
              </motion.div>

              {/* <!-- Students Card --> */}
              <div class="bg-gray-200 rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg">
                <div class="p-8 text-center">
                  <div class="flex justify-center">
                    <i class="fas fa-users text-4xl text-green-600 mb-4"></i>
                  </div>
                  <h3 class="text-3xl font-bold text-gray-900 mb-2">50,000+ Students</h3>
                  <p class="text-gray-600">Join our global learning community</p>
                </div>
              </div>

              {/* <!-- Experience Card --> */}
              <div class="bg-gray-200 rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-lg">
                <div class="p-8 text-center">
                  <div class="flex justify-center">
                    <i class="fas fa-clock text-4xl text-red-600 mb-4"></i>
                  </div>
                  <h3 class="text-3xl font-bold text-gray-900 mb-2">15+ Years</h3>
                  <p class="text-gray-600">Of educational excellence</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- Include Font Awesome for icons --> */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></link>

        <div className="border-b-4 border-amber-300 mt-8"></div>

        <section className="py-20 relative">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-20">
              <span className="bg-gradient-to-r  from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Meet Our Team
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 ">
              {contacts.map((contact, index) => (
                <motion.div
                  key={index}
                  className="relative h-[500px] cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-300 p-1 rounded-3xl shadow-2xl">
                    <div className={`h-full rounded-2xl p-6 flex flex-col items-center ${isDarkMode ? "bg-gradient-to-r from-gray-600 via-gray-600 to-gray-600 text-black" : "bg-gray-200"}`}>
                      <div className="w-full h-[1000px] rounded-2xl overflow-hidden relative flex justify-center items-center">
                        <img
                          src={contact.image}
                          alt={contact.name}
                          className={`w-80 h-full ${contact.imagePosition || "object-top"} object-cover rounded-4xl`}
                          style={{ objectPosition: contact.imagePosition === "object-center" ? "center" : undefined }}
                        />
                      </div>
                      <h3 className="text-2xl text-black font-bold mb-2">{contact.name}</h3>
                      <div className="space-y-1 text-black text-x dark:text-gray-300">
                        <p>
                          <span className="font-bold text-black">College:</span> {contact.college}
                        </p>
                        <p>
                          <span className="font-bold text-black">Branch:</span> {contact.branch}
                        </p>
                        <p>
                          <span className="font-bold text-black">contribution:</span> {contact.contribution}
                        </p>
                      </div>
                      {/* Social Media Icons */}
                      <div className="flex space-x-4 mt-4">
                        {contact.github && (
                          <a href={contact.github} target="_blank" rel="noopener noreferrer">
                            <FaGithub className="text-xl text-black dark:text-gray-300 hover:text-gray-800" />
                          </a>
                        )}
                        {contact.linkedin && (
                          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                            <FaLinkedin className="text-xl text-black dark:text-gray-300 hover:text-gray-800" />
                          </a>
                        )}
                        {contact.instagram && (
                          <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
                            <FaInstagram className="text-xl text-black dark:text-gray-300 hover:text-gray-800" />
                          </a>
                        )}
                      </div>
                      {/* <motion.div whileHover={{ scale: 1.05 }} className="inline-block">
                <button
                  to="/role-selection"
                  className="px-2 py-2 mt-4 bg-gradient-to-r from-red-600 to-red-600 rounded-full text-white  shadow-lg hover:shadow-xl transition-shadow"
                >
                  Read More
                </button>
              </motion.div> */}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* MODAL FOR ENLARGED CARD */}
            <AnimatePresence>
              {selectedContact && (
                <motion.div
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedContact(null)}
                >
                  <motion.div
                    className="bg-gradient-to-r from-slate-200 to-slate-400 dark:bg-gray-900 p-8 rounded-xl shadow-2xl max-w-md text-center relative"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button
                      className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
                      onClick={() => setSelectedContact(null)}
                    >
                      &times;
                    </button>
                    {/* Enlarged Image */}
                    <div className="w-80 h-80 rounded-full overflow-hidden mx-auto mb-8">
                      <img
                        src={selectedContact.image}
                        alt={selectedContact.name}
                        className={`w-full h-full object-cover ${selectedContact.imagePosition || "object-top"}`}
                        style={{ objectPosition: selectedContact.imagePosition === "object-center" ? "center" : undefined }}
                      />
                    </div>

                    {/* Contact Details */}
                    <h3 className="text-3xl font-bold mb-2">{selectedContact.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">College:</span> {selectedContact.college}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">Branch:</span> {selectedContact.branch}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">contribution:</span> {selectedContact.contribution}
                    </p>

                    {/* Social Media Icons in Modal */}
                    <div className="flex space-x-4 mt-4 justify-center">
                      {selectedContact.github && (
                        <a href={selectedContact.github} target="_blank" rel="noopener noreferrer">
                          <FaGithub className="text-2xl text-gray-600 dark:text-gray-300 hover:text-gray-800" />
                        </a>
                      )}
                      {selectedContact.linkedin && (
                        <a href={selectedContact.linkedin} target="_blank" rel="noopener noreferrer">
                          <FaLinkedin className="text-2xl text-gray-600 dark:text-gray-300 hover:text-gray-800" />
                        </a>
                      )}
                      {selectedContact.instagram && (
                        <a href={selectedContact.instagram} target="_blank" rel="noopener noreferrer">
                          <FaInstagram className="text-2xl text-gray-600 dark:text-gray-300 hover:text-gray-800" />
                        </a>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                      {selectedContact.description}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>


        {/* Footer */}
        <footer className="relative border-t border-amber-900/10 bg-gradient-to-b from-white/5 to-transparent dark:from-black/20">
          <div className="container mx-auto px-6 py-24">
            {/* Floating grid background */}
            <motion.div
              className="absolute inset-0 opacity-10 z-0"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.1 }}
              transition={{ duration: 1 }}
              style={{
                backgroundImage: `linear-gradient(to right, #f59e0b 1px, transparent 1px),
                         linear-gradient(to bottom, #f59e0b 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
              animate={{
                backgroundPosition: [`0% 0%`, `100% 100%`],
              }}

            />

            {/* Main footer content */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              className="relative z-10"
            >
              <div className="flex flex-col md:flex-row justify-between gap-12">
                {/* Logo section */}
                <div className="space-y-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-block"
                  >
                    <img
                      src="/images/Edusphere logo.png"
                      alt="Logo"
                      className="w-24 opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </motion.div>
                  <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Transforming education through decentralized technology
                  </p>

                  {/* Social Links */}
                  <div className="flex space-x-4 mt-4">
                    {['twitter', 'linkedin', 'github'].map((platform) => (
                      <motion.a
                        key={platform}
                        href={`https://github.com/DARSHITSHAH-2906/Inheritance_Edusphere`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-lg ${isDarkMode
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "bg-gray-100 hover:bg-gray-200"
                          }`}
                      >
                        <img
                          src={`/icons/${platform}.png`}  // Dynamically load the image based on platform name
                          alt={platform}
                          className="w-6 h-6"
                        />
                      </motion.a>
                    ))}
                  </div>
                </div>

                {/* Quick Links with animated underlines */}
                <div className="grid grid-cols-2 gap-8 md:gap-16">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold mb-4 text-amber-500">Navigation</h4>
                    {["About", "Features", "Team", "Contact"].map((item) => (
                      <motion.div
                        key={item}
                        whileHover={{ x: 5 }}
                        className="relative"
                      >
                        <a
                          className={`block text-lg ${isDarkMode ? "text-gray-300" : "text-gray-700"
                            } hover:text-amber-400 transition-colors`}
                        >
                          {item}
                          <motion.span
                            className="absolute bottom-0 left-0 w-0 h-px bg-amber-400"
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                          />
                        </a>
                      </motion.div>
                    ))}
                  </div>



                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold mb-4 text-amber-500">Contact</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                        </svg>
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>hello@edusphere.io</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Mumbai, India</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Copyright with animated border */}
              <motion.div
                className="mt-12 pt-8 border-t border-amber-900/10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
              >
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                  <p className="text-amber-500 dark:text-gray-400">
                    © 2025 Edusphere. All rights reserved.
                  </p>
                  <div className="flex space-x-6">
                    <motion.a
                      href="#"
                      whileHover={{ scale: 1.05 }}
                      className="text-gray-500 dark:text-gray-400 hover:text-amber-500"
                    >
                      Privacy Policy
                    </motion.a>
                    <motion.a
                      href="#"
                      whileHover={{ scale: 1.05 }}
                      className="text-gray-500 dark:text-gray-400 hover:text-amber-500"
                    >
                      Terms of Service
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-400/20 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -50, 0],
                    x: [0, (Math.random() - 0.5) * 50, 0],
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.8, 0.2],
                  }}
                  transition={{
                    duration: 5 + Math.random() * 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Back to top button */}
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-4 bg-amber-500/20 backdrop-blur-lg rounded-full shadow-lg hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(245, 158, 11, 0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        </footer>

      </div>
    </div>
  );
};

export default Edusphere;