const  Users = require('../models/user_schema');
const Courses = require("../models/course_schema");
const Transactions = require("../models/transaction_history")
const {get_token} = require('../service/auth');


async function VerifyUser(req ,res){
    try{
        const {wallet_id} = req.body;

        if(!wallet_id){
            return res.status(400).json({error : 'Metamask Wallet Id is required'})
        }

        const user = await Users.findOne({
            metamask_wallet_id: { $regex: new RegExp(`^${wallet_id}$`, 'i') }
        });

        if(!user){
            return res.status(404).json({error : "No User Found. Verify Wallet Id."});
        }

        const token = get_token(user);

        return res.status(200).json({
            message : "Student Logged in successfully",
            data : {
                id : user._id,
                wallet_id : user.metamask_wallet_id
            },
            token : token
        });
    }
    catch(error){
        return res.status(500).json({error : "Error with the server"})
    } 
}


async function CreateUser(req , res){
    try{
        const {username , wallet_id} = req.body;

        if(!username || !wallet_id){
            return res.status(400).json({error : 'All fields are required.'})
        }
        
        let user = await Users.findOne({
            metamask_wallet_id: { $regex: new RegExp(`^${wallet_id}$`, 'i') }
        });

        if (user) {
            user.user_name = username;
            await user.save();
        } else {
            user = await Users.create({
                user_name: username,
                metamask_wallet_id: wallet_id
            });
        }

        if(!user){
            return res.status(400).json({error : "Error in adding details of Student."});
        }

        const token = get_token(user);

        return res.status(200).json({
            message : "Student Signed up successfully",
            data:{
                id : user._id,
                wallet_id : user.metamask_wallet_id,
            },
            token : token
        });
    }catch(error){
        return res.status(500).json({error : "Error with the server"})
    }
}

async function DisplayMyLearning(req , res){
    try{
        if(!req.user){
            return res.status(400).json({error : "User is not logged in or Signed up."});
        }
        
        const id = req.user._id;
    
        const user = await Users.findById(id).populate("courses_enrolled").populate("courses_completed");
    
        
        return res.status(200).json({
            message : "Courses fetched successfully",
            courses_enrolled : user.courses_enrolled ,
            courses_completed : user.courses_completed
        });
        
    }catch(error){
        return res.status(500).json({error : "Error with the server"})
    }
}

async function DisplayTransactionHistory(req , res){
    try{
        if(!req.user){
            return res.status(201).json({error : "User is not logged in or Signed up"});   
        }

        const id = req.user._id;

        try{
            const user_transactions = await Transactions.find({user_id : id}).populate("courses_purchased");;
            if(!user_transactions){
                return res.status(201).json({error : "No Transaction done yet" , transaction_history: []});
            }else{
                return res.status(200).json({message : "Transactions history fetched successfully", transaction_history : user_transactions});
            }
        }catch(error){
            return res.status(500).json({error : "Error fetching Transaction history"})
        }

    }catch(error){
        return res.status(500).json({error : "Error with the server"})
    }
}

async function PurchaseCourse(req, res) {
    try {
        if (!req.user) {
            return res.status(400).json({ error: "User is not logged in or Signed up" });
        }
        const { course_id, transaction_id } = req.body;
        if (!course_id) {
            return res.status(400).json({ error: "Course ID is required." });
        }

        const mongoose = require("mongoose");
        let course = null;
        if (mongoose.Types.ObjectId.isValid(course_id)) {
            course = await Courses.findById(course_id);
        }
        if (!course) {
            course = await Courses.findOne({ title: course_id });
        }

        if (!course) {
            return res.status(404).json({ error: "Course not found in catalog." });
        }

        const courseIdStr = course._id.toString();
        const alreadyEnrolled = req.user.courses_enrolled.some(id => id.toString() === courseIdStr);
        if (alreadyEnrolled) {
            return res.status(200).json({ message: "Course already purchased." });
        }

        req.user.courses_enrolled.push(course._id);
        await req.user.save();

        course.buy_count = (course.buy_count || 0) + 1;
        await course.save();

        const new_transaction = await Transactions.create({
            user_id: req.user._id,
            transaction_address: transaction_id || ("tx_" + Date.now()),
            courses_purchased: course._id
        });

        return res.status(200).json({
            message: "Course purchased successfully.",
            transaction_id: new_transaction._id
        });

    } catch (error) {
        console.error("Purchase error:", error);
        return res.status(500).json({ error: "Error with the server" });
    }
}

async function GetCoins(req,res){
    try{
        if(!req.user){
            return res.status(401).json({error : "Unauthorized Access"})
        }
        const user = await Users.findById(req.user._id);
        const coins = user.coins;
        return res.status(200).json({message : "Coins fetched successfully", coins : coins});
    }catch(error){
        return res.status(500).json({error : "Error with the server"})
    }
}

async function UpdateCoins(req,res){
    try{
        if(!req.user){
            return res.status(401).json({error : "Unauthorized Access"})
        }
        const user = await Users.findById(req.user._id);
        const {coins} = req.body;   
        user.coins = coins;
        await user.save();

        return res.status(200).json({message : "Coins updated successfully", coins : coins});
    }catch(error){
        return res.status(500).json({error : "Error with the server"})
    }
}

module.exports = {
    VerifyUser,
    CreateUser,
    DisplayMyLearning,
    DisplayTransactionHistory,
    PurchaseCourse,
    GetCoins,
    UpdateCoins
};