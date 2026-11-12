export const dummySampleTests = [
  {
    _id: "test_web3_solidity",
    title: "Web3 & Solidity Smart Contract Mastery",
    description: "Assess your depth in EVM architecture, Solidity syntax, reentrancy guards, ERC token standards, and gas efficiency.",
    author_name: "Dr. Alex Rivera",
    author_wallet_id: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    category: ["Web3", "Solidity", "Ethereum"],
    difficulty: "Intermediate",
    duration_minutes: 15,
    passing_score: 60,
    pick_random_count: 5,
    questions: [
      {
        _id: "q_web3_1",
        question: "Which EVM memory area is persistent between function calls and writes directly to blockchain state?",
        options: ["Memory", "Storage", "Calldata", "Stack"],
        correct_option: 1,
        explanation: "Storage is the persistent key-value store associated with a smart contract on the EVM. Memory and Calldata are temporary."
      },
      {
        _id: "q_web3_2",
        question: "What is the primary vulnerability in a classic reentrancy attack?",
        options: [
          "Using tx.origin instead of msg.sender",
          "Performing an external call before updating the internal contract balance state",
          "Integer overflow when computing reward tokens",
          "Missing visibility specifiers on contract variables"
        ],
        correct_option: 1,
        explanation: "Reentrancy occurs when an external call yields control to an attacker contract before internal balances or flags are updated (Checks-Effects-Interactions violation)."
      },
      {
        _id: "q_web3_3",
        question: "In Solidity 0.8+, what happens automatically upon arithmetic overflow or underflow?",
        options: [
          "The number silently wraps around like standard C integers",
          "The transaction automatically reverts with a Panic(0x11) error",
          "The EVM sets an overflow flag that can only be cleared with SafeMath",
          "The contract self-destructs to preserve state integrity"
        ],
        correct_option: 1,
        explanation: "Solidity 0.8.0 introduced default checked arithmetic. Any overflow or underflow will trigger an automatic revert unless wrapped inside an unchecked { ... } block."
      },
      {
        _id: "q_web3_4",
        question: "Which function visibility modifier allows a function to ONLY be called externally from outside the contract?",
        options: ["public", "private", "external", "internal"],
        correct_option: 2,
        explanation: "Functions marked 'external' can only be called from outside the contract or via 'this.functionName()' within the contract."
      },
      {
        _id: "q_web3_5",
        question: "Which ERC standard defines non-fungible tokens (NFTs) with unique token IDs?",
        options: ["ERC-20", "ERC-721", "ERC-1155", "ERC-4626"],
        correct_option: 1,
        explanation: "ERC-721 is the standard for Non-Fungible Tokens where every token ID represents a unique, non-interchangeable asset."
      },
      {
        _id: "q_web3_6",
        question: "What is the purpose of the 'indexed' keyword in Solidity event declarations?",
        options: [
          "It encrypts the log data so only miners can view it",
          "It places topic hashes into the Bloom filter for rapid off-chain filtering",
          "It ensures the event can be called like an internal function",
          "It forces the event data to be stored permanently in contract storage"
        ],
        correct_option: 1,
        explanation: "Up to 3 parameters in an event can be marked 'indexed', allowing clients and indexers to filter logs efficiently using topics."
      },
      {
        _id: "q_web3_7",
        question: "What is the key advantage of 'immutable' variables over 'constant' variables in Solidity?",
        options: [
          "Immutable variables can be reassigned multiple times during execution",
          "Immutable variables can be assigned once dynamically inside the constructor at deploy time",
          "Immutable variables consume zero deployment bytecode",
          "Immutable variables are stored in contract storage rather than bytecode"
        ],
        correct_option: 1,
        explanation: "'constant' must be fixed at compile time, whereas 'immutable' can be evaluated or assigned dynamically in the constructor and then permanently baked into bytecode."
      },
      {
        _id: "q_web3_8",
        question: "Which opcode is executed when ETH is sent to a contract without calldata, provided it is implemented?",
        options: ["fallback()", "receive()", "default()", "payable()"],
        correct_option: 1,
        explanation: "The 'receive() external payable' function is executed whenever a contract receives plain Ether with empty calldata. If absent, fallback() is called."
      }
    ]
  },
  {
    _id: "test_react_frontend",
    title: "Modern React & Web3 Frontend Engineering",
    description: "Evaluate your understanding of React 19 hooks, state synchronization, Web3 provider integration, and client-side performance.",
    author_name: "Marcus Chen",
    author_wallet_id: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    category: ["Frontend", "React", "JavaScript"],
    difficulty: "Intermediate",
    duration_minutes: 15,
    passing_score: 60,
    pick_random_count: 5,
    questions: [
      {
        _id: "q_react_1",
        question: "In Wagmi v2, which hook is primarily used to invoke state-changing smart contract functions?",
        options: ["useReadContract", "useWriteContract", "useContractCall", "useSignTransaction"],
        correct_option: 1,
        explanation: "useWriteContract (and writeContractAsync) is the standard Wagmi hook to broadcast state-modifying smart contract transactions."
      },
      {
        _id: "q_react_2",
        question: "Why should you avoid mutating React state objects directly (e.g. state.count = 5)?",
        options: [
          "React state objects are frozen by the V8 JavaScript engine",
          "React relies on reference equality to detect changes and trigger efficient re-renders",
          "Direct mutation throws an uncatchable WebAssembly panic",
          "It will cause automatic network requests to synchronize with local storage"
        ],
        correct_option: 1,
        explanation: "React compares object references (shallow comparison). Mutating an object keeps the same reference, causing React to miss the update and fail to re-render."
      },
      {
        _id: "q_react_3",
        question: "What is the primary benefit of React.useMemo?",
        options: [
          "To persist data across browser tabs and sessions",
          "To memoize expensive calculation results between component re-renders",
          "To automatically handle async API error boundaries",
          "To convert functional components into class components"
        ],
        correct_option: 1,
        explanation: "useMemo caches the result of a calculation between renders until one of its declared dependencies changes."
      },
      {
        _id: "q_react_4",
        question: "What hook would you use to synchronize component lifecycle with an external wallet provider like window.ethereum?",
        options: ["useRef", "useEffect", "useTransition", "useId"],
        correct_option: 1,
        explanation: "useEffect is designed to manage side effects, such as subscribing to wallet provider events ('accountsChanged', 'chainChanged')."
      },
      {
        _id: "q_react_5",
        question: "In React, what is the role of the unique 'key' prop when rendering lists?",
        options: [
          "It sets the HTML element id attribute in the DOM",
          "It helps React identify which items have changed, been added, or been removed during reconciliation",
          "It provides CSS scoping for nested styles",
          "It encrypts the list item data for secure transmission"
        ],
        correct_option: 1,
        explanation: "Keys give elements a stable identity across renders so React can reorder, insert, or remove DOM nodes efficiently without unnecessary re-creation."
      },
      {
        _id: "q_react_6",
        question: "When using wagmi's useAccount hook, what property returns the currently connected user's Ethereum address?",
        options: ["userAddress", "account", "address", "currentWallet"],
        correct_option: 2,
        explanation: "useAccount() returns an object containing 'address', 'isConnected', 'status', and connector details."
      }
    ]
  },
  {
    _id: "test_defi_protocols",
    title: "DeFi Architecture & Protocol Economics",
    description: "Test your mastery over Automated Market Makers (AMM), constant product formulas, impermanent loss, and flash loans.",
    author_name: "Elena Rostova",
    author_wallet_id: "0x3C44CdD45969428583546463b6080B65f2557596",
    category: ["DeFi", "Finance", "Crypto"],
    difficulty: "Advanced",
    duration_minutes: 20,
    passing_score: 70,
    pick_random_count: 5,
    questions: [
      {
        _id: "q_defi_1",
        question: "What is the foundational invariant formula utilized by Uniswap V2 AMM pools?",
        options: ["x + y = k", "x * y = k", "x^2 + y^2 = k", "x / y = k"],
        correct_option: 1,
        explanation: "Uniswap V2 uses the Constant Product Market Maker formula: x * y = k, where x and y represent the reserves of the two pooled tokens."
      },
      {
        _id: "q_defi_2",
        question: "What is 'Impermanent Loss' in the context of automated liquidity provision?",
        options: [
          "The loss suffered when a private key is lost during bridging",
          "The difference in portfolio value between holding tokens in an AMM pool versus holding them in a wallet when prices diverge",
          "The gas fee spent when transactions fail due to slippage",
          "The penalty assessed by validator nodes during slashing events"
        ],
        correct_option: 1,
        explanation: "Impermanent loss measures the opportunity cost of providing liquidity compared to simply holding the tokens when the external price ratio shifts."
      },
      {
        _id: "q_defi_3",
        question: "What unique property makes Flash Loans possible in DeFi?",
        options: [
          "Zero collateral is required as long as the borrowed funds plus fee are returned within the exact same atomic transaction",
          "They can only be executed by centralized banks registered on Ethereum",
          "They grant flash governance voting power that persists for 24 hours",
          "They bypass Ethereum gas fees by routing through sidechains"
        ],
        correct_option: 0,
        explanation: "Flash loans allow uncollateralized borrowing because the EVM is atomic: if the loan is not fully repaid with fee by the end of the transaction execution, the entire transaction reverts."
      },
      {
        _id: "q_defi_4",
        question: "What does an Oracle (such as Chainlink) primarily provide to DeFi protocols?",
        options: [
          "Cold storage backup for protocol treasury funds",
          "Cryptographically verified off-chain real-world data (such as asset price feeds)",
          "Automatic smart contract deployment across Layer 2 rollups",
          "Zero-knowledge proving algorithms for Ethereum consensus"
        ],
        correct_option: 1,
        explanation: "Oracles bridge off-chain data (such as crypto/fiat price feeds, weather, sports) onto blockchains so smart contracts can execute deterministically."
      },
      {
        _id: "q_defi_5",
        question: "What is 'Slippage' during a decentralized exchange swap?",
        options: [
          "The latency caused by slow internet connection",
          "The difference between the expected price of a trade and the actual execution price due to pool depth and price impact",
          "The commission retained by the front-end interface",
          "The gas fee adjustment made by MetaMask EIP-1559"
        ],
        correct_option: 1,
        explanation: "Slippage occurs when trades move the price along the constant product curve or when other transactions execute before yours in the mempool."
      }
    ]
  },
  {
    _id: "test_blockchain_security",
    title: "Blockchain Security & Smart Contract Auditing",
    description: "Assess your capability in detecting critical security vulnerabilities including access control flaws, flash loan attacks, and front-running.",
    author_name: "Vikram Patel",
    author_wallet_id: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    category: ["Security", "Solidity", "Audit"],
    difficulty: "Advanced",
    duration_minutes: 20,
    passing_score: 70,
    pick_random_count: 5,
    questions: [
      {
        _id: "q_sec_1",
        question: "Why is relying on 'tx.origin' for authorization in smart contracts dangerous?",
        options: [
          "tx.origin is deprecated and will be removed in next hard fork",
          "It makes the contract susceptible to phishing attacks where an authorized user is tricked into calling a malicious contract",
          "tx.origin always returns the zero address on layer 2 networks",
          "tx.origin cannot sign multi-sig transactions"
        ],
        correct_option: 1,
        explanation: "If an authorized contract owner calls an attacker's malicious contract, the attacker's contract can call the protected function and tx.origin will still equal the owner's address."
      },
      {
        _id: "q_sec_2",
        question: "What is a Front-Running attack (or Sandwich Attack) in a decentralized mempool?",
        options: [
          "An attacker steals the private key while the user is typing",
          "An attacker monitors pending transactions in the mempool and pays higher gas fees to get their transaction mined before the victim's trade",
          "A brute force attack against elliptic curve scalar multiplication",
          "A DDoS attack against Ethereum RPC endpoints"
        ],
        correct_option: 1,
        explanation: "In transparent public mempools, bots can observe pending trades and submit transactions with higher gas prices to front-run or sandwich the victim."
      },
      {
        _id: "q_sec_3",
        question: "What does the 'Checks-Effects-Interactions' pattern prevent?",
        options: [
          "Flash loan liquidity drain",
          "Reentrancy attacks",
          "Block timestamp manipulation",
          "Gas limit exhaustion"
        ],
        correct_option: 1,
        explanation: "Checking conditions first, updating internal state second, and only then interacting with external contracts prevents reentrant callers from exploiting stale states."
      },
      {
        _id: "q_sec_4",
        question: "Which tool is widely used for static analysis of Solidity code to discover known vulnerabilities?",
        options: ["Slither", "Webpack", "TailwindCSS", "Postman"],
        correct_option: 0,
        explanation: "Slither is a leading open-source static analysis framework for Solidity developed by Trail of Bits."
      },
      {
        _id: "q_sec_5",
        question: "Why should 'block.timestamp' NOT be used as a source of secure randomness?",
        options: [
          "It is measured in nanoseconds which causes arithmetic overflow",
          "Miners/validators have minor leeway to manipulate timestamps within a tolerable window to influence random outcomes in their favor",
          "The EVM does not have access to timestamps",
          "It is static for all blocks on the blockchain"
        ],
        correct_option: 1,
        explanation: "Validators can tweak block timestamps by several seconds to bias outcomes in lotteries or random mints. Chainlink VRF or commit-reveal schemes should be used instead."
      }
    ]
  },
  {
    _id: "test_ai_ml_concepts",
    title: "AI & Neural Network Foundations",
    description: "Test core concepts in deep learning, transformer architectures, backpropagation, and training optimization.",
    author_name: "Dr. Sophia Vance",
    author_wallet_id: "0x15d34AA54267DB7D7c367839AAf71A00a2C6A65E",
    category: ["AI & ML", "Python", "Data Science"],
    difficulty: "Beginner",
    duration_minutes: 15,
    passing_score: 60,
    pick_random_count: 5,
    questions: [
      {
        _id: "q_ai_1",
        question: "What core mechanism enables Transformer models (like GPT and BERT) to process tokens in parallel?",
        options: [
          "Recurrent hidden state loops",
          "Multi-Head Self-Attention",
          "Convolutional max pooling filters",
          "K-Means clustering kernels"
        ],
        correct_option: 1,
        explanation: "Self-attention computes dynamic attention weights across all tokens simultaneously, removing sequential recurrence bottlenecks."
      },
      {
        _id: "q_ai_2",
        question: "What technique is commonly used to prevent neural networks from overfitting during training?",
        options: ["Increasing model parameters tenfold", "Dropout and weight decay (L2 regularization)", "Disabling validation splits", "Maximizing epochs unconditionally"],
        correct_option: 1,
        explanation: "Dropout randomly zeroes out activations during training, forcing neurons to learn redundant, robust representations."
      },
      {
        _id: "q_ai_3",
        question: "What algorithm is used to compute gradients of the loss function with respect to neural network weights?",
        options: ["Gradient Ascent", "Backpropagation (Chain Rule of Calculus)", "Dijkstra's Algorithm", "Binary Search"],
        correct_option: 1,
        explanation: "Backpropagation applies the calculus chain rule backward from output to input to calculate parameter gradients."
      },
      {
        _id: "q_ai_4",
        question: "Which activation function is most widely used in modern deep neural network hidden layers to avoid vanishing gradients?",
        options: ["Sigmoid", "ReLU (Rectified Linear Unit)", "Step Function", "Cosine"],
        correct_option: 1,
        explanation: "ReLU (max(0, x)) maintains a constant derivative of 1 for positive inputs, mitigating vanishing gradient issues."
      },
      {
        _id: "q_ai_5",
        question: "What does 'Learning Rate' govern in optimization algorithms like Adam or SGD?",
        options: [
          "The CPU clock speed of training clusters",
          "The step size taken in the direction of the negative gradient during parameter updates",
          "The batch size stored in GPU VRAM",
          "The number of layers in the neural architecture"
        ],
        correct_option: 1,
        explanation: "Learning rate dictates the magnitude of parameter updates per step. Too high leads to divergence; too low slows convergence."
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = "edusphere_custom_tests_v1";

export const getStoredTests = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const custom = raw ? JSON.parse(raw) : [];
    // Combine custom tests with sample tests (custom tests first)
    const customIds = new Set(custom.map(t => t._id));
    const combined = [...custom, ...dummySampleTests.filter(t => !customIds.has(t._id))];
    return combined;
  } catch (err) {
    console.warn("Error reading local tests:", err);
    return dummySampleTests;
  }
};

export const saveCustomTest = (newTest) => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const custom = raw ? JSON.parse(raw) : [];
    const testToSave = {
      ...newTest,
      _id: newTest._id || `test_custom_${Date.now()}`,
      created_at: new Date().toISOString(),
      attempts_count: 0
    };
    custom.unshift(testToSave);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(custom));
    return testToSave;
  } catch (err) {
    console.error("Error saving custom test:", err);
    return newTest;
  }
};

