const Courses = require("../models/course_schema");
const Admins = require("../models/admin_schema");
const fs = require("fs");
const path = require("path");

const defaultCourses = [
    {
        title: "Full-Stack Web3 & Smart Contract Engineering",
        description: "Master smart contract development using Solidity, Hardhat, Ethers.js, and Wagmi. Build production-grade decentralized applications from scratch.",
        author_name: "Dr. Alex Rivera",
        author_wallet_id: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        category: ["Web3", "Solidity", "Ethereum"],
        course_points: 250,
        course_price: 0.08,
        buy_count: 142,
        course_image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
        course_video: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"]
    },
    {
        title: "Decentralized Finance (DeFi) Protocol Architecture",
        description: "Deep dive into Automated Market Makers (AMMs), yield farming, liquidity pools, flash loans, and staking mechanics on Ethereum and Layer 2s.",
        author_name: "Elena Rostova",
        author_wallet_id: "0x3C44CdD45969428583546463b6080B65f2557596",
        category: ["DeFi", "Finance", "Crypto"],
        course_points: 300,
        course_price: 0.12,
        buy_count: 98,
        course_image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80",
        course_video: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"]
    },
    {
        title: "Modern React 19 & Next.js 15 Masterclass",
        description: "Learn server components, streaming SSR, modern custom hooks, state management, and high-performance frontend engineering.",
        author_name: "Marcus Chen",
        author_wallet_id: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        category: ["Frontend", "React", "JavaScript"],
        course_points: 200,
        course_price: 0.05,
        buy_count: 215,
        course_image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
        course_video: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"]
    },
    {
        title: "Artificial Intelligence & Deep Learning with PyTorch",
        description: "Build neural networks, train transformers, explore computer vision, and deploy cutting-edge AI models to production scalable systems.",
        author_name: "Dr. Sophia Vance",
        author_wallet_id: "0x15d34AA54267DB7D7c367839AAf71A00a2C6A65E",
        category: ["AI & ML", "Python", "Data Science"],
        course_points: 400,
        course_price: 0.15,
        buy_count: 310,
        course_image: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
        course_video: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"]
    },
    {
        title: "Smart Contract Auditing & Security Vulnerabilities",
        description: "Identify reentrancy attacks, integer overflows, access control bugs, and front-running risks using Slither, Echidna, and Foundry.",
        author_name: "Vikram Patel",
        author_wallet_id: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
        category: ["Security", "Solidity", "Audit"],
        course_points: 500,
        course_price: 0.20,
        buy_count: 175,
        course_image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
        course_video: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"]
    },
    {
        title: "Zero-Knowledge Proofs & zkEVM Cryptography",
        description: "Explore Circom, zk-SNARKs, Groth16, and rollup scaling architectures powering next-generation privacy-preserving blockchains.",
        author_name: "Satoshi Dev",
        author_wallet_id: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
        category: ["Cryptography", "ZKP", "Layer 2"],
        course_points: 600,
        course_price: 0.25,
        buy_count: 88,
        course_image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
        course_video: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"]
    },
    {
        title: "Rust Programming for Solana & Systems Engineering",
        description: "Write lightning-fast, memory-safe programs in Rust. Build decentralized applications and smart contracts on Solana using Anchor.",
        author_name: "Lucas Meyer",
        author_wallet_id: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
        category: ["Rust", "Solana", "Systems"],
        course_points: 350,
        course_price: 0.10,
        buy_count: 164,
        course_image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
        course_video: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"]
    },
    {
        title: "DAO Architecture & Governance Protocol Design",
        description: "Design decentralized autonomous organizations with Snapshot voting, multi-sig treasuries, tokenomics, and governance execution.",
        author_name: "Sarah Jenkins",
        author_wallet_id: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
        category: ["Governance", "DAO", "Web3"],
        course_points: 180,
        course_price: 0.06,
        buy_count: 112,
        course_image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
        course_video: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"]
    }
];

async function seedDefaultCoursesIfEmpty() {
    try {
        const count = await Courses.countDocuments();
        if (count === 0) {
            // Check if there is an existing admin whose wallet can be used
            const firstAdmin = await Admins.findOne();
            const adminWallet = firstAdmin?.metamask_wallet_id;
            const coursesToInsert = defaultCourses.map(c => ({
                ...c,
                author_wallet_id: adminWallet || c.author_wallet_id
            }));
            await Courses.insertMany(coursesToInsert);
            console.log("Seeded default catalog courses into database.");
        }
    } catch (e) {
        console.warn("Could not seed default courses:", e.message);
    }
}

async function DisplayCourses(req, res) {
    try {
        await seedDefaultCoursesIfEmpty();
        const allCourses = await Courses.find().sort({ createdAt: -1 });

        // Deduplicate courses by ID and normalized title so courses never appear twice
        const seenIds = new Set();
        const seenTitles = new Set();
        const uniqueCourses = [];

        allCourses.forEach(c => {
            if (!c) return;
            const sid = c._id.toString();
            const normTitle = (c.title || "").toLowerCase().trim();
            if (!seenIds.has(sid) && (!normTitle || !seenTitles.has(normTitle))) {
                seenIds.add(sid);
                if (normTitle) seenTitles.add(normTitle);
                uniqueCourses.push(c);
            }
        });

        return res.status(200).json({
            message: "Courses fetched successfully.",
            courses: uniqueCourses
        });
    } catch (err) {
        return res.status(500).json({ error: "Error with the server: " + err.message });
    }
}

