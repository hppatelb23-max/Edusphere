const Users = require("../models/user_schema");
const Tests = require("../models/test_schema");
const { persistModel } = require("../utils/persistence");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const defaultSampleTests = [
    {
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
                question: "Which EVM memory area is persistent between function calls and writes directly to blockchain state?",
                options: ["Memory", "Storage", "Calldata", "Stack"],
                correct_option: 1,
                explanation: "Storage is the persistent key-value store associated with a smart contract on the EVM. Memory and Calldata are temporary."
            },
            {
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
                question: "Which function visibility modifier allows a function to ONLY be called externally from outside the contract?",
                options: ["public", "private", "external", "internal"],
                correct_option: 2,
                explanation: "Functions marked 'external' can only be called from outside the contract or via 'this.functionName()' within the contract."
            },
            {
                question: "Which ERC standard defines non-fungible tokens (NFTs) with unique token IDs?",
                options: ["ERC-20", "ERC-721", "ERC-1155", "ERC-4626"],
                correct_option: 1,
                explanation: "ERC-721 is the standard for Non-Fungible Tokens where every token ID represents a unique, non-interchangeable asset."
            },
            {
                question: "What is the purpose of the 'indexed' keyword in Solidity event declarations?",
                options: [
                    "It encrypts the log data so only miners can view it",
                    "It places topic hashes into the Bloom filter for rapid off-chain filtering",
                    "It ensures the event can be called like an internal function",
                    "It forces the event data to be stored permanently in contract storage"
                ],
                correct_option: 1,
                explanation: "Up to 3 parameters in an event can be marked 'indexed', allowing clients and indexers (like The Graph) to filter logs efficiently using topics."
            },
            {
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
                question: "Which opcode is executed when ETH is sent to a contract without calldata, provided it is implemented?",
                options: ["fallback()", "receive()", "default()", "payable()"],
                correct_option: 1,
                explanation: "The 'receive() external payable' function is executed whenever a contract receives plain Ether with empty calldata. If absent, fallback() is called."
            }
        ]
    },
    {
        title: "Frontend Engineering with Modern React & Wagmi",
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
                question: "In Wagmi v2, which hook is primarily used to invoke state-changing smart contract functions?",
                options: ["useReadContract", "useWriteContract", "useContractCall", "useSignTransaction"],
                correct_option: 1,
                explanation: "useWriteContract (and writeContractAsync) is the standard Wagmi hook to broadcast state-modifying smart contract transactions."
            },
            {
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
                question: "What hook would you use to synchronize component lifecycle with an external wallet provider like window.ethereum?",
                options: ["useRef", "useEffect", "useTransition", "useId"],
                correct_option: 1,
                explanation: "useEffect is designed to manage side effects, such as subscribing to wallet provider events ('accountsChanged', 'chainChanged')."
            },
            {
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
                question: "When using wagmi's useAccount hook, what property returns the currently connected user's Ethereum address?",
                options: ["userAddress", "account", "address", "currentWallet"],
                correct_option: 2,
                explanation: "useAccount() returns an object containing 'address', 'isConnected', 'status', and connector details."
            }
        ]
    },
    {
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
                question: "What is the foundational invariant formula utilized by Uniswap V2 AMM pools?",
                options: ["x + y = k", "x * y = k", "x^2 + y^2 = k", "x / y = k"],
                correct_option: 1,
                explanation: "Uniswap V2 uses the Constant Product Market Maker formula: x * y = k, where x and y represent the reserves of the two pooled tokens."
            },
            {
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
                question: "Which tool is widely used for static analysis of Solidity code to discover known vulnerabilities?",
                options: ["Slither", "Webpack", "TailwindCSS", "Postman"],
                correct_option: 0,
                explanation: "Slither is a leading open-source static analysis framework for Solidity developed by Trail of Bits."
            },
            {
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
    }
];

async function seedDefaultTestsIfEmpty() {
    try {
        const count = await Tests.countDocuments();
        if (count === 0) {
            console.log("Seeding default question banks and tests...");
            await Tests.insertMany(defaultSampleTests);
            await persistModel('tests', Tests);
            console.log("Successfully seeded default tests.");
        }
    } catch (err) {
        console.warn("Test seeding notice:", err.message);
    }
}

// Helper: Shuffle array
function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// GET /tests
async function DisplayTests(req, res) {
    try {
        await seedDefaultTestsIfEmpty();
        const tests = await Tests.find().sort({ created_at: -1 });
        return res.status(200).json({
            message: "Tests fetched successfully.",
            tests: tests
        });
    } catch (err) {
        return res.status(500).json({ error: "Error fetching tests: " + err.message });
    }
}