// Shuffles an array randomly using Fisher-Yates algorithm
export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Samples N random questions from question bank for a test attempt
export const getRandomQuestionsForTest = (test, count) => {
  if (!test || !test.questions || test.questions.length === 0) return [];
  const poolSize = test.questions.length;
  const numToPick = Math.min(count || test.pick_random_count || 5, poolSize);
  const shuffled = shuffleArray(test.questions);
  return shuffled.slice(0, numToPick);
};

// Grade student submission offline fallback
export const gradeTestSubmissionLocally = (test, answers, studentWallet) => {
  let correctCount = 0;
  const detailedReview = [];

  answers.forEach((ans) => {
    const originalQ = test.questions.find(q => (q._id || q.question) === (ans.question_id || ans.question));
    if (originalQ) {
      const isCorrect = originalQ.correct_option === ans.selected_option;
      if (isCorrect) correctCount++;
      detailedReview.push({
        question_id: originalQ._id || originalQ.question,
        question: originalQ.question,
        options: originalQ.options,
        selected_option: ans.selected_option,
        correct_option: originalQ.correct_option,
        is_correct: isCorrect,
        explanation: originalQ.explanation || "No explanation provided."
      });
    }
  });

  const totalQuestions = answers.length;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passingScore = test.passing_score || 60;
  const passed = scorePercentage >= passingScore;

  const result = {
    test_id: test._id,
    test_title: test.title,
    student_wallet_id: studentWallet,
    total_questions: totalQuestions,
    correct_answers: correctCount,
    wrong_answers: totalQuestions - correctCount,
    score_percentage: scorePercentage,
    passing_score: passingScore,
    passed: passed,
    submitted_at: new Date().toISOString(),
    detailed_review: detailedReview
  };

  // Automatically save to submissions storage
  saveSubmissionLocally(result);

  return result;
};

