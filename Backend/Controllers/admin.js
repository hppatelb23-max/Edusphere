const Admins = require('../models/admin_schema');
const Courses = require('../models/course_schema');
const Transactions = require('../models/transaction_history');
const { get_token } = require('../service/auth');
const { persistModel } = require('../utils/persistence');

async function CreateAdmin(req , res){
    try{
        const {username , wallet_id} = req.body;

        if(!username || !wallet_id){
            return res.status(400).json({message : "Please fill all fields" })
        }

        const cleanName = String(username).trim();
        const cleanWallet = String(wallet_id).trim();

        let admin = await Admins.findOne({
            metamask_wallet_id: { $regex: new RegExp(`^${cleanWallet}$`, 'i') }
        });

        if (admin) {
            // Check if this account already has a locked name from now onwards
            if (admin.locked_account_name && admin.locked_account_name.trim()) {
                if (admin.locked_account_name.trim().toLowerCase() !== cleanName.toLowerCase()) {
                    return res.status(403).json({
                        error: "Incorrect username! Please write the right correct username to save and continue."
                    });
                }
            } else {
                // First save & continue from now onwards: permanently lock this name to this account
                admin.locked_account_name = cleanName;
            }
            admin.admin_name = cleanName;
            await admin.save();
        } else {
            // Brand new account: create and permanently lock name
            admin = await Admins.create({
                admin_name : cleanName,
                metamask_wallet_id : cleanWallet,
                locked_account_name: cleanName
            });
        }

        if(!admin){
            return res.status(400).json({error : "Error Signing up the admin"});
        }

        await persistModel('admins', Admins);

        const token = get_token(admin)

        return res.status(200).json({
            message : "Admin created successfully",
            data : {
                id : admin._id,
                name : admin.locked_account_name || admin.admin_name,
                wallet_id : admin.metamask_wallet_id,
                locked_account_name: admin.locked_account_name || admin.admin_name,
                inr_balance: admin.inr_balance !== undefined ? admin.inr_balance : (admin.inr_earnings || 0),
                inr_earnings: admin.inr_earnings || 0
            },
            token : token
        });

    }catch(error){
        return res.status(500).json({error : `${error}`})
    }
}

async function VerifyAdmin(req ,res){
    try{
        const {wallet_id} = req.body;

        if(!wallet_id){
            return res.status(400).json({error : 'Metamask Wallet Id is required'})
        }

        const admin = await Admins.findOne({
            metamask_wallet_id: { $regex: new RegExp(`^${wallet_id}$`, 'i') }
        });

        if(!admin){
            return res.status(404).json({error : "No Admin Found. Verify Wallet Id."});
        }

        const token = get_token(admin);

        return res.status(200).json({
            message : "Admin Logged in successfully",
            data : {
                id : admin._id,
                name : admin.locked_account_name || admin.admin_name,
                wallet_id : admin.metamask_wallet_id,
                locked_account_name: admin.locked_account_name || admin.admin_name,
                courses : admin.courses_created,
                inr_balance: admin.inr_balance !== undefined ? admin.inr_balance : (admin.inr_earnings || 0),
                inr_earnings: admin.inr_earnings || 0
            },
            token : token
        });
    }
    catch(error){
        return res.status(500).json({error : "Error with the server"})
    } 
}

