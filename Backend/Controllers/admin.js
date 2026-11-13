const Admins = require('../models/admin_schema');
const Courses = require('../models/course_schema');
const { get_token } = require('../service/auth');

async function CreateAdmin(req , res){
    try{
        const {username , wallet_id} = req.body;

        if(!username || !wallet_id){
            return res.status(400).json({message : "Please fill all fields" })
        }

        let admin = await Admins.findOne({
            metamask_wallet_id: { $regex: new RegExp(`^${wallet_id}$`, 'i') }
        });

        if (admin) {
            admin.admin_name = username;
            await admin.save();
        } else {
            admin = await Admins.create({
                admin_name : username,
                metamask_wallet_id : wallet_id
            });
        }

        if(!admin){
            return res.status(400).json({error : "Error Signing up the admin"});
        }

        const token = get_token(admin)

        return res.status(200).json({
            message : "Admin created successfully",
            data : {
                id : admin._id,
                name : admin.admin_name,
                wallet_id : admin.metamask_wallet_id
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
                name : admin.admin_name,
                wallet_id : admin.metamask_wallet_id,
                courses : admin.courses_created,
            },
            token : token
        });
    }
    catch(error){
        return res.status(500).json({error : "Error with the server"})
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
        }
        return res.status(200).json({ message: "Course added Successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Error with the server" });
    }
}

async function GetCourses(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized Access" });
        }
        const id = req.user._id;
        const admin = await Admins.findById(id).populate('courses_created');
        if (!admin) {
            return res.status(404).json({ error: "No Admin Found." });
        }
        if (admin.courses_created.length === 0) {
            return res.status(200).json({ message: "No Courses Found", courses: [] });
        }

        // Deduplicate populated courses and filter out any deleted/null entries
        const seenIds = new Set();
        const seenTitles = new Set();
        const uniqueCourses = [];
        const cleanIds = [];

        admin.courses_created.forEach(course => {
            if (course && course._id) {
                const sid = course._id.toString();
                const normTitle = (course.title || "").toLowerCase().trim();
                if (!seenIds.has(sid) && (!normTitle || !seenTitles.has(normTitle))) {
                    seenIds.add(sid);
                    if (normTitle) seenTitles.add(normTitle);
                    uniqueCourses.push(course);
                    cleanIds.push(course._id);
                }
            }
        });

        // Automatically clean up duplicate IDs in database if found
        if (cleanIds.length !== admin.courses_created.length) {
            admin.courses_created = cleanIds;
            await admin.save();
        }

        return res.status(200).json({ message: "Courses fetched Successfully", courses: uniqueCourses });
    } catch (error) {
        return res.status(500).json({ error: "Error with the server" });
    }
}

async function DeleteCourse(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized Access" });
        }

        const { courseid } = req.body;
        const admin = await Admins.findById(req.user._id);
        if (!admin) {
            return res.status(404).json({ error: "No Admin Found." });
        }

        // Convert to string before filtering to ensure proper comparison
        const new_courses = admin.courses_created.filter(course_id => course_id.toString() !== courseid);

        admin.courses_created = new_courses;
        await admin.save();

        // Use Promise.all to fetch updated courses properly, filter out nulls
        const updated_courses = (await Promise.all(new_courses.map(course_id => Courses.findById(course_id)))).filter(Boolean);

        return res.status(200).json({ message: "Course Deleted Successfully", courses: updated_courses });
    } catch (error) {
        console.error("Error deleting course:", error);
        return res.status(500).json({ error: "Error with the server" });
    }
}

// ─── GET EDUCATOR INR EARNINGS & BALANCE ──────────────────────────────────────
async function GetAdminEarnings(req, res) {
    try {
        let admin = req.user;
        const wallet = req.query.wallet || req.headers["x-wallet-address"] || "";
        const name = req.query.name || "";

        if (!admin && wallet) {
            admin = await Admins.findOne({ metamask_wallet_id: { $regex: new RegExp(`^${wallet}$`, "i") } });
        }
        if (!admin && name) {
            admin = await Admins.findOne({ admin_name: { $regex: new RegExp(`^${name}$`, "i") } });
        }
        if (!admin) {
            admin = await Admins.findOne();
        }

        const inrEarnings = admin ? (admin.inr_earnings || 0) : 0;
        const inrBalance = admin ? (admin.inr_balance || 0) : 0;

        return res.status(200).json({
            success: true,
            inr_earnings: inrEarnings,
            inr_balance: inrBalance,
            educator_name: admin?.admin_name || "Educator",
            wallet_id: admin?.metamask_wallet_id || ""
        });
    } catch (error) {
        return res.status(500).json({ error: "Error fetching admin earnings: " + error.message });
    }
}

module.exports = {
    CreateAdmin,
    VerifyAdmin,
    GetCourses,
    DeleteCourse,
    AddCourse,
    GetAdminEarnings
};