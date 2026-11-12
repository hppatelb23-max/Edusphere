const Users = require("../models/user_schema");
const Tests = require("../models/test_schema");

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

            // Hide correct_option and explanation for active test delivery
            const sanitizedQuestions = selectedQuestions.map((q) => ({
                _id: q._id,
                question: q.question,
                options: q.options
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

        // Validate each question format
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
                return res.status(400).json({ error: `Question ${i + 1} must have question text and at least 2 options.` });
            }
            if (q.correct_option === undefined || q.correct_option < 0 || q.correct_option >= q.options.length) {
                return res.status(400).json({ error: `Question ${i + 1} has an invalid correct option index.` });
            }
        }

        const newTest = await Tests.create({
            title: title.trim(),
            description: description.trim(),
            category: Array.isArray(category) ? category : [category || "General"],
            difficulty: difficulty || "Intermediate",
            duration_minutes: Number(duration_minutes) || 15,
            passing_score: Number(passing_score) || 60,
            pick_random_count: Math.min(Number(pick_random_count) || questions.length, questions.length),
            author_wallet_id: author_wallet_id,
            author_name: author_name || "Educator",
            questions: questions
        });

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
        const { test_id, student_wallet_id, student_name, answers, recording_id, proctor_logs } = req.body;
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

        const test = await Tests.findById(test_id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found.' });
        }

        // Grade submission
        let correctCount = 0;
        const totalQuestions = answers.length;
        const detailedReview = [];

        answers.forEach((ans) => {
            const originalQ = test.questions.id(ans.question_id);
            if (originalQ) {
                const isCorrect = originalQ.correct_option === ans.selected_option;
                if (isCorrect) correctCount++;

                detailedReview.push({
                    question_id: originalQ._id,
                    question: originalQ.question,
                    options: originalQ.options,
                    selected_option: ans.selected_option,
                    correct_option: originalQ.correct_option,
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
            recording_id: recording_id || "",
            proctor_logs: Array.isArray(proctor_logs) ? proctor_logs : [],
            submitted_at: new Date(),
            answers: detailedReview
        });

        // Increment attempts count
        test.attempts_count = (test.attempts_count || 0) + 1;
        await test.save();

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
                recording_id: recording_id || "",
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
        const { student_wallet } = req.query;
        if (!student_wallet) {
            return res.status(400).json({ error: "student_wallet query parameter is required." });
        }

        const tests = await Tests.find({
            "submissions.student_wallet_id": { $regex: new RegExp(`^${student_wallet}$`, "i") }
        }).select("title author_name passing_score submissions");

        const mySubmissions = [];
        tests.forEach(t => {
            if (Array.isArray(t.submissions)) {
                t.submissions.forEach(sub => {
                    if (sub.student_wallet_id && sub.student_wallet_id.toLowerCase() === student_wallet.toLowerCase()) {
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
        const test = await Tests.findById(id);
        if (!test) return res.status(404).json({ error: "Test not found." });
        await Tests.findByIdAndDelete(id);
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
    defaultSampleTests
};