async function GetAdminLockedName(req, res) {
    try {
        const wallet = req.query.wallet_id || req.query.wallet || req.headers["x-wallet-address"];
        if (!wallet) return res.status(400).json({ error: "wallet_id required" });
        const admin = await Admins.findOne({ metamask_wallet_id: { $regex: new RegExp(`^${wallet}$`, 'i') } });
        return res.status(200).json({
            locked_name: admin?.locked_account_name || null,
            admin_name: admin?.admin_name || null
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}

async function AddCourse(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized Access" });
        }
        const { course_id } = req.body;
        if (!course_id) {
            return res.status(400).json({ error: "Missing course_id" });
        }
        const exists = req.user.courses_created.some(cid => cid.toString() === course_id.toString());
        if (!exists) {
            req.user.courses_created.push(course_id);
            await req.user.save();
            await persistModel('admins', Admins);
        }
        return res.status(200).json({ message: "Course added Successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Error with the server" });
    }
}

async function GetCourses(req, res) {
    try {
        const wallet = req.query.wallet || req.headers["x-wallet-address"] || req.user?.metamask_wallet_id || "";
        const name = req.query.name || req.user?.admin_name || "";

        let admin = null;
        if (req.user && req.user.admin_name) {
            admin = req.user;
        } else if (wallet) {
            admin = await Admins.findOne({ metamask_wallet_id: { $regex: new RegExp(`^${wallet}$`, "i") } });
        }
        if (!admin && name) {
            admin = await Admins.findOne({
                $or: [
                    { admin_name: { $regex: new RegExp(`^${name}$`, "i") } },
                    { locked_account_name: { $regex: new RegExp(`^${name}$`, "i") } }
                ]
            });
        }
        if (!admin) {
            admin = await Admins.findOne();
        }

        const effectiveWallet = wallet || admin?.metamask_wallet_id || "";
        const effectiveName = admin?.admin_name || admin?.locked_account_name || name || "";

        const queryOr = [];
        if (effectiveWallet) {
            queryOr.push({ author_wallet_id: { $regex: new RegExp(`^${effectiveWallet}$`, "i") } });
        }
        if (effectiveName) {
            queryOr.push({ author_name: { $regex: new RegExp(`^${effectiveName}$`, "i") } });
        }
        if (admin && admin.courses_created && admin.courses_created.length > 0) {
            queryOr.push({ _id: { $in: admin.courses_created } });
        }

        let authoredCourses = [];
        if (queryOr.length > 0) {
            authoredCourses = await Courses.find({
                $or: queryOr,
                is_deleted_by_author: { $ne: true }
            }).sort({ createdAt: -1 });
        }

        return res.status(200).json({
            message: "Courses fetched Successfully",
            courses: authoredCourses || []
        });
    } catch (error) {
        return res.status(500).json({ error: "Error with the server: " + error.message });
    }
}

async function DeleteCourse(req, res) {
    try {
        const courseid = req.body.courseid || req.body.course_id || req.body.id;
        if (!courseid) {
            return res.status(400).json({ error: "courseid is required." });
        }

        // Web3 Permanent Access: Mark course as delisted and deleted by author
        // so it is removed from educator's manage courses and public catalog,
        // BUT preserved for any student who already enrolled / paid for it!
        const existingCourse = await Courses.findById(courseid);
        if (existingCourse) {
            existingCourse.is_delisted = true;
            existingCourse.is_deleted_by_author = true;
            await existingCourse.save();
        }

        // 2. Remove from admin/educator record
        const wallet = req.headers["x-wallet-address"] || req.body.wallet || "";
        let admin = req.user ? await Admins.findById(req.user._id) : null;
        if (!admin && wallet) {
            admin = await Admins.findOne({ metamask_wallet_id: { $regex: new RegExp(`^${wallet}$`, "i") } });
        }

        if (admin) {
            admin.courses_created = (admin.courses_created || []).filter(c => c && c.toString() !== String(courseid));
            await admin.save();
        }

        // Persist updates to disk immediately
        await persistModel('courses', Courses);
        await persistModel('admins', Admins);

        // 3. Return remaining active courses for this educator
        let remainingCourses = [];
        if (wallet) {
            remainingCourses = await Courses.find({
                author_wallet_id: { $regex: new RegExp(`^${wallet}$`, "i") },
                is_deleted_by_author: { $ne: true }
            });
        } else if (admin) {
            remainingCourses = (await Promise.all(admin.courses_created.map(id => Courses.findOne({ _id: id, is_deleted_by_author: { $ne: true } })))).filter(Boolean);
        }

        return res.status(200).json({
            message: "Course removed from educator catalog successfully. Existing enrolled students retain lifetime access.",
            courses: remainingCourses
        });
    } catch (error) {
        console.error("Error deleting course:", error);
        return res.status(500).json({ error: "Error with the server: " + error.message });
    }
}

// ─── GET EDUCATOR INR EARNINGS & BALANCE ──────────────────────────────────────
async function GetAdminEarnings(req, res) {
    try {
        let admin = req.user;
        const wallet = String(req.query.wallet || req.headers["x-wallet-address"] || "").trim();
        const name = String(req.query.name || "").trim();

        if (!admin && wallet) {
            admin = await Admins.findOne({ metamask_wallet_id: { $regex: new RegExp(`^${wallet}$`, "i") } });
        }
        if (!admin && name) {
            admin = await Admins.findOne({
                $or: [
                    { admin_name: { $regex: new RegExp(`^${name}$`, "i") } },
                    { locked_account_name: { $regex: new RegExp(`^${name}$`, "i") } }
                ]
            });
        }
        // Only fallback to first admin if NO wallet and NO name was supplied
        if (!admin && !wallet && !name) {
            admin = await Admins.findOne();
        }

        const inrEarnings = admin ? (admin.inr_earnings || 0) : 0;
        const inrBalance = admin ? (admin.inr_balance !== undefined ? admin.inr_balance : (admin.inr_earnings || 0)) : 0;

        return res.status(200).json({
            success: true,
            inr_earnings: inrEarnings,
            inr_balance: inrBalance,
            educator_name: admin?.admin_name || name || "Educator",
            wallet_id: admin?.metamask_wallet_id || wallet || ""
        });
    } catch (error) {
        return res.status(500).json({ error: "Error fetching admin earnings: " + error.message });
    }
}

// ─── ADD EDUCATOR CASH (MAX ₹2000 AT A TIME) ──────────────────────────────────
async function AddAdminCash(req, res) {
    try {
        let admin = req.user;
        const { amount, wallet, name, payment_method } = req.body;
        const addAmount = Number(amount || 0);

        if (addAmount <= 0) {
            return res.status(400).json({ error: "Please enter a valid amount greater than ₹0." });
        }
        if (addAmount > 2000) {
            return res.status(400).json({ error: "Maximum amount that can be added at a time is ₹2000 only." });
        }

        const cleanWallet = String(wallet || "").trim();
        const cleanName = String(name || "").trim();

        if (!admin && cleanWallet) {
            admin = await Admins.findOne({ metamask_wallet_id: { $regex: new RegExp(`^${cleanWallet}$`, "i") } });
        }
        if (!admin && cleanName) {
            admin = await Admins.findOne({
                $or: [
                    { admin_name: { $regex: new RegExp(`^${cleanName}$`, "i") } },
                    { locked_account_name: { $regex: new RegExp(`^${cleanName}$`, "i") } }
                ]
            });
        }
        if (!admin) {
            admin = await Admins.findOne();
        }

        if (!admin && cleanWallet) {
            admin = await Admins.create({
                admin_name: cleanName || "Educator",
                metamask_wallet_id: cleanWallet,
                locked_account_name: cleanName || null,
                inr_balance: addAmount,
                inr_earnings: 0
            });
        } else if (!admin && cleanName) {
            admin = await Admins.create({
                admin_name: cleanName,
                metamask_wallet_id: cleanWallet || `edu_${Date.now()}`,
                locked_account_name: cleanName,
                inr_balance: addAmount,
                inr_earnings: 0
            });
        } else if (admin) {
            const currentBal = admin.inr_balance !== undefined ? admin.inr_balance : (admin.inr_earnings || 0);
            admin.inr_balance = currentBal + addAmount;
            if (cleanName && (!admin.admin_name || admin.admin_name === "Educator")) {
                admin.admin_name = cleanName;
            }
            if (cleanWallet && !admin.metamask_wallet_id) {
                admin.metamask_wallet_id = cleanWallet;
            }
            await admin.save();
        }

        await persistModel('admins', Admins);
        const finalBal = admin ? admin.inr_balance : addAmount;

        // Save transaction history for educator adding money
        let savedTxn = null;
        try {
            const depTxId = `DEP-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
            const adminWallet = cleanWallet || admin?.metamask_wallet_id || "";
            const adminName = admin?.admin_name || admin?.locked_account_name || cleanName || "Educator";
            
            const mongoose = require("mongoose");
            let validUserId = undefined;
            if (admin?._id && mongoose.Types.ObjectId.isValid(String(admin._id))) {
                validUserId = admin._id;
            }

            savedTxn = await Transactions.create({
                user_id: validUserId,
                student_name: adminName,
                student_wallet: adminWallet,
                educator_name: adminName,
                educator_wallet: adminWallet,
                transaction_address: depTxId,
                bank_utr: depTxId,
                blockchain_hash: "0x" + require("crypto").createHash("sha256").update(`${adminWallet}:${depTxId}:${Date.now()}`).digest("hex"),
                courses_purchased: null,
                payment_method: payment_method || "Added Money to Wallet",
                amount: addAmount,
                currency: "INR",
                status: "SUCCESS"
            });
            await persistModel('transactions', Transactions);
        } catch (tErr) {
            console.error("Error creating add-cash transaction for admin:", tErr);
        }

        return res.status(200).json({
            success: true,
            message: `Added ₹${addAmount} Indian Rupees!`,
            new_balance: finalBal,
            transaction: savedTxn
        });
    } catch (err) {
        return res.status(500).json({ error: "Error adding admin cash: " + err.message });
    }
}

module.exports = {
    CreateAdmin,
    VerifyAdmin,
    GetAdminLockedName,
    GetCourses,
    DeleteCourse,
    AddCourse,
    GetAdminEarnings,
    AddAdminCash
};