// GET /tests/:id
async function GetTestById(req, res) {
    try {
        const { id } = req.params;
        const { randomize } = req.query;

        const test = await Tests.findById(id);
        if (!test) {
            return res.status(404).json({ error: "Test not found." });
        }

        const testObj = test.toObject();

        // If randomize is requested (for student taking test)
        if (randomize === 'true' && testObj.questions && testObj.questions.length > 0) {
            const count = Math.min(testObj.pick_random_count || 5, testObj.questions.length);
            const shuffledQuestions = shuffleArray(testObj.questions);
            const selectedQuestions = shuffledQuestions.slice(0, count);

            // Hide correct_option and explanation for active test delivery, but KEEP images!
            const sanitizedQuestions = selectedQuestions.map((q) => ({
                _id: q._id,
                question: q.question,
                question_image: q.question_image || "",
                options: q.options,
                option_images: q.option_images || []
            }));

            testObj.questions = sanitizedQuestions;
            testObj.total_random_selected = sanitizedQuestions.length;
        }

        return res.status(200).json({
            message: "Test fetched successfully.",
            test: testObj
        });
    } catch (err) {
        return res.status(500).json({ error: "Error fetching test details: " + err.message });
    }
}

// POST /tests/create
async function CreateTest(req, res) {
    try {
        const {
            title,
            description,
            category,
            difficulty,
            duration_minutes,
            test_type,
            schedule_start,
            schedule_end,
            passing_score,
            pick_random_count,
            author_wallet_id,
            author_name,
            questions
        } = req.body;

        if (!title || !description || !author_wallet_id) {
            return res.status(400).json({ error: "Please fill in title, description and connect educator wallet." });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: "Please add at least one question to the test question bank." });
        }

        // Validate each question format (support text, diagram/image, or both!)
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if ((!q.question || !q.question.trim()) && !q.question_image) {
                return res.status(400).json({ error: `Question ${i + 1} must have either question statement text or a diagram/image.` });
            }
            if (!Array.isArray(q.options) || q.options.length < 2) {
                return res.status(400).json({ error: `Question ${i + 1} must have at least 2 options.` });
            }
            if (q.correct_option === undefined || q.correct_option < 0 || q.correct_option >= q.options.length) {
                return res.status(400).json({ error: `Question ${i + 1} has an invalid correct option index.` });
            }
        }

        const isScheduled = test_type === "scheduled";
        let parsedStart = null;
        let parsedEnd = null;

        if (isScheduled) {
            if (!schedule_start || !schedule_end) {
                return res.status(400).json({ error: "Please provide both start and end time for scheduled assessments." });
            }
            parsedStart = new Date(schedule_start);
            parsedEnd = new Date(schedule_end);
            if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
                return res.status(400).json({ error: "Invalid schedule start or end time format." });
            }
            if (parsedEnd <= parsedStart) {
                return res.status(400).json({ error: "Schedule end time must be after the start time." });
            }
        }

        const newTest = await Tests.create({
            title: title.trim(),
            description: description.trim(),
            category: Array.isArray(category) ? category : [category || "General"],
            difficulty: difficulty || "Intermediate",
            duration_minutes: Number(duration_minutes) || 15,
            test_type: isScheduled ? "scheduled" : "normal",
            schedule_start: parsedStart,
            schedule_end: parsedEnd,
            passing_score: Number(passing_score) || 60,
            pick_random_count: Math.min(Number(pick_random_count) || questions.length, questions.length),
            author_wallet_id: author_wallet_id,
            author_name: author_name || "Educator",
            questions: questions
        });

        await persistModel('tests', Tests);

        return res.status(201).json({
            message: "Test created successfully!",
            test: newTest
        });
    } catch (err) {
        return res.status(500).json({ error: "Error creating test: " + err.message });
    }
}

