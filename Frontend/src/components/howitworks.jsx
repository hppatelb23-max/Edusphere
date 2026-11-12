import { motion } from 'framer-motion';
import {
  FiLock,
  FiShield,
  FiDatabase,
  FiDollarSign,
  FiCloud,
  FiAward,
  FiGithub,
  FiLinkedin,
  FiCode,
  FiCpu,
  FiServer,
  FiLayout,
  FiArrowLeft,
  FiBookOpen
} from 'react-icons/fi';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { useTheme } from 'next-themes';

const HowItWorks = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const setIsDarkMode = useThemeStore((state) => state.setIsDarkMode);
  const { setTheme } = useTheme();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (setTheme) {
      setTheme(isDarkMode ? 'light' : 'dark');
    }
  };

  const features = [
    {
      icon: <FiLock className="w-8 h-8" />,
      title: "Decentralized Ownership",
      content: "Your purchased courses are stored permanently on the blockchain. Even if administrators remove a course, your access remains intact through smart contracts.",
      animation: "https://lottie.host/5603972b-ac23-48b5-84d9-19ac7ed462a3/FIokjQbPsW.lottie",
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Immutable Credentials",
      content: "All certifications and achievements are permanently recorded on-chain, creating tamper-proof academic records recognized globally.",
      animation: "https://lottie.host/c35cafd9-47c8-40d1-b8da-b1ec5f438ce8/BOkx6yNfDC.lottie",
    },
    {
      icon: <FiDatabase className="w-8 h-8" />,
      title: "Blockchain Backend",
      content: "Leveraging Ethereum smart contracts for enrollments and Hyperledger Fabric for secure academic records storage.",
      animation: "https://lottie.host/35b0410c-5260-4043-982f-3abc2d505971/DgMX7iJaVi.lottie",
    }
  ];

  const steps = [
    {
      title: "1. Earn EdusTokens",
      content: "Complete courses and challenges to earn our native EdusTokens (EDU)",
      icon: <FiDollarSign className="w-6 h-6" />
    },
    {
      title: "2. Decentralized Storage",
      content: "Course content secured on IPFS with blockchain-based access control",
      icon: <FiCloud className="w-6 h-6" />
    },
    {
      title: "3. Lifetime Access",
      content: "Your educational achievements permanently stored on-chain",
      icon: <FiAward className="w-6 h-6" />
    }
  ];

  // Team Members
  const teamMembers = [
    {
      name: "Kavya Shah",
      role: "Blockchain Development",
      roleIcon: <FiCpu className="w-4 h-4 text-amber-400" />,
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-400/40",
      image: "/images/kavyaimage.jpg",
      college: "VJTI Mumbai",
      branch: "Computer Engineering",
      description: "Architecting Ethereum smart contracts, token standards, wallet integration, and immutable on-chain credential storage.",
      github: "https://github.com/KavyaShah1105",
      linkedin: "https://linkedin.com"
    },
    {
      name: "Pranit Mehta",
      role: "Frontend Development",
      roleIcon: <FiLayout className="w-4 h-4 text-cyan-400" />,
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-400/40",
      image: "/images/Pranit.jpeg",
      college: "VJTI Mumbai",
      branch: "Computer Engineering",
      description: "Crafting fluid, accessible user interfaces, Web3 state interactions, responsive layouts, and interactive animations.",
      github: "https://github.com/KaranShah1911",
      linkedin: "https://linkedin.com"
    },
    {
      name: "Hitanshu Patel",
      role: "Frontend Development",
      roleIcon: <FiCode className="w-4 h-4 text-emerald-400" />,
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-400/40",
      image: "/images/Hitanshu.jpeg",
      college: "VJTI Mumbai",
      branch: "Computer Engineering",
      description: "Building the proctored test facility engine, educator portals, anti-cheat mechanisms, and sleek theme experiences.",
      github: "https://github.com/DARSHITSHAH-2906",
      linkedin: "https://www.linkedin.com/in/darshit-shah-513153318/"
    },
    {
      name: "Harsh Pimple",
      role: "Backend Development",
      roleIcon: <FiServer className="w-4 h-4 text-purple-400" />,
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-400/40",
      image: "/images/harshimage.jpg",
      college: "VJTI Mumbai",
      branch: "Computer Engineering",
      description: "Engineering scalable Express REST APIs, MongoDB schemas, grading logic, and secure authentication workflows.",
      github: "https://github.com/harshp1321",
      linkedin: "https://linkedin.com"
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 
      "bg-gradient-to-br from-gray-900 via-gray-900 to-black text-gray-100" : 
      "bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900"
    } transition-colors duration-300`}>
      {/* Top Navbar */}
      <nav className="flex justify-between items-center p-6 border-b border-amber-500/20 backdrop-blur-md sticky top-0 z-40 bg-opacity-80">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
          <img
            src="/images/Edusphere logo.png"
            alt="Logo"
            className="w-12 h-12 rounded-full shadow-lg border border-amber-400/40"
          />
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            Edusphere
          </h1>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-8">
            <Link to="/studenthome" className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/courses" className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/tests" className="group relative text-lg font-medium hover:text-amber-400 transition-colors">
              Tests
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/howitworks" className="group relative text-lg font-semibold text-amber-400">
              How It Works
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400"></span>
            </Link>
          </div>

          {/* Theme toggle */}
          <button
            className="text-2xl p-2 rounded-full hover:bg-amber-500/10 transition-colors"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-amber-400/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black transition-all"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </nav>
      
      <div className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/30 mb-4">
            <FiShield className="w-3.5 h-3.5" />
            Decentralized Education Architecture
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent mb-4">
            How Edusphere Works
          </h1>
          <p className={`text-base md:text-lg max-w-2xl mx-auto ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Empowering students and educators with Web3 ownership, zero-gas assessments, immutable certifications, and decentralized IPFS storage.
          </p>
        </motion.div>

        {/* Core Features Section */}
        <div className="space-y-28 mb-28">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col lg:flex-row items-center gap-12 even:lg:flex-row-reverse">
              <motion.div 
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex-1"
              >
                <DotLottieReact
                  src={feature.animation}
                  loop
                  autoplay
                  className="w-full h-96"
                />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex-1 space-y-6"
              >
                <div className={`inline-flex items-center gap-3 p-4 rounded-xl ${
                  isDarkMode ? "bg-gray-800" : "bg-amber-100"
                }`}>
                  {feature.icon}
                  <h3 className="text-3xl font-bold">{feature.title}</h3>
                </div>
                <p className="text-xl leading-relaxed opacity-90">
                  {feature.content}
                </p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Blockchain Architecture Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mb-28 p-8 md:p-12 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xl"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-4">Blockchain Architecture</h2>
          <p className="text-white/90 mb-8 max-w-2xl">
            A hybrid multi-layer Web3 structure combining public Ethereum smart contracts, IPFS distributed storage, and MetaMask identity validation.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <h3 className="text-2xl font-bold mb-3">Smart Contracts</h3>
              <p className="text-sm text-white/90 leading-relaxed">
                Course enrollment, token transactions, and identity proofs managed securely through Solidity contracts.
              </p>
            </div>
            <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <h3 className="text-2xl font-bold mb-3">IPFS Storage</h3>
              <p className="text-sm text-white/90 leading-relaxed">
                Decentralized multimedia content storage with access control permissions immutably recorded on-chain.
              </p>
            </div>
            <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <h3 className="text-2xl font-bold mb-3">Hyperledger Fabric</h3>
              <p className="text-sm text-white/90 leading-relaxed">
                Permissioned enterprise framework for tamper-proof academic transcripts and student performance tracking.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-28">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`p-8 rounded-2xl border ${
                isDarkMode ? "bg-gray-800/80 border-gray-700" : "bg-white border-amber-200"
              } shadow-xl`}
            >
              <div className="inline-block p-4 mb-4 rounded-xl bg-amber-500/20 text-amber-500">
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
              <p className="opacity-90 text-sm leading-relaxed">{step.content}</p>
            </motion.div>
          ))}
        </div>

        {/* ============================================================== */}
        {/* MEET THE TEAM SECTION                                          */}
        {/* ============================================================== */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-28"
        >
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/30 mb-4">
              <FiAward className="w-3.5 h-3.5" />
              The Builders
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Meet Our <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Core Team</span>
            </h2>
            <p className={`text-base md:text-lg max-w-2xl mx-auto ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              The engineers behind Edusphere developing the smart contracts, frontend assessment engines, and backend APIs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12 }}
                whileHover={{ y: -8 }}
                className={`rounded-3xl p-6 border flex flex-col justify-between transition-all duration-300 ${
                  isDarkMode
                    ? "bg-gradient-to-b from-gray-800/90 to-gray-900/90 border-gray-700/80 hover:border-amber-400/60 shadow-xl hover:shadow-amber-500/10"
                    : "bg-white border-amber-200 hover:border-amber-400 shadow-lg hover:shadow-xl hover:shadow-amber-400/15"
                }`}
              >
                <div>
                  {/* Photo with Frame */}
                  <div className="relative mb-6 mx-auto w-36 h-36 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-400 shadow-md">
                    <img
                      src={member.image}
                      alt={member.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/Edusphere logo.png";
                      }}
                      className="w-full h-full object-cover object-center rounded-xl transition-transform duration-300 hover:scale-105"
                    />
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-black text-center mb-1 hover:text-amber-400 transition-colors">
                    {member.name}
                  </h3>

                  {/* College & Branch */}
                  <div className="text-center text-xs text-gray-400 mb-3">
                    <span>{member.college}</span> • <span>{member.branch}</span>
                  </div>

                  {/* Role Badge */}
                  <div className="flex justify-center mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${member.badgeColor}`}
                    >
                      {member.roleIcon}
                      <span>{member.role}</span>
                    </span>
                  </div>

                  {/* Description of work */}
                  <p className={`text-xs text-center leading-relaxed mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {member.description}
                  </p>
                </div>

                {/* Social Links */}
                <div className="pt-4 border-t border-gray-700/30 flex items-center justify-center gap-4">
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                      title="GitHub Profile"
                    >
                      <FiGithub className="w-4 h-4" />
                    </a>
                  )}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                      title="LinkedIn Profile"
                    >
                      <FiLinkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Unique Selling Points */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl font-bold mb-8">Why Choose Edusphere?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className={`p-8 rounded-2xl border ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-amber-50 border-amber-200"
            }`}>
              <h3 className="text-2xl font-bold mb-4">True Ownership</h3>
              <p className="text-sm leading-relaxed opacity-90">
                Your courses remain accessible even if removed from the platform, through blockchain-stored access rights.
              </p>
            </div>
            <div className={`p-8 rounded-2xl border ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-amber-50 border-amber-200"
            }`}>
              <h3 className="text-2xl font-bold mb-4">Secure Verification</h3>
              <p className="text-sm leading-relaxed opacity-90">
                Employers and recruiters can instantly verify student credentials and test scores through our blockchain explorer.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <div className="text-center">
          <Link
            to="/tests"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-xl shadow-amber-400/25 transition-all"
          >
            <FiBookOpen className="w-5 h-5" />
            <span>Explore Test Facility</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