const LOCAL_STORAGE_SUBMISSIONS_KEY = "edusphere_test_submissions_v1";

const sampleStudentSubmissions = [
  {
    submission_id: "sub_1",
    test_id: "test_web3_solidity",
    test_title: "Web3 & Solidity Smart Contract Mastery",
    student_wallet_id: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    student_name: "Aarav Sharma",
    score_percentage: 80,
    correct_answers: 4,
    wrong_answers: 1,
    total_questions: 5,
    passed: true,
    passing_score: 60,
    submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    detailed_review: [
      {
        question: "Which EVM memory area is persistent between function calls and writes directly to blockchain state?",
        selected_option: 1,
        correct_option: 1,
        is_correct: true,
        explanation: "Storage is the persistent key-value store on the EVM."
      },
      {
        question: "What is the primary vulnerability in a classic reentrancy attack?",
        selected_option: 0,
        correct_option: 1,
        is_correct: false,
        explanation: "Reentrancy occurs when external calls are made before updating internal balance state."
      }
    ]
  },
  {
    submission_id: "sub_2",
    test_id: "test_web3_solidity",
    test_title: "Web3 & Solidity Smart Contract Mastery",
    student_wallet_id: "0x53d284357ec70cE289D6D64134DfAc8E511c8a3D",
    student_name: "Sneha Patel",
    score_percentage: 40,
    correct_answers: 2,
    wrong_answers: 3,
    total_questions: 5,
    passed: false,
    passing_score: 60,
    submitted_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    detailed_review: []
  },
  {
    submission_id: "sub_3",
    test_id: "test_react_frontend",
    test_title: "Modern React & Web3 Frontend Engineering",
    student_wallet_id: "0x983110309620D911731Ac0932219af06091b6744",
    student_name: "Rohan Verma",
    score_percentage: 100,
    correct_answers: 5,
    wrong_answers: 0,
    total_questions: 5,
    passed: true,
    passing_score: 60,
    submitted_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    detailed_review: []
  }
];