// POST /tests/submit
async function SubmitTest(req, res) {
    try {
        const { test_id, student_wallet_id, student_name, answers, recording_id, recording_id_part1, recording_id_part2, has_interruption, proctor_logs } = req.body;
        let resolvedStudentName = (student_name || '').trim();
        if (!resolvedStudentName && student_wallet_id) {
            try {
                const u = await Users.findOne({ metamask_wallet_id: new RegExp('^' + student_wallet_id + '$', 'i') });
                if (u && u.user_name) resolvedStudentName = u.user_name;
            } catch (e) {}
        }

        if (!test_id || !student_wallet_id || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'Missing required test submission parameters.' });
        }

        const mongoose = require("mongoose");
        let test = null;
        if (mongoose.Types.ObjectId.isValid(test_id)) {
            try {
                test = await Tests.findById(test_id);
            } catch (e) {}
        }
        if (!test) {
            test = await Tests.findOne({
                $or: [
                    { _id: test_id },
                    { title: new RegExp('^' + String(test_id).replace(/[-_]/g, ' ') + '$', 'i') }
                ]
            });
        }
        if (!test) {
            return res.status(404).json({ error: 'Test not found.' });
        }

        // Validate scheduled window if test is scheduled
        if (test.test_type === "scheduled" && test.schedule_end) {
            const now = new Date();
            const endBuffer = new Date(new Date(test.schedule_end).getTime() + 2 * 60 * 1000);
            if (now > endBuffer) {
                return res.status(403).json({ error: "The scheduled window for this test has ended. Submissions are no longer accepted." });
            }
        }

        // Helper to normalize option index from number, numeric string, letter ('A','B'...), or option text
        const normalizeOptionIndex = (val, options = []) => {
            if (val === undefined || val === null || val === -1 || val === "-1") return -1;
            if (typeof val === "number" && !isNaN(val)) return val;
            const str = String(val).trim();
            if (/^\d+$/.test(str)) return parseInt(str, 10);
            const letterMap = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
            if (letterMap[str] !== undefined) return letterMap[str];
            if (Array.isArray(options)) {
                const found = options.findIndex(o => String(o).trim().toLowerCase() === str.toLowerCase());
                if (found !== -1) return found;
            }
            return -1;
        };

        // Grade submission
        let correctCount = 0;
        const totalQuestions = answers.length;
        const detailedReview = [];

        answers.forEach((ans, ansIdx) => {
            let originalQ = null;
            if (ans.question_id && mongoose.Types.ObjectId.isValid(ans.question_id)) {
                try { originalQ = test.questions.id(ans.question_id); } catch (e) {}
            }
            if (!originalQ && test.questions) {
                originalQ = test.questions.find(q =>
                    (q._id && ans.question_id && String(q._id) === String(ans.question_id)) ||
                    (q.question && ans.question_id && q.question.trim().toLowerCase() === String(ans.question_id).trim().toLowerCase()) ||
                    (q.question && ans.question && q.question.trim().toLowerCase() === String(ans.question).trim().toLowerCase())
                );
            }
            // Fallback: match by question index if ID or question text mismatch
            if (!originalQ && test.questions && typeof ans.question_index === 'number' && test.questions[ans.question_index]) {
                originalQ = test.questions[ans.question_index];
            }
            if (!originalQ && test.questions && test.questions[ansIdx]) {
                originalQ = test.questions[ansIdx];
            }

            if (originalQ) {
                const optionsList = Array.isArray(originalQ.options) ? originalQ.options : [];
                const correctOptIdx = normalizeOptionIndex(originalQ.correct_option, optionsList);
                let selectedOptIdx = normalizeOptionIndex(ans.selected_option, optionsList);

                // Check text matching if selected_option_text provided or selectedOptIdx not found
                if (selectedOptIdx === -1 && ans.selected_option_text) {
                    const textMatch = optionsList.findIndex(o =>
                        String(o).trim().toLowerCase() === String(ans.selected_option_text).trim().toLowerCase()
                    );
                    if (textMatch !== -1) selectedOptIdx = textMatch;
                }

                let isCorrect = false;
                if (correctOptIdx !== -1 && selectedOptIdx !== -1) {
                    isCorrect = (correctOptIdx === selectedOptIdx);
                }
                if (!isCorrect && optionsList.length > 0) {
                    const correctText = String(optionsList[correctOptIdx] || originalQ.correct_option || "").trim().toLowerCase();
                    const selectedText = String(
                        optionsList[selectedOptIdx] ||
                        ans.selected_option_text ||
                        (typeof ans.selected_option === "string" ? ans.selected_option : "") ||
                        ""
                    ).trim().toLowerCase();
                    if (correctText && selectedText && correctText === selectedText) {
                        isCorrect = true;
                        if (selectedOptIdx === -1) selectedOptIdx = correctOptIdx;
                    }
                }

                if (isCorrect) {
                    correctCount++;
                    if (selectedOptIdx === -1) selectedOptIdx = correctOptIdx;
                }

                detailedReview.push({
                    question_id: originalQ._id || ans.question_id,
                    question: originalQ.question,
                    question_image: originalQ.question_image || "",
                    options: optionsList,
                    option_images: originalQ.option_images || [],
                    selected_option: selectedOptIdx,
                    selected_option_text: (selectedOptIdx >= 0 && optionsList[selectedOptIdx]) ? optionsList[selectedOptIdx] : (ans.selected_option_text || ""),
                    correct_option: correctOptIdx !== -1 ? correctOptIdx : 0,
                    is_correct: isCorrect,
                    explanation: originalQ.explanation || ""
                });
            }
        });

        const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = scorePercentage >= (test.passing_score || 60);

        // Record student submission for educator gradebook
        if (!test.submissions) test.submissions = [];
        test.submissions.push({
            student_wallet_id: student_wallet_id,
            student_name: resolvedStudentName || "",
            score_percentage: scorePercentage,
            correct_answers: correctCount,
            wrong_answers: totalQuestions - correctCount,
            total_questions: totalQuestions,
            passed: passed,
            recording_id: recording_id || recording_id_part2 || recording_id_part1 || "",
            recording_id_part1: recording_id_part1 || "",
            recording_id_part2: recording_id_part2 || "",
            has_interruption: Boolean(has_interruption || recording_id_part1),
            proctor_logs: Array.isArray(proctor_logs) ? proctor_logs : [],
            submitted_at: new Date(),
            answers: detailedReview
        });

        // Award 50 coins if student scored >= passing score
        let coinsAwarded = 0;
        let newCoinBalance = null;
        if (passed) {
            coinsAwarded = 50;
            try {
                const Users = require("../models/user_schema");
                let u = null;
                if (student_wallet_id) {
                    u = await Users.findOne({ metamask_wallet_id: new RegExp('^' + student_wallet_id + '$', 'i') });
                }
                if (!u && resolvedStudentName) {
                    u = await Users.findOne({ user_name: new RegExp('^' + resolvedStudentName + '$', 'i') });
                }
                if (u) {
                    u.coins = (u.coins || 500) + 50;
                    await u.save();
                    newCoinBalance = u.coins;
                }
            } catch (coinErr) {
                console.warn("Could not increment user coins in db:", coinErr);
            }
        }

        // Increment attempts count
        test.attempts_count = (test.attempts_count || 0) + 1;
        await test.save();

        await persistModel('tests', Tests);
        await persistModel('users', Users);

        return res.status(200).json({
            message: "Test evaluated successfully.",
            result: {
                test_title: test.title,
                student_wallet_id: student_wallet_id,
                total_questions: totalQuestions,
                correct_answers: correctCount,
                wrong_answers: totalQuestions - correctCount,
                score_percentage: scorePercentage,
                passing_score: test.passing_score || 60,
                passed: passed,
                coins_awarded: coinsAwarded,
                coin_balance: newCoinBalance,
                recording_id: recording_id || recording_id_part2 || recording_id_part1 || "",
                recording_id_part1: recording_id_part1 || "",
                recording_id_part2: recording_id_part2 || "",
                has_interruption: Boolean(has_interruption || recording_id_part1),
                proctor_logs: Array.isArray(proctor_logs) ? proctor_logs : [],
                detailed_review: detailedReview
            }
        });
    } catch (err) {
        return res.status(500).json({ error: "Error evaluating test: " + err.message });
    }
}