async function UploadCourse(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized Access" });
        }
        const { title, description, price, category, image_hash, video_hash, author_wallet_id } = req.body;
        if (!title || !description || price === undefined || !image_hash || !video_hash) {
            return res.status(400).json({ error: "Please fill all fields." });
        }

        const admin = await Admins.findById(req.user._id);
        const resolvedWallet = admin?.metamask_wallet_id || author_wallet_id;
        const resolvedName = admin?.admin_name || "Educator";

        if (!resolvedWallet) {
            return res.status(400).json({ error: "No MetaMask wallet found for this educator." });
        }

        // Prevent duplicate creation of identical course
        const existingCourse = await Courses.findOne({
            title: title.trim(),
            author_wallet_id: resolvedWallet
        });

        let course = existingCourse;
        if (!course) {
            course = await Courses.create({
                title: title.trim(),
                description: description,
                category: Array.isArray(category) ? category : [category || "General"],
                author_name: resolvedName,
                author_wallet_id: resolvedWallet,
                course_price: Number(price),
                course_image: image_hash,
                course_video: Array.isArray(video_hash) ? video_hash : [video_hash]
            });
        }

        if (!course) {
            return res.status(400).json({ error: "Error uploading course." });
        }

        // Deduplicated addition to admin's courses_created
        if (admin) {
            const exists = admin.courses_created.some(cid => cid.toString() === course._id.toString());
            if (!exists) {
                admin.courses_created.push(course._id);
                await admin.save();
            }
        }

        return res.status(200).json({ message: "Course uploaded successfully.", course: course });
    } catch (error) {
        return res.status(500).json({ error: `${error}` });
    }
}

async function GetCourseById(req, res) {
    try {
        const { id } = req.params;
        let course = null;
        if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
            course = await Courses.findById(id);
        }
        if (!course && id) {
            course = await Courses.findOne({ title: { $regex: new RegExp(`^${decodeURIComponent(id).trim()}$`, "i") } });
        }
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }
        return res.status(200).json({ course });
    } catch (err) {
        return res.status(500).json({ error: "Error fetching course: " + err.message });
    }
}

async function AddVideoToCourse(req, res) {
    try {
        const { id } = req.params;
        const { video_url } = req.body;
        if (!video_url) {
            return res.status(400).json({ error: "Video URL or IPFS hash is required." });
        }
        let course = null;
        if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
            course = await Courses.findById(id);
        }
        if (!course && id) {
            course = await Courses.findOne({ title: { $regex: new RegExp(`^${decodeURIComponent(id).trim()}$`, "i") } });
        }
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        course.course_video.push(video_url.trim());
        await course.save();

        return res.status(200).json({ message: "Video published successfully to course!", course });
    } catch (err) {
        return res.status(500).json({ error: "Error adding video: " + err.message });
    }
}

async function DeleteVideoFromCourse(req, res) {
    try {
        const { id } = req.params;
        const { video_index, video_url } = req.body;
        let course = null;
        if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
            course = await Courses.findById(id);
        }
        if (!course && id) {
            course = await Courses.findOne({ title: { $regex: new RegExp(`^${decodeURIComponent(id).trim()}$`, "i") } });
        }
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        if (typeof video_index === "number" && video_index >= 0 && video_index < course.course_video.length) {
            course.course_video.splice(video_index, 1);
        } else if (video_url) {
            course.course_video = course.course_video.filter(v => v !== video_url);
        } else {
            return res.status(400).json({ error: "Valid video index or URL required." });
        }

        await course.save();
        return res.status(200).json({ message: "Video deleted successfully from course!", course });
    } catch (err) {
        return res.status(500).json({ error: "Error deleting video: " + err.message });
    }
}

async function UploadMedia(req, res) {
    try {
        const { file_data, file_name, file_type } = req.body;
        if (!file_data) {
            return res.status(400).json({ error: "No file data received." });
        }

        let base64Data = file_data;
        let ext = ".mp4";

        if (typeof file_data === "string" && file_data.includes(";base64,")) {
            const parts = file_data.split(";base64,");
            const mime = parts[0];
            base64Data = parts[1];

            if (mime.includes("image/jpeg") || mime.includes("image/jpg")) ext = ".jpg";
            else if (mime.includes("image/png")) ext = ".png";
            else if (mime.includes("image/webp")) ext = ".webp";
            else if (mime.includes("image/gif")) ext = ".gif";
            else if (mime.includes("video/mp4")) ext = ".mp4";
            else if (mime.includes("video/webm")) ext = ".webm";
            else if (mime.includes("video/quicktime") || mime.includes("video/mov")) ext = ".mov";
            else if (mime.includes("video/ogg")) ext = ".ogv";
        } else if (file_name && file_name.lastIndexOf(".") !== -1) {
            ext = path.extname(file_name);
        }

        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const safePrefix = (file_name ? file_name.split(".")[0] : "upload")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 30);
        const fileName = `${Date.now()}_${safePrefix}${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        const buffer = Buffer.from(base64Data, "base64");
        fs.writeFileSync(filePath, buffer);

        const host = req.get("host") || "localhost:5000";
        const protocol = req.protocol || "http";
        const fullUrl = `${protocol}://${host}/uploads/${fileName}`;
        const relativeUrl = `/uploads/${fileName}`;

        return res.status(200).json({
            message: "File uploaded successfully.",
            url: fullUrl,
            relativeUrl: relativeUrl,
            fileName: fileName
        });
    } catch (err) {
        console.error("UploadMedia error:", err);
        return res.status(500).json({ error: "Failed to upload file: " + err.message });
    }
}

module.exports = {
    DisplayCourses,
    UploadCourse,
    GetCourseById,
    AddVideoToCourse,
    DeleteVideoFromCourse,
    UploadMedia
};