export const getStoredSubmissions = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBMISSIONS_KEY);
    const currentUserName = localStorage.getItem("username") || localStorage.getItem("studentName") || localStorage.getItem("name") || "";
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(sampleStudentSubmissions));
      return sampleStudentSubmissions;
    }
    const parsed = JSON.parse(raw);
    const fallbackNames = ["Aarav Sharma", "Sneha Patel", "Rohan Verma", "Ananya Iyer", "Karan Malhotra"];
    return parsed.map((s, idx) => {
      if (!s.student_name || s.student_name.startsWith("0x")) {
        const currentWallet = localStorage.getItem("walletAddress") || "";
        if (currentWallet && s.student_wallet_id && s.student_wallet_id.toLowerCase() === currentWallet.toLowerCase() && currentUserName) {
          s.student_name = currentUserName;
        } else {
          s.student_name = currentUserName || fallbackNames[idx % fallbackNames.length];
        }
      }
      return s;
    });
  } catch (err) {
    console.warn("Error reading local submissions:", err);
    return sampleStudentSubmissions;
  }
};

export const saveSubmissionLocally = (submission) => {
  try {
    const existing = getStoredSubmissions();
    const submissionToSave = {
      ...submission,
      submission_id: submission.submission_id || `sub_${Date.now()}`,
      submitted_at: submission.submitted_at || new Date().toISOString()
    };
    existing.unshift(submissionToSave);
    localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(existing));
    return submissionToSave;
  } catch (err) {
    console.warn("Error saving submission locally:", err);
    return submission;
  }
};