// GET /tests/submissions/all (Educators can see all students' marks)
async function GetEducatorSubmissions(req, res) {
    try {
        const { educator_wallet } = req.query;
        let query = {};
        if (educator_wallet) {
            query.author_wallet_id = educator_wallet;
        }

        const tests = await Tests.find(query).select("title author_name author_wallet_id passing_score submissions");
        const allUsers = await Users.find({}).select("user_name metamask_wallet_id");
        const userMap = {};
        allUsers.forEach(u => {
            if (u.metamask_wallet_id && u.user_name) {
                userMap[u.metamask_wallet_id.toLowerCase()] = u.user_name;
            }
        });
        const allSubmissions = [];

        tests.forEach((t) => {
            if (t.submissions && t.submissions.length > 0) {
                t.submissions.forEach((sub) => {
                    allSubmissions.push({
                        submission_id: sub._id,
                        test_id: t._id,
                        test_title: t.title,
                        author_name: t.author_name,
                        author_wallet_id: t.author_wallet_id,
                        student_wallet_id: sub.student_wallet_id,
                        student_name: sub.student_name || (sub.student_wallet_id ? userMap[sub.student_wallet_id.toLowerCase()] : "") || "",
                        score_percentage: sub.score_percentage,
                        correct_answers: sub.correct_answers,
                        wrong_answers: sub.wrong_answers,
                        total_questions: sub.total_questions,
                        passed: sub.passed,
                        passing_score: t.passing_score,
                        recording_id: sub.recording_id || "",
                        recording_id_part1: sub.recording_id_part1 || "",
                        recording_id_part2: sub.recording_id_part2 || "",
                        has_interruption: Boolean(sub.has_interruption || sub.recording_id_part1),
                        proctor_logs: sub.proctor_logs || [],
                        submitted_at: sub.submitted_at,
                        answers: sub.answers,
                        detailed_review: sub.answers || []
                    });
                });
            }
        });

        // Sort latest submissions first
        allSubmissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

        return res.status(200).json({
            message: "Student marks fetched successfully.",
            submissions: allSubmissions
        });
    } catch (err) {
        return res.status(500).json({ error: "Error fetching student marks: " + err.message });
    }
}

