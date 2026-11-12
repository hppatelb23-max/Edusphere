const Admins = require('../models/admin_schema');
const Users = require('../models/user_schema');
const {getuser} = require('../service/auth');

// allowing only the loggin user to see the courses
async function allow_login_user(req , res , next){
    
    let token;
   
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try{
            token = req.headers.authorization.split(' ')[1];
            //decode token id
            const decoded = getuser(token);
            req.user = await Users.findById(decoded.id);
            next();
        }
        catch(e){
            res.status(401).json({
            error: "Un Authorized",
            status: false,
            });
        }
    }else{
        res.status(401).json({
          error: "UnAuthorized",
          status: false,
        });
    }
    
}


async function allow_login_admin(req , res , next){
    
    let token;
   
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try{
            token = req.headers.authorization.split(' ')[1];
            //decode token id
            const decoded = getuser(token);
            req.user = await Admins.findById(decoded.id);
            next();
        }
        catch(e){
            res.status(401).json({
            error: "Un Authorized",
            status: false,
            });
        }
    }else{
        res.status(401).json({
          error: "UnAuthorized",
          status: false,
        });
    }
    
}

module.exports = {allow_login_user , allow_login_admin};