async function GetMySubmissions(req, res) {
    try {
        const { student_wallet, student_name } = req.query;
        let query = {};
        if (student_wallet && student_name) {
            query = {
                $or: [
                    { "submissions.student_wallet_id": { $regex: new RegExp(`^${student_wallet}$`, "i") } },
                    { "submissions.student_name": { $regex: new RegExp(`^${student_name}$`, "i") } }
                ]
            };
        } else if (student_wallet) {
            query = { "submissions.student_wallet_id": { $regex: new RegExp(`^${student_wallet}$`, "i") } };
        } else if (student_name) {
            query = { "submissions.student_name": { $regex: new RegExp(`^${student_name}$`, "i") } };
        }

        const tests = await Tests.find(query).select("title author_name passing_score submissions");

        const mySubmissions = [];
        tests.forEach(t => {
            if (Array.isArray(t.submissions)) {
                t.submissions.forEach(sub => {
                    const matchWallet = student_wallet && sub.student_wallet_id && sub.student_wallet_id.toLowerCase() === student_wallet.toLowerCase();
                    const matchName = student_name && sub.student_name && sub.student_name.toLowerCase() === student_name.toLowerCase();
                    if (matchWallet || matchName || (!student_wallet && !student_name)) {
                        mySubmissions.push({
                            submission_id: sub._id,
                            test_id: t._id,
                            test_title: t.title,
                            student_wallet_id: sub.student_wallet_id,
                            student_name: sub.student_name || "",
                            score_percentage: sub.score_percentage,
                            correct_answers: sub.correct_answers,
                            wrong_answers: sub.wrong_answers,
                            total_questions: sub.total_questions,
                            passed: sub.passed,
                            passing_score: t.passing_score,
                            submitted_at: sub.submitted_at,
                            answers: sub.answers,
                            detailed_review: sub.answers || []
                        });
                    }
                });
            }
        });

        // Detect missed scheduled assessments where window has ended and student did not attempt
        try {
            const now = new Date();
            const allScheduledTests = await Tests.find({
                test_type: "scheduled",
                schedule_end: { $lt: now }
            }).select("title author_name passing_score schedule_start schedule_end submissions");

            const submittedTestIds = new Set(mySubmissions.map(s => String(s.test_id)));

            allScheduledTests.forEach(st => {
                if (!submittedTestIds.has(String(st._id))) {
                    const hasSub = (st.submissions || []).some(sub =>
                        (student_wallet && sub.student_wallet_id && sub.student_wallet_id.toLowerCase() === student_wallet.toLowerCase()) ||
                        (student_name && sub.student_name && sub.student_name.toLowerCase() === student_name.toLowerCase())
                    );
                    if (!hasSub) {
                        mySubmissions.push({
                            submission_id: `missed_${st._id}`,
                            test_id: st._id,
                            test_title: st.title,
                            author_name: st.author_name || "Faculty",
                            student_wallet_id: student_wallet || "",
                            student_name: student_name || "",
                            score_percentage: 0,
                            correct_answers: 0,
                            wrong_answers: 0,
                            total_questions: 0,
                            passed: false,
                            is_missed: true,
                            status: "Missed / Expired",
                            passing_score: st.passing_score,
                            schedule_start: st.schedule_start,
                            schedule_end: st.schedule_end,
                            submitted_at: st.schedule_end,
                            detailed_review: []
                        });
                    }
                }
            });
        } catch (e) {
            console.warn("Error calculating missed tests:", e);
        }

        mySubmissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

        return res.status(200).json({
            message: "My marks fetched successfully.",
            submissions: mySubmissions
        });
    } catch (err) {
        return res.status(500).json({ error: "Error fetching my marks: " + err.message });
    }
}

// DELETE /tests/:id (Educator deletes their own test)
async function DeleteTest(req, res) {
    try {
        const { id } = req.params;
        const mongoose = require("mongoose");
        if (mongoose.Types.ObjectId.isValid(id)) {
            await Tests.findByIdAndDelete(id);
        } else {
            try {
                await Tests.deleteOne({ $or: [{ _id: id }, { title: id }] });
            } catch (innerErr) {
                console.warn("DeleteTest custom ID fallback notice:", innerErr.message);
            }
        }
        await persistModel('tests', Tests);
        return res.status(200).json({ message: "Test deleted successfully." });
    } catch (err) {
        return res.status(500).json({ error: "Error deleting test: " + err.message });
    }
}

// DELETE /tests/submissions/:submission_id (Educator deletes a student submission & its history)
async function DeleteSubmission(req, res) {
    try {
        const { submission_id } = req.params;
        if (!submission_id) return res.status(400).json({ error: "submission_id is required." });

        await Tests.updateMany(
            { "submissions._id": submission_id },
            { $pull: { submissions: { _id: submission_id } } }
        );

        await persistModel('tests', Tests);

        return res.status(200).json({ message: "Student marks record deleted successfully." });
    } catch (err) {
        return res.status(500).json({ error: "Error deleting submission: " + err.message });
    }
}

// DELETE /tests/submissions/recording/:submission_id (Educator removes only the recording from a submission)
async function DeleteSubmissionRecording(req, res) {
    try {
        const { submission_id } = req.params;
        if (!submission_id) return res.status(400).json({ error: "submission_id is required." });

        await Tests.updateMany(
            { "submissions._id": submission_id },
            { $set: { "submissions.$.recording_id": "" } }
        );

        return res.status(200).json({ message: "Student proctor recording removed successfully." });
    } catch (err) {
        return res.status(500).json({ error: "Error removing recording: " + err.message });
    }
}

// POST /tests/submissions/clear (Educator clears all student marks history)
async function ClearAllSubmissions(req, res) {
    try {
        const { educator_wallet } = req.body;
        let query = {};
        if (educator_wallet) {
            query.author_wallet_id = educator_wallet;
        }
        await Tests.updateMany(query, { $set: { submissions: [] } });
        return res.status(200).json({ message: "All student marks history cleared successfully." });
    } catch (err) {
        return res.status(500).json({ error: "Error clearing submissions: " + err.message });
    }
}

// POST /tests/extract-document (Extract text from PDF, Word .docx/.doc, or text files)
async function ExtractDocumentText(req, res) {
    try {
        const { fileData, fileName } = req.body;
        if (!fileData || !fileName) {
            return res.status(400).json({ error: "Missing fileData or fileName." });
        }

        const ext = path.extname(fileName).toLowerCase();
        if (![".pdf", ".docx", ".doc", ".txt", ".md", ".text"].includes(ext)) {
            return res.status(400).json({ error: "Unsupported file type. Please upload a .pdf, .docx, .doc, or .txt file." });
        }

        const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");

        const tempDir = os.tmpdir();
        const safeBase = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
        const tempFilePath = path.join(tempDir, `edusphere_${Date.now()}_${safeBase}`);
        fs.writeFileSync(tempFilePath, buffer);

        const pythonScript = path.join(__dirname, "../utils/extract_document.py");

        execFile("python", [pythonScript, tempFilePath], { maxBuffer: 15 * 1024 * 1024 }, (err, stdout, stderr) => {
            try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (e) {}

            if (err) {
                console.error("Document extraction error:", err, stderr);
                return res.status(500).json({ error: "Failed to extract text from document: " + (stderr || err.message) });
            }

            try {
                const parsed = JSON.parse(stdout);
                if (parsed.error) {
                    return res.status(400).json({ error: parsed.error });
                }
                const wordCount = (parsed.text || "").trim().split(/\s+/).filter(Boolean).length;
                return res.status(200).json({
                    success: true,
                    text: parsed.text,
                    fileName: fileName,
                    pages: parsed.pages || 1,
                    wordCount: wordCount
                });
            } catch (jsonErr) {
                return res.status(500).json({ error: "Failed to parse document extraction output." });
            }
        });
    } catch (err) {
        console.error("ExtractDocumentText error:", err);
        return res.status(500).json({ error: "Internal server error: " + err.message });
    }
}

// POST /tests/generate-from-notes (Intelligent Question Generator from Educator Notes / Text / Documents)
async function GenerateQuestionsFromNotes(req, res) {
    try {
        const { notes, topic = "", difficulty = "Intermediate", count = 5, apiKey = "" } = req.body;
        if (!notes || typeof notes !== "string" || notes.trim().length < 20) {
            return res.status(400).json({ error: "Document or notes text must contain at least 20 characters." });
        }

        const activeGeminiKey = apiKey || process.env.GEMINI_API_KEY;

        // --- 1. If Gemini API Key is available, call Google Gemini for authentic academic exam creation ---
        if (activeGeminiKey) {
            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeGeminiKey}`;
                const prompt = `You are a university professor and pedagogical assessment expert.
Create exactly ${count} professional, challenging, high-quality multiple choice questions (MCQs) of ${difficulty} difficulty based STRICTLY on the educational content of the following text.
DO NOT include author names, affiliations, email addresses, volume numbers, citations, or paper metadata. Focus purely on technical definitions, mechanisms, concepts, findings, and methodologies.

Text Material:
"""
${notes.slice(0, 15000)}
"""

Format your response as a valid JSON array of objects with the exact schema:
[
  {
    "question": "A specific, clearly worded question directly testing the subject matter",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct_option": 0,
    "explanation": "Clear explanation citing the concept from the text"
  }
]
Return ONLY the raw JSON array without markdown formatting.`;

                const geminiRes = await fetch(geminiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.2,
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (geminiRes.ok) {
                    const geminiData = await geminiRes.json();
                    const rawJson = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (rawJson) {
                        const parsed = JSON.parse(rawJson);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            return res.status(200).json({
                                success: true,
                                engine: "gemini-1.5-flash",
                                topic: topic || "Course Material",
                                difficulty,
                                count: parsed.length,
                                questions: parsed
                            });
                        }
                    }
                }
            } catch (geminiErr) {
                console.warn("Gemini API call failed, falling back to advanced semantic analyzer:", geminiErr.message);
            }
        }

        // --- 2. Advanced Content-Aware Semantic Analysis (Metadata Purging + Concept Extraction) ---
        const cleaned = notes.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const lines = cleaned.split("\n").map(l => l.trim()).filter(Boolean);

        // Filter out academic metadata: authors, affiliations, footnotes, emails, publication stats
        const isMetadataLine = (line) => {
            const lower = line.toLowerCase();
            return (
                lower.includes("@") ||
                lower.includes("http") ||
                lower.includes("doi.org") ||
                lower.includes("arxiv:") ||
                lower.includes("university") ||
                lower.includes("institute") ||
                lower.includes("laboratory") ||
                lower.includes("department") ||
                lower.includes("zurich") ||
                lower.includes("ibm research") ||
                lower.includes("all rights reserved") ||
                lower.includes("received:") ||
                lower.includes("accepted:") ||
                lower.includes("published:") ||
                lower.includes("keywords:") ||
                lower.includes("et al.") ||
                /^[0-9*,\s]+$/.test(line) ||
                // Author patterns like "Name 1,2*, OtherName 2 and ThirdName 1"
                /([A-Z][a-z]+ [A-Z][a-z]+\s*[0-9*,\s]+)/.test(line) && line.length < 90 ||
                // Fragment ending with conjunctions
                /^(and|or|for|with|of|in|to)\b/i.test(line) && line.split(/\s+/).length < 5
            );
        };

        const bodyLines = lines.filter(l => !isMetadataLine(l));
        const bodyText = bodyLines.join(" ");

        // Auto-detect topic if not set
        let detectedTopic = topic;
        if (!detectedTopic || detectedTopic.toLowerCase() === "web3" || detectedTopic.toLowerCase() === "general") {
            const titleCandidate = bodyLines.slice(0, 3).find(l => l.length >= 15 && l.length <= 120 && !l.endsWith("."));
            if (titleCandidate) {
                detectedTopic = titleCandidate;
            } else {
                detectedTopic = "Subject Concept Assessment";
            }
        }

        // Split into real grammatical sentences (must have >= 8 words, end with punctuation)
        const sentences = bodyText
            .split(/(?<=[.?!])\s+(?=[A-Z0-9])/)
            .map(s => s.trim().replace(/^[\*\-\d\.\s]+/, ""))
            .filter(s => {
                const words = s.split(/\s+/);
                if (words.length < 8 || words.length > 50) return false;
                // Exclude sentences that contain author superscript patterns or institutional terms
                if (/1,2\*|[0-9]\*|ibm|zurich|switzerland|university|department/i.test(s)) return false;
                // Must contain an active verb
                const lower = s.toLowerCase();
                return (
                    lower.includes(" is ") ||
                    lower.includes(" are ") ||
                    lower.includes(" means ") ||
                    lower.includes(" allows ") ||
                    lower.includes(" enables ") ||
                    lower.includes(" uses ") ||
                    lower.includes(" consists of ") ||
                    lower.includes(" demonstrates ") ||
                    lower.includes(" provides ") ||
                    lower.includes(" shows ") ||
                    lower.includes(" represents ")
                );
            });

        const targetCount = Math.min(Math.max(Number(count) || 5, 1), 15);
        const selected = sentences.slice(0, targetCount);

        if (selected.length === 0) {
            return res.status(400).json({
                error: "Could not extract clear technical statements from the text. Please ensure the document contains substantive paragraphs."
            });
        }

        // Extract key terms to construct realistic, content-specific distractors from the same document
        const conceptTerms = [];
        bodyLines.forEach(l => {
            const matches = l.match(/\b([A-Z][a-z]+ [A-Z][a-z]+|[a-z]+ [a-z]+ distribution|[a-z]+ circuit|[a-z]+ algorithm|[a-z]+ generator|[a-z]+ network)\b/g);
            if (matches) {
                matches.forEach(m => {
                    if (m.length > 8 && !conceptTerms.includes(m) && !isMetadataLine(m)) {
                        conceptTerms.push(m);
                    }
                });
            }
        });

        const questions = selected.map((stmt, idx) => {
            let qText = "";
            let correctAns = "";
            let explanation = `Source material demonstrates: "${stmt}".`;

            const match = stmt.match(/^(.*?)\s+(is defined as|is used for|is used to|refers to|allows|enables|uses|consists of|demonstrates|provides|is|are)\s+(.*)$/i);
            if (match && match[1].length >= 4 && match[3].length >= 10) {
                const subject = match[1].trim();
                const verb = match[2].trim().toLowerCase();
                const predicate = match[3].trim().replace(/\.$/, "");

                qText = `According to the reference text, what is the core role or characteristic of "${subject}"?`;
                correctAns = (verb.startsWith("is") ? "" : verb.charAt(0).toUpperCase() + verb.slice(1) + " ") + predicate;
                explanation = `As stated in the reference notes: "${subject}" ${verb} ${predicate}.`;
            } else {
                qText = `Which of the following statements regarding "${detectedTopic}" is factually accurate based on the material?`;
                correctAns = stmt;
            }

            // Synthesize 3 realistic distractors from context
            const distractors = [];
            const termA = conceptTerms[idx % conceptTerms.length] || "secondary feature mapping";
            const termB = conceptTerms[(idx + 1) % conceptTerms.length] || "parameterized optimization";
            const termC = conceptTerms[(idx + 2) % conceptTerms.length] || "classical state evaluation";

            distractors.push(`It relies exclusively on ${termA} to bypass convergence latency.`);
            distractors.push(`It replaces iterative training with fixed ${termB} transformations.`);
            distractors.push(`It requires manual intervention to adjust ${termC} parameters.`);

            const correctIdx = (idx * 2 + 1) % 4;
            const options = [];
            let dCount = 0;
            for (let i = 0; i < 4; i++) {
                if (i === correctIdx) {
                    options.push(correctAns);
                } else {
                    options.push(distractors[dCount++] || `Alternative mechanism ${i + 1}`);
                }
            }

            return {
                question: qText,
                question_image: "",
                options: options,
                option_images: ["", "", "", ""],
                correct_option: correctIdx,
                explanation: explanation
            };
        });

        return res.status(200).json({
            success: true,
            topic: detectedTopic,
            difficulty,
            count: questions.length,
            questions
        });
    } catch (err) {
        console.error("GenerateQuestionsFromNotes error:", err);
        return res.status(500).json({ error: "Failed to generate questions: " + err.message });
    }
}

module.exports = {
    DisplayTests,
    GetTestById,
    CreateTest,
    SubmitTest,
    GetEducatorSubmissions,
    GetMySubmissions,
    DeleteTest,
    DeleteSubmission,
    DeleteSubmissionRecording,
    ClearAllSubmissions,
    ExtractDocumentText,
    GenerateQuestionsFromNotes,
    defaultSampleTests
};

